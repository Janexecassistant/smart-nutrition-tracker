import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db, foodLogs, foodLogItems } from "@snt/db";
import { LogFoodItemSchema } from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

export const logRoutes = new Hono();

logRoutes.use("*", requireAuth);

// ── Get Today's Log ───────────────────────────────────────────────

logRoutes.get("/today", async (c) => {
  const userId = c.var.user.id;
  const today = new Date().toISOString().split("T")[0]!;

  return getLogForDate(c, userId, today);
});

// ── Get Log for a Specific Date ───────────────────────────────────

logRoutes.get(
  "/:date",
  zValidator(
    "param",
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
  ),
  async (c) => {
    const userId = c.var.user.id;
    const { date } = c.req.valid("param");

    return getLogForDate(c, userId, date);
  }
);

// ── Log a Food Item ───────────────────────────────────────────────

logRoutes.post(
  "/",
  zValidator("json", LogFoodItemSchema.extend({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })),
  async (c) => {
    const userId = c.var.user.id;
    const input = c.req.valid("json");
    const date = input.date ?? new Date().toISOString().split("T")[0]!;

    // Ensure a food_log row exists for this date (upsert)
    const [log] = await db
      .insert(foodLogs)
      .values({
        userId,
        logDate: date,
      })
      .onConflictDoNothing()
      .returning();

    // Get the log ID (it might already exist)
    const existingLog =
      log ??
      (await db.query.foodLogs.findFirst({
        where: and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, date)),
      }));

    if (!existingLog) {
      return c.json({ error: "Failed to create food log" }, 500);
    }

    // Insert the food log item
    const [item] = await db
      .insert(foodLogItems)
      .values({
        logId: existingLog.id,
        userId,
        mealSlot: input.mealSlot,
        foodId: input.foodId,
        foodType: input.foodType,
        foodName: input.foodName,
        quantityG: String(input.quantityG),
        servingLabel: input.servingLabel,
        calories: String(input.calories),
        proteinG: String(input.proteinG),
        carbsG: String(input.carbsG),
        fatG: String(input.fatG),
      })
      .returning();

    // Recompute daily totals
    await recomputeDailyTotals(existingLog.id);

    return c.json({ item }, 201);
  }
);

// ── Delete a Logged Item ──────────────────────────────────────────

logRoutes.delete("/:itemId", async (c) => {
  const userId = c.var.user.id;
  const itemId = c.req.param("itemId");

  // Find the item to get its log ID
  const item = await db.query.foodLogItems.findFirst({
    where: and(eq(foodLogItems.id, itemId), eq(foodLogItems.userId, userId)),
  });

  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  await db.delete(foodLogItems).where(eq(foodLogItems.id, itemId));

  // Recompute totals
  await recomputeDailyTotals(item.logId);

  return c.json({ success: true });
});

// ── Helpers ───────────────────────────────────────────────────────

async function getLogForDate(c: any, userId: string, date: string) {
  const log = await db.query.foodLogs.findFirst({
    where: and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, date)),
  });

  if (!log) {
    return c.json({
      date,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    });
  }

  const items = await db
    .select()
    .from(foodLogItems)
    .where(eq(foodLogItems.logId, log.id))
    .orderBy(foodLogItems.mealSlot, foodLogItems.sortOrder);

  // Group by meal slot
  const meals: Record<string, typeof items> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const item of items) {
    meals[item.mealSlot]?.push(item);
  }

  return c.json({
    date,
    meals,
    totals: {
      calories: Number(log.totalCalories),
      proteinG: Number(log.totalProteinG),
      carbsG: Number(log.totalCarbsG),
      fatG: Number(log.totalFatG),
    },
  });
}

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
