import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db, userProfiles, userTargets } from "@snt/db";
import { OnboardingProfileSchema, UpdateTargetsSchema } from "@snt/shared";
import { calculateTargets } from "@snt/nutrition";
import { requireAuth } from "../middleware/auth";

export const profileRoutes = new Hono();

// All profile routes require authentication
profileRoutes.use("*", requireAuth);

// ── Get Profile ───────────────────────────────────────────────────

profileRoutes.get("/", async (c) => {
  const userId = c.var.user.id;

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!profile) {
    return c.json({ profile: null, needsOnboarding: true });
  }

  const targets = await db.query.userTargets.findFirst({
    where: eq(userTargets.userId, userId),
  });

  return c.json({
    profile,
    targets,
    needsOnboarding: !profile.onboardingCompleted,
  });
});

// ── Complete Onboarding ───────────────────────────────────────────

profileRoutes.post(
  "/onboarding",
  zValidator("json", OnboardingProfileSchema),
  async (c) => {
    const userId = c.var.user.id;
    const input = c.req.valid("json");

    // Calculate recommended targets
    const result = calculateTargets({
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      heightCm: input.heightCm,
      weightKg: input.currentWeightKg,
      activityLevel: input.activityLevel,
      goal: input.goal,
      targetPaceKgPerWeek: input.targetPaceKgPerWeek,
      dietaryPreferences: input.dietaryPreferences,
    });

    // Upsert profile
    await db
      .insert(userProfiles)
      .values({
        userId,
        dateOfBirth: input.dateOfBirth,
        sex: input.sex,
        heightCm: String(input.heightCm),
        currentWeightKg: String(input.currentWeightKg),
        activityLevel: input.activityLevel,
        goal: input.goal,
        targetPaceKgPerWeek: String(input.targetPaceKgPerWeek),
        dietaryPreferences: input.dietaryPreferences,
        allergies: input.allergies,
        unitSystem: input.unitSystem,
        timezone: input.timezone,
        onboardingCompleted: true,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          dateOfBirth: input.dateOfBirth,
          sex: input.sex,
          heightCm: String(input.heightCm),
          currentWeightKg: String(input.currentWeightKg),
          activityLevel: input.activityLevel,
          goal: input.goal,
          targetPaceKgPerWeek: String(input.targetPaceKgPerWeek),
          dietaryPreferences: input.dietaryPreferences,
          allergies: input.allergies,
          unitSystem: input.unitSystem,
          timezone: input.timezone,
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      });

    // Upsert targets
    await db
      .insert(userTargets)
      .values({
        userId,
        calories: String(result.targets.calories),
        proteinG: String(result.targets.proteinG),
        carbsG: String(result.targets.carbsG),
        fatG: String(result.targets.fatG),
        source: "auto",
      })
      .onConflictDoUpdate({
        target: userTargets.userId,
        set: {
          calories: String(result.targets.calories),
          proteinG: String(result.targets.proteinG),
          carbsG: String(result.targets.carbsG),
          fatG: String(result.targets.fatG),
          source: "auto",
          updatedAt: new Date(),
        },
      });

    return c.json(
      {
        targets: result.targets,
        bmr: result.bmr,
        tdee: result.tdee,
        calorieFloorApplied: result.calorieFloorApplied,
        proteinFloorApplied: result.proteinFloorApplied,
      },
      201
    );
  }
);

// ── Update Targets Manually ───────────────────────────────────────

profileRoutes.put(
  "/targets",
  zValidator("json", UpdateTargetsSchema),
  async (c) => {
    const userId = c.var.user.id;
    const input = c.req.valid("json");

    await db
      .insert(userTargets)
      .values({
        userId,
        calories: String(input.calories),
        proteinG: String(input.proteinG),
        carbsG: String(input.carbsG),
        fatG: String(input.fatG),
        source: "manual",
      })
      .onConflictDoUpdate({
        target: userTargets.userId,
        set: {
          calories: String(input.calories),
          proteinG: String(input.proteinG),
          carbsG: String(input.carbsG),
          fatG: String(input.fatG),
          source: "manual",
          updatedAt: new Date(),
        },
      });

    return c.json({ targets: input });
  }
);
