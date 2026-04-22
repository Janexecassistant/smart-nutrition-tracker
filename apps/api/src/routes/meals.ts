import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  db,
  savedMeals,
  savedMealItems,
  foodLogs,
  foodLogItems,
} from "@snt/db";
import {
  CreateMealSchema,
  CreateMealFromLogSchema,
  LogMealSchema,
} from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import { resolveFoods, roundSnapshot, key } from "../services/nutrition";

export const mealRoutes = new Hono();

mealRoutes.use("*", requireAuth);

// ── List saved meals with summary totals ──────────────────────────

mealRoutes.get("/", async (c) => {
  const userId = c.var.user.id;

  const meals = await db
    .select()
    .from(savedMeals)
    .where(eq(savedMeals.userId, userId))
    .orderBy(desc(savedMeals.updatedAt));

  if (meals.length === 0) return c.json({ meals: [] });

  // Pull all items for every meal in one round, then compute totals in-memory
  const mealIds = meals.map((m) => m.id);
  const items = await db
    .select()
    .from(savedMealItems)
    .where(
      mealIds.length === 1
        ? eq(savedMealItems.mealId, mealIds[0]!)
        : inArray(savedMealItems.mealId, mealIds)
    );

  const refs = items
    .filter((i) => i.foodId != null)
    .map((i) => ({
      foodId: i.foodId!,
      foodType: i.foodType as "global" | "custom" | "recipe",
    }));
  const resolved = await resolveFoods(refs);

  const byMeal = new Map<string, typeof items>();
  for (const it of items) {
    if (!byMeal.has(it.mealId)) byMeal.set(it.mealId, []);
    byMeal.get(it.mealId)!.push(it);
  }

  const out = meals.map((m) => {
    const its = byMeal.get(m.id) ?? [];
    let cal = 0, p = 0, c = 0, f = 0;
    for (const it of its) {
      if (!it.foodId) continue;
      const rf = resolved.get(
        key({ foodId: it.foodId, foodType: it.foodType })
      );
      if (!rf) continue;
      const g = Number(it.quantityG);
      cal += rf.perGram.calories * g;
      p += rf.perGram.proteinG * g;
      c += rf.perGram.carbsG * g;
      f += rf.perGram.fatG * g;
    }
    return {
      id: m.id,
      name: m.name,
      itemCount: its.length,
      total: roundSnapshot({ calories: cal, proteinG: p, carbsG: c, fatG: f }),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  });

  return c.json({ meals: out });
});

// ── Get one meal with its items and nutrition ─────────────────────

mealRoutes.get("/:id", async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");

  const meal = await db.query.savedMeals.findFirst({
    where: and(eq(savedMeals.id, id), eq(savedMeals.userId, userId)),
  });
  if (!meal) return c.json({ error: "Meal not found" }, 404);

  const items = await db
    .select()
    .from(savedMealItems)
    .where(eq(savedMealItems.mealId, id))
    .orderBy(savedMealItems.sortOrder);

  const resolved = await resolveFoods(
    items
      .filter((i) => i.foodId != null)
      .map((i) => ({
        foodId: i.foodId!,
        foodType: i.foodType as "global" | "custom" | "recipe",
      }))
  );

  let cal = 0, p = 0, carbs = 0, fat = 0;
  const hydrated = items.map((i) => {
    const rf = i.foodId
      ? resolved.get(key({ foodId: i.foodId, foodType: i.foodType }))
      : null;
    const g = Number(i.quantityG);
    const n = rf
      ? {
          calories: rf.perGram.calories * g,
          proteinG: rf.perGram.proteinG * g,
          carbsG: rf.perGram.carbsG * g,
          fatG: rf.perGram.fatG * g,
        }
      : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    cal += n.calories;
    p += n.proteinG;
    carbs += n.carbsG;
    fat += n.fatG;
    return {
      id: i.id,
      foodId: i.foodId,
      foodType: i.foodType,
      foodName: rf?.name ?? "Unknown",
      quantityG: g,
      servingLabel: i.servingLabel,
      sortOrder: i.sortOrder ?? 0,
      nutrition: roundSnapshot(n),
    };
  });

  return c.json({
    id: meal.id,
    name: meal.name,
    items: hydrated,
    total: roundSnapshot({ calories: cal, proteinG: p, carbsG: carbs, fatG: fat }),
    createdAt: meal.createdAt,
    updatedAt: meal.updatedAt,
  });
});

// ── Create a saved meal ───────────────────────────────────────────

mealRoutes.post("/", zValidator("json", CreateMealSchema), async (c) => {
  const userId = c.var.user.id;
  const input = c.req.valid("json");

  const [meal] = await db
    .insert(savedMeals)
    .values({ userId, name: input.name })
    .returning();

  if (!meal) return c.json({ error: "Failed to create meal" }, 500);

  await db.insert(savedMealItems).values(
    input.items.map((it, idx) => ({
      mealId: meal.id,
      foodId: it.foodId,
      foodType: it.foodType,
      quantityG: String(it.quantityG),
      servingLabel: it.servingLabel,
      sortOrder: idx,
    }))
  );

  return c.json({ id: meal.id }, 201);
});

// ── Create a saved meal from an existing day's logged items ───────

mealRoutes.post(
  "/from-log",
  zValidator("json", CreateMealFromLogSchema),
  async (c) => {
    const userId = c.var.user.id;
    const input = c.req.valid("json");

    const log = await db.query.foodLogs.findFirst({
      where: and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, input.date)),
    });
    if (!log) return c.json({ error: "No log for that date" }, 404);

    const items = await db
      .select()
      .from(foodLogItems)
      .where(
        and(
          eq(foodLogItems.logId, log.id),
          eq(foodLogItems.mealSlot, input.mealSlot)
        )
      )
      .orderBy(foodLogItems.sortOrder);

    if (items.length === 0)
      return c.json({ error: "No items in that meal slot" }, 400);

    const [meal] = await db
      .insert(savedMeals)
      .values({ userId, name: input.name })
      .returning();
    if (!meal) return c.json({ error: "Failed to create meal" }, 500);

    await db.insert(savedMealItems).values(
      items.map((it, idx) => ({
        mealId: meal.id,
        foodId: it.foodId,
        foodType: it.foodType as "global" | "custom" | "recipe",
        quantityG: String(it.quantityG),
        servingLabel: it.servingLabel,
        sortOrder: idx,
      }))
    );

    return c.json({ id: meal.id }, 201);
  }
);

// ── Delete a saved meal ───────────────────────────────────────────

mealRoutes.delete("/:id", async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");

  const existing = await db.query.savedMeals.findFirst({
    where: and(eq(savedMeals.id, id), eq(savedMeals.userId, userId)),
  });
  if (!existing) return c.json({ error: "Meal not found" }, 404);

  await db.delete(savedMeals).where(eq(savedMeals.id, id));
  return c.json({ success: true });
});

// ── Log all items from a saved meal into the diary ────────────────
//
// Each saved_meal_item becomes its own food_log_item so micronutrient
// rollup stays accurate and users can delete a single item later.

mealRoutes.post("/:id/log", zValidator("json", LogMealSchema), async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const date = input.date ?? new Date().toISOString().split("T")[0]!;

  const meal = await db.query.savedMeals.findFirst({
    where: and(eq(savedMeals.id, id), eq(savedMeals.userId, userId)),
  });
  if (!meal) return c.json({ error: "Meal not found" }, 404);

  const items = await db
    .select()
    .from(savedMealItems)
    .where(eq(savedMealItems.mealId, id))
    .orderBy(savedMealItems.sortOrder);

  if (items.length === 0) return c.json({ error: "Meal has no items" }, 400);

  const resolved = await resolveFoods(
    items
      .filter((i) => i.foodId != null)
      .map((i) => ({
        foodId: i.foodId!,
        foodType: i.foodType as "global" | "custom" | "recipe",
      }))
  );

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

  const toInsert = items
    .filter((it) => it.foodId != null)
    .map((it) => {
      const rf = resolved.get(
        key({ foodId: it.foodId!, foodType: it.foodType })
      );
      const g = Number(it.quantityG);
      const n = rf
        ? {
            calories: rf.perGram.calories * g,
            proteinG: rf.perGram.proteinG * g,
            carbsG: rf.perGram.carbsG * g,
            fatG: rf.perGram.fatG * g,
          }
        : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
      return {
        logId: logRow.id,
        userId,
        mealSlot: input.mealSlot,
        foodId: it.foodId,
        foodType: it.foodType as "global" | "custom" | "recipe",
        foodName: rf?.name ?? "Unknown",
        quantityG: String(g),
        servingLabel: it.servingLabel,
        calories: String(Math.round(n.calories * 10) / 10),
        proteinG: String(Math.round(n.proteinG * 100) / 100),
        carbsG: String(Math.round(n.carbsG * 100) / 100),
        fatG: String(Math.round(n.fatG * 100) / 100),
      };
    });

  await db.insert(foodLogItems).values(toInsert);
  await recomputeDailyTotals(logRow.id);

  return c.json({ insertedCount: toInsert.length }, 201);
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
