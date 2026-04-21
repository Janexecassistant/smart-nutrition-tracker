import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, foods, foodPortions, customFoods } from "@snt/db";
import { FoodSearchSchema, CreateCustomFoodSchema } from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import { searchFoods } from "../services/typesense";
import { searchOFF, lookupBarcode as lookupBarcodeOFF } from "../services/open-food-facts";
import { searchUSDA, lookupUSDABarcode } from "../services/usda";

export const foodRoutes = new Hono();

// ── Helper: fetch portions for a batch of food IDs ───────────────

async function getPortionsByFoodId(
  foodIds: string[]
): Promise<Map<string, any[]>> {
  const byFood = new Map<string, any[]>();
  if (foodIds.length === 0) return byFood;

  try {
    const rows = await db
      .select()
      .from(foodPortions)
      .where(inArray(foodPortions.foodId, foodIds))
      .orderBy(foodPortions.sequenceNumber);

    for (const r of rows) {
      const list = byFood.get(r.foodId) ?? [];
      list.push({
        id: r.id,
        amount: r.amount,
        unit: r.unit,
        modifier: r.modifier,
        description: r.description,
        gramWeight: r.gramWeight,
        sequenceNumber: r.sequenceNumber,
      });
      byFood.set(r.foodId, list);
    }
  } catch (err) {
    console.error("[Portions] Failed to fetch portions:", err);
  }

  return byFood;
}

// ── Search Foods ─────────────────────────────────────────────────
// Searches local DB first, then USDA + Open Food Facts in parallel
// for comprehensive branded + international coverage.

foodRoutes.get("/search", zValidator("query", FoodSearchSchema), async (c) => {
  const { query, limit, offset } = c.req.valid("query");

  let localResults: any[] = [];

  // 1. Try Typesense first (fast, typo-tolerant)
  let typesenseHit = false;
  try {
    const tsResult = await searchFoods({ query, limit, offset });
    localResults = tsResult.hits;
    typesenseHit = true;
  } catch {
    typesenseHit = false;
  }

  // 2. Fallback: Postgres full-text search on search_vector
  //    Strategy: tokenize query, build OR prefix tsquery (onion:* | sliced:*),
  //    rank with ts_rank_cd, then hard-boost whole-foods and unbranded entries
  //    so "onion sliced" returns "Onions, raw" before "Signature Sliced Onion
  //    Bagel". Falls back to ILIKE if tsquery parsing fails.
  if (!typesenseHit) {
    try {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[^a-z0-9]/g, ""))
        .filter((t) => t.length > 0);

      if (terms.length > 0) {
        // e.g. "onion sliced" → "onion:* | sliced:*"
        const tsqueryStr = terms.map((t) => `${t}:*`).join(" | ");
        // Substring pattern for tie-break / "exact phrase" boost.
        const fullPattern = `%${query.toLowerCase()}%`;
        const firstTerm = terms[0];
        const firstTermPattern = `%${firstTerm}%`;

        const rows = await db.execute(sql`
          SELECT
            f.id,
            f.name,
            f.brand,
            f.barcode,
            f.source,
            f.source_id,
            f.serving_size_g,
            f.serving_label,
            f.calories,
            f.protein_g,
            f.carbs_g,
            f.fat_g,
            f.fiber_g,
            f.sugar_g,
            f.sodium_mg,
            f.category,
            f.tags,
            f.is_verified,
            f.created_at,
            f.updated_at,
            ts_rank_cd(f.search_vector, q.tsq) AS rank
          FROM foods f,
               to_tsquery('english', ${tsqueryStr}) q(tsq)
          WHERE f.search_vector @@ q.tsq
          ORDER BY
            -- 1. Exact full-phrase matches in name win outright
            (LOWER(f.name) LIKE ${fullPattern}) DESC,
            -- 2. First-term matches in name (e.g. "onion..." when searching "onion sliced")
            (LOWER(f.name) LIKE ${firstTermPattern}) DESC,
            -- 3. Whole-foods (Foundation/SR Legacy with no brand) ranked above branded
            (f.brand IS NULL) DESC,
            ('whole_food' = ANY(f.tags)) DESC,
            -- 4. Full-text relevance
            ts_rank_cd(f.search_vector, q.tsq) DESC,
            -- 5. Shorter names win (less descriptive = more generic)
            LENGTH(f.name) ASC
          LIMIT ${limit}
          OFFSET ${offset};
        `);

        localResults = (rows as any[]).map((r: any) => ({
          id: r.id,
          name: r.name,
          brand: r.brand,
          barcode: r.barcode,
          source: r.source,
          sourceId: r.source_id,
          servingSizeG: r.serving_size_g,
          servingLabel: r.serving_label,
          calories: r.calories,
          proteinG: r.protein_g,
          carbsG: r.carbs_g,
          fatG: r.fat_g,
          fiberG: r.fiber_g,
          sugarG: r.sugar_g,
          sodiumMg: r.sodium_mg,
          category: r.category,
          tags: r.tags,
          isVerified: r.is_verified,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (err) {
      console.error("[Search] tsvector query failed, falling back to ILIKE:", err);
      // 3. Last-ditch fallback: Postgres ILIKE
      try {
        localResults = await db
          .select()
          .from(foods)
          .where(
            or(
              ilike(foods.name, `%${query}%`),
              ilike(foods.brand, `%${query}%`)
            )
          )
          .limit(limit)
          .offset(offset)
          .orderBy(foods.name);
      } catch {
        localResults = [];
      }
    }
  }

  // 3. Always supplement with external sources (USDA + OFF in parallel)
  //    USDA covers US name-brand products; OFF covers international items.
  let externalResults: any[] = [];
  const externalLimit = Math.max(limit - localResults.length, 15);

  try {
    const [usdaFoods, offFoods] = await Promise.allSettled([
      searchUSDA(query, externalLimit),
      searchOFF(query, Math.min(externalLimit, 10)),
    ]);

    const usdaResults =
      usdaFoods.status === "fulfilled" ? usdaFoods.value : [];
    const offResults =
      offFoods.status === "fulfilled" ? offFoods.value : [];

    console.log(
      `[Search] "${query}" → local: ${localResults.length}, USDA: ${usdaResults.length}, OFF: ${offResults.length}`
    );

    // Normalize USDA results with usda_ prefix
    const normalizedUSDA = usdaResults.map((f) => ({
      ...f,
      id: f.barcode ? `usda_${f.barcode}` : `usda_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      source: "usda",
      isVerified: true,
    }));

    // Normalize OFF results with off_ prefix
    const normalizedOFF = offResults.map((f) => ({
      ...f,
      id: `off_${f.barcode}`,
      source: "off",
      isVerified: true,
    }));

    externalResults = [...normalizedUSDA, ...normalizedOFF];
  } catch (err) {
    console.error("[Search] External search failed:", err);
  }

  // 4. Deduplicate: local first, then external (by name, case-insensitive)
  const seenNames = new Set(
    localResults.map((r: any) => r.name?.toLowerCase().trim())
  );
  const dedupedExternal = externalResults.filter((r) => {
    const key = r.name?.toLowerCase().trim();
    if (seenNames.has(key)) return false;
    seenNames.add(key); // Also dedupe across USDA and OFF
    return true;
  });

  const combined = [...localResults, ...dedupedExternal].slice(0, limit);

  // Attach food-specific portions (alt units like "1 cup sliced") to local
  // results. External (USDA live / OFF) results fall back to serving/g/oz
  // only — we don't have portion detail until they're persisted.
  const localIds = combined
    .map((f: any) => f.id)
    .filter(
      (id: string) =>
        typeof id === "string" &&
        !id.startsWith("usda_") &&
        !id.startsWith("off_")
    );
  const portionsByFood = await getPortionsByFoodId(localIds);

  const enriched = combined.map((f: any) => ({
    ...f,
    portions: portionsByFood.get(f.id) ?? [],
  }));

  return c.json({
    foods: enriched,
    query,
    total: enriched.length,
  });
});

// ── Barcode Lookup ───────────────────────────────────────────────
// Checks local DB → USDA → Open Food Facts (in order).

foodRoutes.get("/barcode/:code", async (c) => {
  const barcode = c.req.param("code");

  // 1. Check local DB
  const localResult = await db.query.foods.findFirst({
    where: eq(foods.barcode, barcode),
  });

  if (localResult) {
    const portionsByFood = await getPortionsByFoodId([localResult.id]);
    return c.json({
      food: {
        ...localResult,
        portions: portionsByFood.get(localResult.id) ?? [],
      },
      source: "local",
    });
  }

  // 2. Try USDA and OFF in parallel for faster response
  try {
    const [usdaResult, offResult] = await Promise.allSettled([
      lookupUSDABarcode(barcode),
      lookupBarcodeOFF(barcode),
    ]);

    const usda =
      usdaResult.status === "fulfilled" ? usdaResult.value : null;
    const off =
      offResult.status === "fulfilled" ? offResult.value : null;

    // Prefer USDA (more accurate nutrition data for US products)
    if (usda) {
      return c.json({
        food: {
          id: `usda_${usda.barcode || barcode}`,
          ...usda,
          barcode,
          isVerified: true,
        },
        source: "usda",
      });
    }

    if (off) {
      return c.json({
        food: {
          id: `off_${off.barcode}`,
          ...off,
          isVerified: true,
        },
        source: "off",
      });
    }
  } catch {
    // Both sources unavailable
  }

  return c.json({ error: "Food not found for this barcode" }, 404);
});

// ── Get Food by ID ────────────────────────────────────────────────

foodRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  const result = await db.query.foods.findFirst({
    where: eq(foods.id, id),
  });

  if (!result) {
    return c.json({ error: "Food not found" }, 404);
  }

  const portionsByFood = await getPortionsByFoodId([id]);

  return c.json({
    food: {
      ...result,
      portions: portionsByFood.get(id) ?? [],
    },
  });
});

// ── Custom Foods (authenticated) ──────────────────────────────────

foodRoutes.use("/custom/*", requireAuth);

foodRoutes.get("/custom/mine", async (c) => {
  const userId = c.var.user.id;

  const results = await db
    .select()
    .from(customFoods)
    .where(eq(customFoods.userId, userId))
    .orderBy(customFoods.name);

  return c.json({ foods: results });
});

foodRoutes.post(
  "/custom",
  requireAuth,
  zValidator("json", CreateCustomFoodSchema),
  async (c) => {
    const userId = c.var.user.id;
    const input = c.req.valid("json");

    const [created] = await db
      .insert(customFoods)
      .values({
        userId,
        name: input.name,
        brand: input.brand,
        barcode: input.barcode,
        servingSizeG: String(input.servingSizeG),
        servingLabel: input.servingLabel,
        calories: String(input.calories),
        proteinG: String(input.proteinG),
        carbsG: String(input.carbsG),
        fatG: String(input.fatG),
        fiberG: input.fiberG != null ? String(input.fiberG) : null,
        sugarG: input.sugarG != null ? String(input.sugarG) : null,
        sodiumMg: input.sodiumMg != null ? String(input.sodiumMg) : null,
      })
      .returning();

    return c.json({ food: created }, 201);
  }
);
