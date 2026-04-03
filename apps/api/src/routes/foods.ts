import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, foods, customFoods } from "@snt/db";
import { FoodSearchSchema, CreateCustomFoodSchema } from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import { searchFoods } from "../services/typesense";
import { searchOFF, lookupBarcode } from "../services/open-food-facts";

export const foodRoutes = new Hono();

// ── Search Foods ─────────────────────────────────────────────────
// Searches local DB first, then Open Food Facts for broader results.

foodRoutes.get("/search", zValidator("query", FoodSearchSchema), async (c) => {
  const { query, limit, offset } = c.req.valid("query");

  let localResults: any[] = [];

  // 1. Try Typesense first (fast, typo-tolerant)
  try {
    const tsResult = await searchFoods({ query, limit, offset });
    localResults = tsResult.hits;
  } catch {
    // 2. Fallback: Postgres ILIKE
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

  // 3. If local results are sparse, supplement with Open Food Facts
  let offResults: any[] = [];
  if (localResults.length < 5) {
    try {
      console.log(`[OFF] Searching for "${query}", limit=${limit - localResults.length}`);
      const offFoods = await searchOFF(query, limit - localResults.length);
      console.log(`[OFF] Got ${offFoods.length} results`);
      offResults = offFoods.map((f) => ({
        ...f,
        id: `off_${f.barcode}`, // Prefix so frontend knows it's from OFF
        source: "off",
        isVerified: true,
      }));
    } catch (err) {
      console.error("[OFF] Search failed:", err);
    }
  }

  // Combine: local first, then OFF results (deduplicate by name roughly)
  const localNames = new Set(localResults.map((r: any) => r.name?.toLowerCase()));
  const dedupedOFF = offResults.filter(
    (r) => !localNames.has(r.name?.toLowerCase())
  );

  return c.json({
    foods: [...localResults, ...dedupedOFF],
    query,
    total: localResults.length + dedupedOFF.length,
  });
});

// ── Barcode Lookup ───────────────────────────────────────────────
// Checks local DB first, then Open Food Facts.

foodRoutes.get("/barcode/:code", async (c) => {
  const barcode = c.req.param("code");

  // 1. Check local DB
  const localResult = await db.query.foods.findFirst({
    where: eq(foods.barcode, barcode),
  });

  if (localResult) {
    return c.json({ food: localResult, source: "local" });
  }

  // 2. Look up on Open Food Facts
  try {
    const offResult = await lookupBarcode(barcode);
    if (offResult) {
      return c.json({
        food: {
          id: `off_${offResult.barcode}`,
          ...offResult,
          isVerified: true,
        },
        source: "off",
      });
    }
  } catch {
    // OFF unavailable
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

  return c.json({ food: result });
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
