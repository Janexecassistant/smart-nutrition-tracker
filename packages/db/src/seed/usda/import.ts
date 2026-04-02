/**
 * USDA FoodData Central → Smart Nutrition Tracker import script.
 *
 * Usage:
 *   USDA_API_KEY=your-key bun run packages/db/src/seed/usda/import.ts
 *
 * What it does:
 *   1. Pulls foods from USDA Foundation + SR Legacy datasets
 *   2. Extracts core macros → foods table
 *   3. Extracts micronutrients → food_nutrients table
 *   4. Assigns categories and tags
 *   5. Upserts into Postgres via Drizzle
 *
 * Get a free API key at: https://fdc.nal.usda.gov/api-key-signup.html
 */

import { db } from "../../client";
import { foods, foodNutrients } from "../../schema";
import {
  NUTRIENT_MAP,
  CORE_NUTRIENT_IDS,
  USDA_DATA_TYPES,
  CATEGORY_MAP,
  API_RATE_LIMIT_MS,
  API_PAGE_SIZE,
  API_BASE_URL,
} from "./config";

const API_KEY = process.env.USDA_API_KEY;

if (!API_KEY) {
  console.error("❌ USDA_API_KEY environment variable is required.");
  console.error("   Get a free key at: https://fdc.nal.usda.gov/api-key-signup.html");
  process.exit(1);
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: { description: string };
  foodNutrients: {
    nutrient: { id: number; name: string; unitName: string };
    amount?: number;
  }[];
  foodPortions?: {
    gramWeight: number;
    portionDescription: string;
    modifier: string;
  }[];
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractNutrient(
  nutrients: USDAFood["foodNutrients"],
  nutrientId: number
): number | null {
  const found = nutrients.find((n) => n.nutrient.id === nutrientId);
  return found?.amount ?? null;
}

function inferTags(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number | null,
  category: string
): string[] {
  const tags: string[] = ["whole_food"];

  // High protein: >30% of calories from protein
  const proteinCals = proteinG * 4;
  if (calories > 0 && proteinCals / calories > 0.3) {
    tags.push("high_protein");
  }

  // Low carb: <20% of calories from carbs
  const carbCals = carbsG * 4;
  if (calories > 0 && carbCals / calories < 0.2) {
    tags.push("low_carb");
  }

  // High fiber
  if (fiberG && fiberG > 5) {
    tags.push("high_fiber");
  }

  // Quick foods (raw fruits, nuts, dairy — no cooking needed)
  const quickCategories = ["fruit", "nut", "dairy", "beverage"];
  if (quickCategories.includes(category)) {
    tags.push("quick");
  }

  return tags;
}

function getServingInfo(food: USDAFood): { sizeG: number; label: string } {
  // Try to find a reasonable portion from USDA data
  if (food.foodPortions && food.foodPortions.length > 0) {
    // Prefer the first portion that's a common serving
    const portion = food.foodPortions[0]!;
    return {
      sizeG: portion.gramWeight,
      label: portion.portionDescription || portion.modifier || `${portion.gramWeight}g`,
    };
  }

  // Default to 100g (USDA standard reference amount)
  return { sizeG: 100, label: "100g" };
}

async function fetchPage(
  dataType: string,
  pageNumber: number
): Promise<USDASearchResponse> {
  const url = `${API_BASE_URL}/foods/search?api_key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: [dataType],
      pageSize: API_PAGE_SIZE,
      pageNumber,
      sortBy: "dataType.keyword",
      sortOrder: "asc",
    }),
  });

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function importDataType(dataType: string) {
  console.log(`\n📦 Importing ${dataType} foods...`);

  let page = 1;
  let totalImported = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchPage(dataType, page);

    console.log(
      `  Page ${page}/${response.totalPages} (${response.foods.length} foods)`
    );

    for (const usdaFood of response.foods) {
      // Extract core macros (per 100g from USDA)
      const cal100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.calories);
      const pro100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.protein);
      const carb100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.carbs);
      const fat100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.fat);

      // Skip foods missing core macros
      if (cal100 == null || pro100 == null || carb100 == null || fat100 == null) {
        totalSkipped++;
        continue;
      }

      const fiber100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.fiber);
      const sugar100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.sugar);
      const sodium100 = extractNutrient(usdaFood.foodNutrients, CORE_NUTRIENT_IDS.sodium);

      const categoryRaw = usdaFood.foodCategory?.description ?? "Other";
      const category = CATEGORY_MAP[categoryRaw] ?? "other";
      const serving = getServingInfo(usdaFood);

      // Scale macros from per-100g to per-serving
      const ratio = serving.sizeG / 100;
      const calories = Math.round(cal100 * ratio * 10) / 10;
      const proteinG = Math.round(pro100 * ratio * 100) / 100;
      const carbsG = Math.round(carb100 * ratio * 100) / 100;
      const fatG = Math.round(fat100 * ratio * 100) / 100;
      const fiberG = fiber100 != null ? Math.round(fiber100 * ratio * 100) / 100 : null;
      const sugarG = sugar100 != null ? Math.round(sugar100 * ratio * 100) / 100 : null;
      const sodiumMg = sodium100 != null ? Math.round(sodium100 * ratio * 10) / 10 : null;

      const tags = inferTags(calories, proteinG, carbsG, fatG, fiberG, category);

      // Upsert food
      const [inserted] = await db
        .insert(foods)
        .values({
          name: usdaFood.description,
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
        })
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        totalSkipped++;
        continue;
      }

      // Insert micronutrients for Phase 2
      const microNutrients: { foodId: string; nutrientCode: string; amount: string; unit: string }[] = [];

      for (const [nutrientIdStr, mapping] of Object.entries(NUTRIENT_MAP)) {
        const nutrientId = Number(nutrientIdStr);
        // Skip core macros (already in foods table)
        if (Object.values(CORE_NUTRIENT_IDS).includes(nutrientId)) continue;

        const amount = extractNutrient(usdaFood.foodNutrients, nutrientId);
        if (amount != null && amount > 0) {
          microNutrients.push({
            foodId: inserted.id,
            nutrientCode: mapping.code,
            amount: String(amount),
            unit: mapping.unit,
          });
        }
      }

      if (microNutrients.length > 0) {
        await db.insert(foodNutrients).values(microNutrients).onConflictDoNothing();
      }

      totalImported++;
    }

    hasMore = page < response.totalPages;
    page++;

    // Rate limiting
    await sleep(API_RATE_LIMIT_MS);
  }

  console.log(
    `  ✅ ${dataType}: ${totalImported} imported, ${totalSkipped} skipped`
  );
  return totalImported;
}

async function main() {
  console.log("🌾 USDA FoodData Central → Smart Nutrition Tracker Import");
  console.log("──────────────────────────────────────────────────────────");

  let grandTotal = 0;

  for (const dataType of USDA_DATA_TYPES) {
    const count = await importDataType(dataType);
    grandTotal += count;
  }

  console.log(`\n🎉 Import complete! ${grandTotal} total foods imported.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
