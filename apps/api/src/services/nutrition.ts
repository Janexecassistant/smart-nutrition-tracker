import { eq, and, inArray } from "drizzle-orm";
import { db, foods, customFoods, customRecipes } from "@snt/db";

/**
 * Nutrition snapshot — calories + macros, in the units stored in the DB.
 * Everything is a Number once it's in-memory; numeric columns come out
 * as strings from Drizzle and we cast at the boundary.
 */
export interface NutritionSnapshot {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
}

export interface FoodRef {
  foodId: string;
  foodType: "global" | "custom" | "recipe";
  quantityG: number;
}

export interface ResolvedFood {
  foodId: string;
  foodType: "global" | "custom" | "recipe";
  name: string;
  /** Per-gram nutrition, derived from (per-serving nutrition) / servingSizeG */
  perGram: NutritionSnapshot;
}

/**
 * Resolve a batch of (foodId, foodType) pairs into name + per-gram nutrition.
 * We fetch all foods / customFoods / recipes in one round each so recipes with
 * dozens of ingredients stay snappy.
 *
 * For recipes-as-ingredients: the recipe's stored totals are the whole recipe,
 * not per-gram. We treat the recipe's "total weight" as the sum of its
 * ingredients' quantityG so it can be proportionally scaled. We don't store
 * the recipe's gram weight on the row yet, so we derive it here via a query
 * against recipe_ingredients. If recipes-in-recipes becomes common we'll
 * cache `total_weight_g` on custom_recipes.
 */
export async function resolveFoods(
  refs: Array<{ foodId: string; foodType: "global" | "custom" | "recipe" }>
): Promise<Map<string, ResolvedFood>> {
  const globalIds = refs.filter((r) => r.foodType === "global").map((r) => r.foodId);
  const customIds = refs.filter((r) => r.foodType === "custom").map((r) => r.foodId);
  const recipeIds = refs.filter((r) => r.foodType === "recipe").map((r) => r.foodId);

  const out = new Map<string, ResolvedFood>();

  if (globalIds.length > 0) {
    const rows = await db.select().from(foods).where(inArray(foods.id, globalIds));
    for (const f of rows) {
      const size = Number(f.servingSizeG) || 1;
      const key = `global:${f.id}`;
      out.set(key, {
        foodId: f.id,
        foodType: "global",
        name: f.name,
        perGram: {
          calories: Number(f.calories) / size,
          proteinG: Number(f.proteinG) / size,
          carbsG: Number(f.carbsG) / size,
          fatG: Number(f.fatG) / size,
          fiberG: f.fiberG == null ? undefined : Number(f.fiberG) / size,
          sugarG: f.sugarG == null ? undefined : Number(f.sugarG) / size,
          sodiumMg: f.sodiumMg == null ? undefined : Number(f.sodiumMg) / size,
        },
      });
    }
  }

  if (customIds.length > 0) {
    const rows = await db
      .select()
      .from(customFoods)
      .where(inArray(customFoods.id, customIds));
    for (const f of rows) {
      const size = Number(f.servingSizeG) || 1;
      const key = `custom:${f.id}`;
      out.set(key, {
        foodId: f.id,
        foodType: "custom",
        name: f.name,
        perGram: {
          calories: Number(f.calories) / size,
          proteinG: Number(f.proteinG) / size,
          carbsG: Number(f.carbsG) / size,
          fatG: Number(f.fatG) / size,
          fiberG: f.fiberG == null ? undefined : Number(f.fiberG) / size,
          sugarG: f.sugarG == null ? undefined : Number(f.sugarG) / size,
          sodiumMg: f.sodiumMg == null ? undefined : Number(f.sodiumMg) / size,
        },
      });
    }
  }

  if (recipeIds.length > 0) {
    const rows = await db
      .select()
      .from(customRecipes)
      .where(inArray(customRecipes.id, recipeIds));
    for (const r of rows) {
      // For recipe-as-ingredient we treat "per serving" as the base unit of
      // logging. per-gram doesn't quite apply to recipes the same way, so we
      // encode the recipe's per-serving totals into a synthetic per-gram where
      // 100g ≈ 1 serving. Consumers should be aware: treat recipes as "grams
      // of serving" when re-ingesting into other recipes.
      const servings = Number(r.servings) || 1;
      const perServingCal = Number(r.totalCalories ?? 0) / servings;
      const perServingProtein = Number(r.totalProteinG ?? 0) / servings;
      const perServingCarbs = Number(r.totalCarbsG ?? 0) / servings;
      const perServingFat = Number(r.totalFatG ?? 0) / servings;
      // Use 100g as the "1 serving" reference for per-gram math
      const size = 100;
      const key = `recipe:${r.id}`;
      out.set(key, {
        foodId: r.id,
        foodType: "recipe",
        name: r.name,
        perGram: {
          calories: perServingCal / size,
          proteinG: perServingProtein / size,
          carbsG: perServingCarbs / size,
          fatG: perServingFat / size,
        },
      });
    }
  }

  return out;
}

export function key(ref: { foodId: string; foodType: string }): string {
  return `${ref.foodType}:${ref.foodId}`;
}

/**
 * Compute the nutrition contribution of a list of food refs + quantityG,
 * returning a single summed NutritionSnapshot.
 */
export async function computeNutrition(refs: FoodRef[]): Promise<NutritionSnapshot> {
  const resolved = await resolveFoods(refs);

  const totals: NutritionSnapshot = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
  };

  for (const ref of refs) {
    const food = resolved.get(key(ref));
    if (!food) continue;
    const g = ref.quantityG;
    totals.calories += food.perGram.calories * g;
    totals.proteinG += food.perGram.proteinG * g;
    totals.carbsG += food.perGram.carbsG * g;
    totals.fatG += food.perGram.fatG * g;
    if (food.perGram.fiberG != null) totals.fiberG! += food.perGram.fiberG * g;
    if (food.perGram.sugarG != null) totals.sugarG! += food.perGram.sugarG * g;
    if (food.perGram.sodiumMg != null) totals.sodiumMg! += food.perGram.sodiumMg * g;
  }

  return totals;
}

/** Round a snapshot to DB-friendly precision. */
export function roundSnapshot(s: NutritionSnapshot): NutritionSnapshot {
  const r = (n: number | undefined, d = 2) =>
    n == null ? undefined : Math.round(n * 10 ** d) / 10 ** d;
  return {
    calories: r(s.calories, 1)!,
    proteinG: r(s.proteinG, 2)!,
    carbsG: r(s.carbsG, 2)!,
    fatG: r(s.fatG, 2)!,
    fiberG: r(s.fiberG, 2),
    sugarG: r(s.sugarG, 2),
    sodiumMg: r(s.sodiumMg, 2),
  };
}
