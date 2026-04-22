import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  customRecipes,
  recipeIngredients,
  foodLogs,
  foodLogItems,
} from "@snt/db";
import {
  CreateRecipeSchema,
  LogRecipeSchema,
  MealSlotSchema,
} from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import {
  computeNutrition,
  resolveFoods,
  roundSnapshot,
  key,
} from "../services/nutrition";
import { z } from "zod";

export const recipeRoutes = new Hono();

recipeRoutes.use("*", requireAuth);

// ── List user's recipes ───────────────────────────────────────────

recipeRoutes.get("/", async (c) => {
  const userId = c.var.user.id;

  const rows = await db
    .select()
    .from(customRecipes)
    .where(eq(customRecipes.userId, userId))
    .orderBy(desc(customRecipes.updatedAt));

  return c.json({
    recipes: rows.map((r) => ({
      id: r.id,
      name: r.name,
      servings: r.servings,
      notes: r.notes,
      perServing: {
        calories: Math.round((Number(r.totalCalories ?? 0) / (r.servings || 1)) * 10) / 10,
        proteinG: Math.round((Number(r.totalProteinG ?? 0) / (r.servings || 1)) * 10) / 10,
        carbsG: Math.round((Number(r.totalCarbsG ?? 0) / (r.servings || 1)) * 10) / 10,
        fatG: Math.round((Number(r.totalFatG ?? 0) / (r.servings || 1)) * 10) / 10,
      },
      total: {
        calories: Number(r.totalCalories ?? 0),
        proteinG: Number(r.totalProteinG ?? 0),
        carbsG: Number(r.totalCarbsG ?? 0),
        fatG: Number(r.totalFatG ?? 0),
      },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
});

// ── Get a single recipe with ingredients + resolved names ─────────

recipeRoutes.get("/:id", async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");

  const recipe = await db.query.customRecipes.findFirst({
    where: and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)),
  });

  if (!recipe) return c.json({ error: "Recipe not found" }, 404);

  const ings = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(recipeIngredients.sortOrder);

  const resolved = await resolveFoods(
    ings
      .filter((i) => i.foodId != null)
      .map((i) => ({
        foodId: i.foodId!,
        foodType: i.foodType as "global" | "custom",
      }))
  );

  const ingredients = ings.map((i) => {
    const f = i.foodId ? resolved.get(key({ foodId: i.foodId, foodType: i.foodType })) : null;
    const g = Number(i.quantityG);
    return {
      id: i.id,
      foodId: i.foodId,
      foodType: i.foodType,
      foodName: f?.name ?? i.label ?? "Unknown",
      quantityG: g,
      label: i.label,
      sortOrder: i.sortOrder ?? 0,
      nutrition: f
        ? roundSnapshot({
            calories: f.perGram.calories * g,
            proteinG: f.perGram.proteinG * g,
            carbsG: f.perGram.carbsG * g,
            fatG: f.perGram.fatG * g,
          })
        : null,
    };
  });

  return c.json({
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    notes: recipe.notes,
    perServing: {
      calories: Math.round((Number(recipe.totalCalories ?? 0) / (recipe.servings || 1)) * 10) / 10,
      proteinG: Math.round((Number(recipe.totalProteinG ?? 0) / (recipe.servings || 1)) * 10) / 10,
      carbsG: Math.round((Number(recipe.totalCarbsG ?? 0) / (recipe.servings || 1)) * 10) / 10,
      fatG: Math.round((Number(recipe.totalFatG ?? 0) / (recipe.servings || 1)) * 10) / 10,
    },
    total: {
      calories: Number(recipe.totalCalories ?? 0),
      proteinG: Number(recipe.totalProteinG ?? 0),
      carbsG: Number(recipe.totalCarbsG ?? 0),
      fatG: Number(recipe.totalFatG ?? 0),
    },
    ingredients,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  });
});

// ── Create a recipe ───────────────────────────────────────────────

recipeRoutes.post("/", zValidator("json", CreateRecipeSchema), async (c) => {
  const userId = c.var.user.id;
  const input = c.req.valid("json");

  const totals = await computeNutrition(
    input.ingredients.map((i) => ({
      foodId: i.foodId,
      foodType: i.foodType,
      quantityG: i.quantityG,
    }))
  );

  const [recipe] = await db
    .insert(customRecipes)
    .values({
      userId,
      name: input.name,
      servings: input.servings,
      notes: input.notes,
      totalCalories: String(Math.round(totals.calories * 10) / 10),
      totalProteinG: String(Math.round(totals.proteinG * 100) / 100),
      totalCarbsG: String(Math.round(totals.carbsG * 100) / 100),
      totalFatG: String(Math.round(totals.fatG * 100) / 100),
    })
    .returning();

  if (!recipe) return c.json({ error: "Failed to create recipe" }, 500);

  await db.insert(recipeIngredients).values(
    input.ingredients.map((ing, idx) => ({
      recipeId: recipe.id,
      foodId: ing.foodId,
      foodType: ing.foodType,
      quantityG: String(ing.quantityG),
      label: ing.label,
      sortOrder: idx,
    }))
  );

  return c.json({ id: recipe.id }, 201);
});

// ── Update a recipe (replace all ingredients, recompute totals) ───

recipeRoutes.patch("/:id", zValidator("json", CreateRecipeSchema), async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");
  const input = c.req.valid("json");

  const existing = await db.query.customRecipes.findFirst({
    where: and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)),
  });
  if (!existing) return c.json({ error: "Recipe not found" }, 404);

  const totals = await computeNutrition(
    input.ingredients.map((i) => ({
      foodId: i.foodId,
      foodType: i.foodType,
      quantityG: i.quantityG,
    }))
  );

  await db
    .update(customRecipes)
    .set({
      name: input.name,
      servings: input.servings,
      notes: input.notes,
      totalCalories: String(Math.round(totals.calories * 10) / 10),
      totalProteinG: String(Math.round(totals.proteinG * 100) / 100),
      totalCarbsG: String(Math.round(totals.carbsG * 100) / 100),
      totalFatG: String(Math.round(totals.fatG * 100) / 100),
      updatedAt: new Date(),
    })
    .where(eq(customRecipes.id, id));

  // Wipe and reinsert ingredients — simplest to keep in sync
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
  await db.insert(recipeIngredients).values(
    input.ingredients.map((ing, idx) => ({
      recipeId: id,
      foodId: ing.foodId,
      foodType: ing.foodType,
      quantityG: String(ing.quantityG),
      label: ing.label,
      sortOrder: idx,
    }))
  );

  return c.json({ id });
});

// ── Delete a recipe ───────────────────────────────────────────────

recipeRoutes.delete("/:id", async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");

  const existing = await db.query.customRecipes.findFirst({
    where: and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)),
  });
  if (!existing) return c.json({ error: "Recipe not found" }, 404);

  await db.delete(customRecipes).where(eq(customRecipes.id, id));
  return c.json({ success: true });
});

// ── Log N servings of a recipe to the diary ───────────────────────

recipeRoutes.post("/:id/log", zValidator("json", LogRecipeSchema), async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const date = input.date ?? new Date().toISOString().split("T")[0]!;

  const recipe = await db.query.customRecipes.findFirst({
    where: and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)),
  });
  if (!recipe) return c.json({ error: "Recipe not found" }, 404);

  const servingsLogged = input.servings;
  const perServingCal = Number(recipe.totalCalories ?? 0) / (recipe.servings || 1);
  const perServingProtein = Number(recipe.totalProteinG ?? 0) / (recipe.servings || 1);
  const perServingCarbs = Number(recipe.totalCarbsG ?? 0) / (recipe.servings || 1);
  const perServingFat = Number(recipe.totalFatG ?? 0) / (recipe.servings || 1);

  // Ensure daily food_log row exists
  const [log] = await db
    .insert(foodLogs)
    .values({ userId, logDate: date })
    .onConflictDoNothing()
    .returning();

  const logRow =
    log ??
    (await db.query.foodLogs.findFirst({
      where: and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, date)),
    }));

  if (!logRow) return c.json({ error: "Failed to create log" }, 500);

  // Log recipe as a single diary item (foodType=recipe). quantityG uses 100g
  // as the "1 serving" baseline so the stored snapshot reflects the recipe's
  // actual per-serving nutrition × servings.
  const [item] = await db
    .insert(foodLogItems)
    .values({
      logId: logRow.id,
      userId,
      mealSlot: input.mealSlot,
      foodId: recipe.id,
      foodType: "recipe",
      foodName: recipe.name,
      quantityG: String(100 * servingsLogged),
      servingLabel: `${servingsLogged} serving${servingsLogged === 1 ? "" : "s"}`,
      calories: String(Math.round(perServingCal * servingsLogged * 10) / 10),
      proteinG: String(Math.round(perServingProtein * servingsLogged * 100) / 100),
      carbsG: String(Math.round(perServingCarbs * servingsLogged * 100) / 100),
      fatG: String(Math.round(perServingFat * servingsLogged * 100) / 100),
    })
    .returning();

  await recomputeDailyTotals(logRow.id);
  return c.json({ item }, 201);
});

// ── Helper ────────────────────────────────────────────────────────

async function recomputeDailyTotals(logId: string) {
  const items = await db
    .select()
    .from(foodLogItems)
    .where(eq(foodLogItems.logId, logId));

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + Number(item.calories),
      proteinG: acc.proteinG + Number(item.proteinG),
      carbsG: acc.carbsG + Number(item.carbsG),
      fatG: acc.fatG + Number(item.fatG),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  await db
    .update(foodLogs)
    .set({
      totalCalories: String(totals.calories),
      totalProteinG: String(totals.proteinG),
      totalCarbsG: String(totals.carbsG),
      totalFatG: String(totals.fatG),
      updatedAt: new Date(),
    })
    .where(eq(foodLogs.id, logId));
}
