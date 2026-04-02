// ── Core domain types ──────────────────────────────────────────────

export type Goal = "lose" | "gain" | "maintain";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

export type Sex = "male" | "female" | "other";

export type UnitSystem = "metric" | "imperial";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodType = "global" | "custom" | "recipe" | "quick_add";

export type FoodSource = "usda" | "off" | "admin" | "community";

export type TargetSource = "auto" | "manual" | "hybrid";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "keto"
  | "low_carb"
  | "high_protein"
  | "gluten_free"
  | "dairy_free"
  | "paleo"
  | "none";

export type ShareStatus = "pending" | "active" | "revoked";

export type ShareDataType =
  | "diary"
  | "weight"
  | "measurements"
  | "targets"
  | "summary";

export type MeasurementType =
  | "waist"
  | "hips"
  | "chest"
  | "bicep_left"
  | "bicep_right"
  | "thigh_left"
  | "thigh_right"
  | "neck";

// ── Interfaces ─────────────────────────────────────────────────────

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MacroSnapshot {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RemainingBudget extends MacroSnapshot {}

export interface NutritionSummary {
  consumed: MacroSnapshot;
  target: MacroTargets;
  remaining: RemainingBudget;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  source: FoodSource;
  servingSizeG: number;
  servingLabel: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  category: string | null;
  tags: string[];
}

export interface LoggedFoodItem {
  id: string;
  mealSlot: MealSlot;
  foodId: string | null;
  foodType: FoodType;
  foodName: string;
  quantityG: number;
  servingLabel: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
}

export interface DailyLog {
  date: string;
  meals: Record<MealSlot, LoggedFoodItem[]>;
  totals: MacroSnapshot;
}

export interface UserProfile {
  displayName: string | null;
  dateOfBirth: string | null;
  sex: Sex | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  targetPaceKgPerWeek: number | null;
  dietaryPreferences: DietaryPreference[];
  allergies: string[];
  dislikedFoods: string[];
  unitSystem: UnitSystem;
  timezone: string;
  onboardingCompleted: boolean;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  notes: string | null;
}

export interface SuggestionRequest {
  mealSlot?: MealSlot;
  filters?: string[];
}

export interface SuggestionResponse {
  remaining: RemainingBudget;
  yourFoods: ScoredFood[];
  suggestedFoods: ScoredFood[];
  combinations: FoodCombination[];
}

export interface ScoredFood extends FoodItem {
  fitScore: number;
}

export interface FoodCombination {
  items: Pick<FoodItem, "name" | "calories" | "proteinG" | "carbsG" | "fatG">[];
  total: MacroSnapshot;
  gapScore: number;
}
