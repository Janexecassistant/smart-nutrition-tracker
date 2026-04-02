import { z } from "zod";

// ── Enums as Zod schemas ──────────────────────────────────────────

export const GoalSchema = z.enum(["lose", "gain", "maintain"]);

export const ActivityLevelSchema = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extremely_active",
]);

export const SexSchema = z.enum(["male", "female", "other"]);

export const MealSlotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const FoodTypeSchema = z.enum(["global", "custom", "recipe", "quick_add"]);

export const UnitSystemSchema = z.enum(["metric", "imperial"]);

export const HealthFocusSchema = z.enum([
  "pregnancy",
  "diabetic",
  "celiac",
  "low_sodium",
  "heart_healthy",
  "kidney_friendly",
  "ibs_fodmap",
  "anti_inflammatory",
  "pcos",
  "none",
]);

export const DietaryPreferenceSchema = z.enum([
  "vegetarian",
  "vegan",
  "keto",
  "low_carb",
  "high_protein",
  "gluten_free",
  "dairy_free",
  "paleo",
  "none",
]);

// ── Onboarding ────────────────────────────────────────────────────

export const OnboardingProfileSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  sex: SexSchema,
  heightCm: z.number().min(50).max(300),
  currentWeightKg: z.number().min(20).max(500),
  activityLevel: ActivityLevelSchema,
  goal: GoalSchema,
  healthFocus: z.array(HealthFocusSchema).default([]),
  targetPaceKgPerWeek: z.number().min(0).max(1.0),
  dietaryPreferences: z.array(DietaryPreferenceSchema).default([]),
  allergies: z.array(z.string()).default([]),
  unitSystem: UnitSystemSchema.default("metric"),
  timezone: z.string().default("UTC"),
});

export type OnboardingProfileInput = z.infer<typeof OnboardingProfileSchema>;

// ── Targets ───────────────────────────────────────────────────────

export const UpdateTargetsSchema = z.object({
  calories: z.number().int().min(800).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(1000),
});

export type UpdateTargetsInput = z.infer<typeof UpdateTargetsSchema>;

// ── Food logging ──────────────────────────────────────────────────

export const LogFoodItemSchema = z.object({
  mealSlot: MealSlotSchema,
  foodId: z.string().uuid().optional(),
  foodType: FoodTypeSchema,
  foodName: z.string().min(1).max(500),
  quantityG: z.number().positive().max(50000),
  servingLabel: z.string().max(100).optional(),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
});

export type LogFoodItemInput = z.infer<typeof LogFoodItemSchema>;

// ── Custom food ───────────────────────────────────────────────────

export const CreateCustomFoodSchema = z.object({
  name: z.string().min(1).max(500),
  brand: z.string().max(200).optional(),
  barcode: z.string().max(50).optional(),
  servingSizeG: z.number().positive(),
  servingLabel: z.string().max(100).optional(),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fiberG: z.number().min(0).optional(),
  sugarG: z.number().min(0).optional(),
  sodiumMg: z.number().min(0).optional(),
});

export type CreateCustomFoodInput = z.infer<typeof CreateCustomFoodSchema>;

// ── Recipe ────────────────────────────────────────────────────────

export const RecipeIngredientSchema = z.object({
  foodId: z.string().uuid(),
  foodType: z.enum(["global", "custom"]),
  quantityG: z.number().positive(),
  label: z.string().max(100).optional(),
});

export const CreateRecipeSchema = z.object({
  name: z.string().min(1).max(500),
  servings: z.number().int().min(1).max(100),
  notes: z.string().max(2000).optional(),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(100),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

// ── Weight log ────────────────────────────────────────────────────

export const LogWeightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  weightKg: z.number().min(20).max(500),
  notes: z.string().max(500).optional(),
});

export type LogWeightInput = z.infer<typeof LogWeightSchema>;

// ── Search ────────────────────────────────────────────────────────

export const FoodSearchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FoodSearchInput = z.infer<typeof FoodSearchSchema>;

// ── Suggestions ───────────────────────────────────────────────────

export const SuggestionRequestSchema = z.object({
  mealSlot: MealSlotSchema.optional(),
  filters: z.array(z.string()).default([]),
});

export type SuggestionRequestInput = z.infer<typeof SuggestionRequestSchema>;

// ── Sharing ───────────────────────────────────────────────────────

export const ShareDataTypeSchema = z.enum([
  "diary",
  "weight",
  "measurements",
  "targets",
  "summary",
]);

export const CreateShareSchema = z.object({
  recipientEmail: z.string().email(),
  grants: z.array(
    z.object({
      dataType: ShareDataTypeSchema,
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      isOngoing: z.boolean().default(true),
    })
  ).min(1),
});

export type CreateShareInput = z.infer<typeof CreateShareSchema>;
