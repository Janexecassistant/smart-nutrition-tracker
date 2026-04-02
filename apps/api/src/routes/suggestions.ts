import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db, foodLogs, userTargets, foods } from "@snt/db";
import { SuggestionRequestSchema } from "@snt/shared";
import { calculateRemaining } from "@snt/nutrition";
import { requireAuth } from "../middleware/auth";

export const suggestionRoutes = new Hono();

suggestionRoutes.use("*", requireAuth);

// ── Get Suggestions ───────────────────────────────────────────────

suggestionRoutes.get(
  "/",
  zValidator("query", SuggestionRequestSchema),
  async (c) => {
    const userId = c.var.user.id;
    const { mealSlot, filters } = c.req.valid("query");

    // Get user's targets
    const targets = await db.query.userTargets.findFirst({
      where: eq(userTargets.userId, userId),
    });

    if (!targets) {
      return c.json(
        { error: "No targets set. Complete onboarding first." },
        400
      );
    }

    // Get today's totals
    const today = new Date().toISOString().split("T")[0]!;
    const todayLog = await db.query.foodLogs.findFirst({
      where: and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, today)),
    });

    const consumed = {
      calories: Number(todayLog?.totalCalories ?? 0),
      proteinG: Number(todayLog?.totalProteinG ?? 0),
      carbsG: Number(todayLog?.totalCarbsG ?? 0),
      fatG: Number(todayLog?.totalFatG ?? 0),
    };

    const target = {
      calories: Number(targets.calories),
      proteinG: Number(targets.proteinG),
      carbsG: Number(targets.carbsG),
      fatG: Number(targets.fatG),
    };

    const remaining = calculateRemaining(target, consumed);

    // MVP suggestion: return top foods from DB sorted by protein density
    // The full scoring engine (Tier 1/2/3) will be built in a follow-up pass
    const suggestedFoods = await db
      .select()
      .from(foods)
      .where(eq(foods.isVerified, true))
      .limit(10);

    return c.json({
      remaining,
      consumed,
      target,
      suggestedFoods: suggestedFoods.map((f) => ({
        ...f,
        fitScore: 0, // placeholder — real scoring engine coming soon
      })),
      combinations: [], // placeholder — combination logic coming soon
    });
  }
);
