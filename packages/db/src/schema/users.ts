import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// ── User Profiles ─────────────────────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  displayName: text("display_name"),
  dateOfBirth: date("date_of_birth"),
  sex: text("sex", { enum: ["male", "female", "other"] }),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  currentWeightKg: numeric("current_weight_kg", { precision: 5, scale: 1 }),
  activityLevel: text("activity_level", {
    enum: [
      "sedentary",
      "lightly_active",
      "moderately_active",
      "very_active",
      "extremely_active",
    ],
  }),
  goal: text("goal", { enum: ["lose", "gain", "maintain"] }),
  targetPaceKgPerWeek: numeric("target_pace_kg_per_week", {
    precision: 3,
    scale: 2,
  }),
  dietaryPreferences: text("dietary_preferences").array().default([]),
  allergies: text("allergies").array().default([]),
  dislikedFoods: text("disliked_foods").array().default([]),
  unitSystem: text("unit_system", { enum: ["metric", "imperial"] }).default(
    "metric"
  ),
  timezone: text("timezone").default("UTC"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── User Targets ──────────────────────────────────────────────────

export const userTargets = pgTable("user_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  calories: numeric("calories", { precision: 6, scale: 0 }).notNull(),
  proteinG: numeric("protein_g", { precision: 5, scale: 1 }).notNull(),
  carbsG: numeric("carbs_g", { precision: 5, scale: 1 }).notNull(),
  fatG: numeric("fat_g", { precision: 5, scale: 1 }).notNull(),
  source: text("source", { enum: ["auto", "manual", "hybrid"] }).default(
    "auto"
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
