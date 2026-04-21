/**
 * USDA FoodData Central → Smart Nutrition Tracker import script.
 *
 * Usage:
 *   USDA_API_KEY=your-key bun run packages/db/src/seed/usda/import.ts
 *
 * Optional env vars:
 *   BRANDED_MAX_FOODS=50000   Cap on branded imports (default 50k)
 *   SKIP_BRANDED=1            Skip branded dataset entirely
 *   SKIP_NUTRIENTS=1          Skip micronutrient inserts (faster)
 *   RESUME_FROM_PAGE=123      Restart branded from a specific page
 *
 * What it does:
 *   1. Pulls foods from USDA Foundation + SR Legacy + Branded datasets
 *   2. Extracts core macros → foods table (batched inserts, 500/txn)
 *   3. Extracts micronutrients → food_nutrients table
 *   4. Assigns categories and tags
 *   5. Idempotent via unique index on (source, source_id)
 *
 * Get a free API key at: https://fdc.nal.usda.gov/api-key-signup.html
 */

import { sql, and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../schema";
import { foods, foodNutrients, foodPortions } from "../../schema";

// Bulk imports must avoid the Supabase pooler (pgbouncer transaction mode
// breaks prepared statements when running many inserts on one connection).
// Prefer DIRECT_URL (port 5432) for the importer; fall back to DATABASE_URL
// with prepared statements disabled if only that is set.
const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error("❌ DIRECT_URL or DATABASE_URL must be set.");
  process.exit(1);
}

import {
  NUTRIENT_MAP,
  CORE_NUTRIENT_IDS,
  USDA_DATA_TYPES,
  CATEGORY_MAP,
  API_RATE_LIMIT_MS,
  API_PAGE_SIZE,
  API_BASE_URL,
  BRANDED_MAX_FOODS,
  DB_BATCH_SIZE,
} from "./config";

const usingPooler = connStr.includes(":6543/");
const pgClient = postgres(connStr, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !usingPooler,
});
const db = drizzle(pgClient, { schema });

const API_KEY = process.env.USDA_API_KEY;

if (!API_KEY) {
  console.error("❌ USDA_API_KEY environment variable is required.");
  console.error("   Get a free key at: https://fdc.nal.usda.gov/api-key-signup.html");
  process.exit(1);
}

const SKIP_BRANDED = process.env.SKIP_BRANDED === "1";
const SKIP_NUTRIENTS = process.env.SKIP_NUTRIENTS === "1";
const RESUME_FROM_PAGE = Number(process.env.RESUME_FROM_PAGE) || 1;

// ── Types ────────────────────────────────────────────────────────────

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: { description: string };
  // Branded-specific fields
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  brandedFoodCategory?: string;
  foodNutrients: {
    nutrient?: { id: number; name: string; unitName: string };
    // Branded responses flatten nutrients differently:
    nutrientId?: number;
    nutrientName?: string;
    unitName?: string;
    amount?: number;
    value?: number;
  }[];
  foodPortions?: {
    id?: number;
    amount?: number;
    gramWeight: number;
    portionDescription?: string;
    modifier?: string;
    sequenceNumber?: number;
    measureUnit?: {
      id?: number;
      name?: string;
      abbreviation?: string;
    };
  }[];
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

// ── Helpers ──────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNutrientId(n: USDAFood["foodNutrients"][number]): number | undefined {
  return n.nutrientId ?? n.nutrient?.id;
}

function getNutrientAmount(
  n: USDAFood["foodNutrients"][number]
): number | undefined {
  return n.amount ?? n.value;
}

function extractNutrient(
  nutrients: USDAFood["foodNutrients"],
  nutrientId: number
): number | null {
  const found = nutrients.find((n) => getNutrientId(n) === nutrientId);
  const amt = found ? getNutrientAmount(found) : undefined;
  return amt ?? null;
}

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferTags(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number | null,
  category: string,
  isBranded: boolean
): string[] {
  const tags: string[] = isBranded ? ["branded"] : ["whole_food"];

  const proteinCals = proteinG * 4;
  if (calories > 0 && proteinCals / calories > 0.3) tags.push("high_protein");

  const carbCals = carbsG * 4;
  if (calories > 0 && carbCals / calories < 0.2) tags.push("low_carb");

  if (fiberG && fiberG > 5) tags.push("high_fiber");

  const quickCategories = ["fruit", "nut", "dairy", "beverage"];
  if (quickCategories.includes(category)) tags.push("quick");

  return tags;
}

function getServingInfo(food: USDAFood): { sizeG: number; label: string } {
  // Branded items store serving on the root
  if (food.servingSize && food.servingSizeUnit?.toLowerCase() === "g") {
    return {
      sizeG: food.servingSize,
      label:
        food.householdServingFullText || `${food.servingSize}${food.servingSizeUnit}`,
    };
  }

  // Foundation/SR Legacy items use foodPortions
  if (food.foodPortions && food.foodPortions.length > 0) {
    const portion = food.foodPortions[0]!;
    return {
      sizeG: portion.gramWeight,
      label:
        portion.portionDescription ||
        portion.modifier ||
        `${portion.gramWeight}g`,
    };
  }

  return { sizeG: 100, label: "100g" };
}

class USDATerminalError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchPage(
  dataType: string,
  pageNumber: number
): Promise<USDASearchResponse> {
  const url = `${API_BASE_URL}/foods/search?api_key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SmartNutritionTracker/1.0",
    },
    body: JSON.stringify({
      dataType: [dataType],
      pageSize: API_PAGE_SIZE,
      pageNumber,
      sortBy: "dataType.keyword",
      sortOrder: "asc",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    // 4xx errors are NOT retryable — they're permanent (bad request, too-deep
    // pagination, unauthorized key, etc.). Throw a tagged error so the caller
    // can stop paginating this dataType instead of retrying forever.
    if (res.status >= 400 && res.status < 500) {
      throw new USDATerminalError(
        res.status,
        `USDA API ${res.status} ${res.statusText} (page ${pageNumber}, ${dataType}) — not retryable`
      );
    }
    throw new Error(`USDA API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Batch Insert Pipeline ────────────────────────────────────────────

type FoodInsert = typeof foods.$inferInsert;
type NutrientInsert = typeof foodNutrients.$inferInsert;
type PortionInsert = typeof foodPortions.$inferInsert;

interface StagedPortion {
  amount: string;
  unit: string;
  modifier: string | null;
  description: string;
  gramWeight: string;
  sequenceNumber: number;
}

interface StagedFood {
  row: FoodInsert;
  // Micronutrients are bound to foodId after the food row is inserted.
  // We keep them here and resolve the foodId once we have the returning rows.
  microByCode: { nutrientCode: string; amount: string; unit: string }[];
  portions: StagedPortion[];
}

function stagePortions(usdaFood: USDAFood): StagedPortion[] {
  const isBranded = usdaFood.dataType === "Branded";
  const portions: StagedPortion[] = [];
  const seen = new Set<string>();

  // Branded: synthesize a single portion from the label serving.
  // The serving label itself ("1 container (170g)") IS the portion.
  if (isBranded) {
    if (
      usdaFood.servingSize &&
      usdaFood.servingSizeUnit?.toLowerCase() === "g"
    ) {
      const description =
        usdaFood.householdServingFullText ||
        `${usdaFood.servingSize}${usdaFood.servingSizeUnit}`;
      if (description && !seen.has(description.toLowerCase())) {
        seen.add(description.toLowerCase());
        portions.push({
          amount: "1",
          unit: "serving",
          modifier: null,
          description,
          gramWeight: String(
            Math.round(Number(usdaFood.servingSize) * 100) / 100
          ),
          sequenceNumber: 0,
        });
      }
    }
    return portions;
  }

  // Foundation / SR Legacy: rich foodPortions array.
  if (!usdaFood.foodPortions) return portions;

  for (const p of usdaFood.foodPortions) {
    if (
      !p ||
      p.gramWeight == null ||
      !Number.isFinite(p.gramWeight) ||
      p.gramWeight <= 0 ||
      p.gramWeight > 100_000 // sanity: reject 100kg+ portions
    ) {
      continue;
    }

    const amount = Number(p.amount) > 0 ? Number(p.amount) : 1;
    const rawUnit =
      p.measureUnit?.name ||
      p.measureUnit?.abbreviation ||
      "";
    // USDA uses "undetermined" as a placeholder unit when the real label is
    // in `modifier` (e.g. modifier="large", unit="undetermined" → "1 large").
    const unit =
      rawUnit && rawUnit.toLowerCase() !== "undetermined" ? rawUnit : "";

    // Prefer USDA's portionDescription when present, else synthesize.
    const description =
      p.portionDescription?.trim() ||
      [
        amount !== 1 ? amount : "1",
        unit,
        p.modifier?.trim(),
      ]
        .filter(Boolean)
        .join(" ");

    if (!description) continue;
    const key = description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    portions.push({
      amount: String(Math.round(amount * 1000) / 1000),
      unit,
      modifier: p.modifier?.trim() || null,
      description,
      gramWeight: String(Math.round(Number(p.gramWeight) * 100) / 100),
      sequenceNumber: Number(p.sequenceNumber) || 0,
    });
  }

  return portions;
}

function stageFood(usdaFood: USDAFood): StagedFood | null {
  const cal100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.calories);
  const pro100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.protein);
  const carb100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.carbs);
  const fat100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.fat);

  if (cal100 == null || pro100 == null || carb100 == null || fat100 == null) {
    return null;
  }

  const fiber100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.fiber);
  const sugar100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.sugar);
  const sodium100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.sodium);

  const isBranded = usdaFood.dataType === "Branded";
  const categoryRaw =
    usdaFood.foodCategory?.description ?? usdaFood.brandedFoodCategory ?? "Other";
  const category = CATEGORY_MAP[categoryRaw] ?? "other";
  const serving = getServingInfo(usdaFood);

  // USDA nutrients are per-100g. Scale to serving size.
  const ratio = serving.sizeG / 100;
  const calories = Math.round(cal100 * ratio * 10) / 10;
  const proteinG = Math.round(pro100 * ratio * 100) / 100;
  const carbsG = Math.round(carb100 * ratio * 100) / 100;
  const fatG = Math.round(fat100 * ratio * 100) / 100;
  const fiberG = fiber100 != null ? Math.round(fiber100 * ratio * 100) / 100 : null;
  const sugarG = sugar100 != null ? Math.round(sugar100 * ratio * 100) / 100 : null;
  const sodiumMg = sodium100 != null ? Math.round(sodium100 * ratio * 10) / 10 : null;

  // Skip zero-nutrition entries (USDA has some placeholder rows)
  if (calories === 0 && proteinG === 0 && carbsG === 0 && fatG === 0) return null;

  // Skip rows with physically impossible values (USDA has a few corrupt
  // branded entries, e.g. sodium > 1M mg per serving).
  const MAX_GRAMS = 1_000_000;     // 1000 kg serving — anything higher is bad data
  const MAX_CALORIES = 1_000_000;  // 1M cal/serving — absurd
  const MAX_MG = 10_000_000;       // 10,000,000 mg sodium — absurd
  if (
    serving.sizeG > MAX_GRAMS ||
    calories > MAX_CALORIES ||
    proteinG > MAX_GRAMS ||
    carbsG > MAX_GRAMS ||
    fatG > MAX_GRAMS ||
    (fiberG != null && fiberG > MAX_GRAMS) ||
    (sugarG != null && sugarG > MAX_GRAMS) ||
    (sodiumMg != null && sodiumMg > MAX_MG)
  ) {
    return null;
  }

  const name = isBranded ? titleCase(usdaFood.description) : usdaFood.description;
  const brand = isBranded
    ? usdaFood.brandName || usdaFood.brandOwner
      ? titleCase(usdaFood.brandName || usdaFood.brandOwner || "")
      : null
    : null;
  const barcode = isBranded && usdaFood.gtinUpc ? usdaFood.gtinUpc : null;

  const tags = inferTags(calories, proteinG, carbsG, fatG, fiberG, category, isBranded);

  const row: FoodInsert = {
    name,
    brand,
    barcode,
    source: "usda",
    sourceId: String(usdaFood.fdcId),
    servingSizeG: String(serving.sizeG),
    servingLabel: serving.label,
    calories: String(calories),
    proteinG: String(proteinG),
    carbsG: String(carbsG),
    fatG: String(fatG),
    fiberG: fiberG != null ? String(fiberG) : null,
    sugarG: sugarG != null ? String(sugarG) : null,
    sodiumMg: sodiumMg != null ? String(sodiumMg) : null,
    category,
    tags,
    isVerified: true,
  };

  // Stage micronutrients (will be bound to foodId after insert)
  const microByCode: StagedFood["microByCode"] = [];
  if (!SKIP_NUTRIENTS) {
    for (const [nutrientIdStr, mapping] of Object.entries(NUTRIENT_MAP)) {
      const nutrientId = Number(nutrientIdStr);
      if (Object.values(CORE_NUTRIENT_IDS).includes(nutrientId)) continue;

      const amount = extractNutrient(usdaFood.foodNutrients, nutrientId);
      if (amount != null && amount > 0) {
        microByCode.push({
          nutrientCode: mapping.code,
          amount: String(Math.round(amount * ratio * 1000) / 1000),
          unit: mapping.unit,
        });
      }
    }
  }

  // Alternate portions (cups, slices, medium, etc.)
  const portions = stagePortions(usdaFood);

  return { row, microByCode, portions };
}

async function flushBatch(staged: StagedFood[]): Promise<number> {
  if (staged.length === 0) return 0;

  const rows = staged.map((s) => s.row);

  // Conflict target: the unique index on (source, source_id).
  // Postgres treats NULL source_ids as distinct, so admin rows don't clash.
  const inserted = await db
    .insert(foods)
    .values(rows)
    .onConflictDoNothing({
      target: [foods.source, foods.sourceId],
    })
    .returning({
      id: foods.id,
      sourceId: foods.sourceId,
    });

  // Build a map of sourceId → id from fresh inserts.
  const idBySourceId = new Map<string, string>();
  for (const r of inserted) {
    if (r.sourceId) idBySourceId.set(r.sourceId, r.id);
  }

  // Re-run support: for rows that conflict-skipped (already exist),
  // look up their foodIds so we can still backfill portions/nutrients.
  const needLookup = staged
    .map((s) => s.row.sourceId)
    .filter((id): id is string => !!id && !idBySourceId.has(id));

  if (needLookup.length > 0) {
    // Chunk the IN clause — sourceIds list can be 500.
    const LOOKUP_CHUNK = 500;
    for (let i = 0; i < needLookup.length; i += LOOKUP_CHUNK) {
      const slice = needLookup.slice(i, i + LOOKUP_CHUNK);
      const existing = await db
        .select({ id: foods.id, sourceId: foods.sourceId })
        .from(foods)
        .where(
          and(eq(foods.source, "usda"), inArray(foods.sourceId, slice))
        );
      for (const r of existing) {
        if (r.sourceId) idBySourceId.set(r.sourceId, r.id);
      }
    }
  }

  // ── Micronutrients ───────────────────────────────────────────────
  if (!SKIP_NUTRIENTS && idBySourceId.size > 0) {
    const nutrientRows: NutrientInsert[] = [];
    for (const s of staged) {
      const foodId = idBySourceId.get(s.row.sourceId!);
      if (!foodId) continue;
      for (const m of s.microByCode) {
        nutrientRows.push({
          foodId,
          nutrientCode: m.nutrientCode,
          amount: m.amount,
          unit: m.unit,
        });
      }
    }

    if (nutrientRows.length > 0) {
      const NUTRIENT_CHUNK = 5000;
      for (let i = 0; i < nutrientRows.length; i += NUTRIENT_CHUNK) {
        await db
          .insert(foodNutrients)
          .values(nutrientRows.slice(i, i + NUTRIENT_CHUNK))
          .onConflictDoNothing();
      }
    }
  }

  // ── Portions (alt units: "1 cup sliced", "1 medium") ─────────────
  if (idBySourceId.size > 0) {
    const portionRows: PortionInsert[] = [];
    for (const s of staged) {
      const foodId = idBySourceId.get(s.row.sourceId!);
      if (!foodId) continue;
      for (const p of s.portions) {
        portionRows.push({
          foodId,
          amount: p.amount,
          unit: p.unit,
          modifier: p.modifier,
          description: p.description,
          gramWeight: p.gramWeight,
          sequenceNumber: p.sequenceNumber,
        });
      }
    }

    if (portionRows.length > 0) {
      const PORTION_CHUNK = 2000;
      for (let i = 0; i < portionRows.length; i += PORTION_CHUNK) {
        await db
          .insert(foodPortions)
          .values(portionRows.slice(i, i + PORTION_CHUNK))
          .onConflictDoNothing({
            target: [foodPortions.foodId, foodPortions.description],
          });
      }
    }
  }

  return inserted.length;
}

// ── Import Loop ──────────────────────────────────────────────────────

async function importDataType(
  dataType: (typeof USDA_DATA_TYPES)[number],
  maxFoods?: number
): Promise<number> {
  console.log(`\n📦 Importing ${dataType} foods...`);

  let page = dataType === "Branded" ? RESUME_FROM_PAGE : 1;
  let totalImported = 0;
  let totalSkipped = 0;
  let hasMore = true;
  let batch: StagedFood[] = [];

  let consecutiveFailures = 0;
  const MAX_RETRIES = 3;

  while (hasMore) {
    let response: USDASearchResponse;
    try {
      response = await fetchPage(dataType, page);
      consecutiveFailures = 0;
    } catch (err) {
      // Terminal 4xx from USDA (e.g. page too deep). Stop paginating this
      // dataType cleanly and flush whatever's in the batch.
      if (err instanceof USDATerminalError) {
        console.log(
          `  ⛔ ${err.message} — stopping ${dataType} pagination here.`
        );
        break;
      }
      consecutiveFailures++;
      if (consecutiveFailures > MAX_RETRIES) {
        console.error(
          `  ❌ Page ${page} failed ${consecutiveFailures} times, giving up on ${dataType}:`,
          err
        );
        break;
      }
      console.error(
        `  ⚠️  Page ${page} failed (attempt ${consecutiveFailures}/${MAX_RETRIES}), retrying in 5s...`,
        err
      );
      await sleep(5000);
      continue;
    }

    const targetStr = maxFoods ? `target=${maxFoods}` : "no cap";
    console.log(
      `  Page ${page}/${response.totalPages} (${response.foods.length} raw, imported=${totalImported}, ${targetStr})`
    );

    for (const usdaFood of response.foods) {
      const staged = stageFood(usdaFood);
      if (!staged) {
        totalSkipped++;
        continue;
      }
      batch.push(staged);

      if (batch.length >= DB_BATCH_SIZE) {
        const n = await flushBatch(batch);
        totalImported += n;
        batch = [];

        if (maxFoods && totalImported >= maxFoods) {
          console.log(`  🛑 Reached cap of ${maxFoods} for ${dataType}`);
          return totalImported;
        }
      }
    }

    hasMore = page < response.totalPages;
    page++;
    await sleep(API_RATE_LIMIT_MS);
  }

  // Flush final partial batch
  if (batch.length > 0) {
    const n = await flushBatch(batch);
    totalImported += n;
  }

  console.log(
    `  ✅ ${dataType}: ${totalImported} imported, ${totalSkipped} skipped (missing macros or empty)`
  );
  return totalImported;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌾 USDA FoodData Central → Smart Nutrition Tracker Import");
  console.log("──────────────────────────────────────────────────────────");
  console.log(`   DB batch size: ${DB_BATCH_SIZE}`);
  console.log(`   Branded cap:   ${SKIP_BRANDED ? "SKIPPED" : BRANDED_MAX_FOODS}`);
  console.log(`   Nutrients:     ${SKIP_NUTRIENTS ? "SKIPPED" : "included"}`);

  const startRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(foods);
  console.log(`   Starting rows: ${startRows[0]?.count ?? 0}`);

  const startTime = Date.now();
  let grandTotal = 0;

  for (const dataType of USDA_DATA_TYPES) {
    if (dataType === "Branded" && SKIP_BRANDED) {
      console.log(`\n⏭  Skipping Branded (SKIP_BRANDED=1)`);
      continue;
    }

    const cap = dataType === "Branded" ? BRANDED_MAX_FOODS : undefined;
    const count = await importDataType(dataType, cap);
    grandTotal += count;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n🎉 Import complete! ${grandTotal} total foods inserted in ${elapsed}s.`
  );

  const endRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(foods);
  console.log(`   Final DB rows: ${endRows[0]?.count ?? 0}`);

  await pgClient.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ Import failed:", err);
  try { await pgClient.end(); } catch {}
  process.exit(1);
});
