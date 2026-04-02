import type { ActivityLevel, Goal } from "./types";

// ── Activity multipliers for TDEE calculation ─────────────────────

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// ── Macro split defaults (as percentages of total calories) ───────

export const DEFAULT_MACRO_SPLITS: Record<
  Goal,
  { protein: number; carbs: number; fat: number }
> = {
  lose: { protein: 0.3, carbs: 0.35, fat: 0.35 },
  gain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.3 },
};

// ── Dietary preference overrides ──────────────────────────────────

export const DIETARY_MACRO_OVERRIDES: Record<
  string,
  { protein: number; carbs: number; fat: number } | undefined
> = {
  keto: { protein: 0.25, carbs: 0.05, fat: 0.7 },
  low_carb: { protein: 0.3, carbs: 0.2, fat: 0.5 },
  high_protein: { protein: 0.4, carbs: 0.35, fat: 0.25 },
};

// ── Safety floors ─────────────────────────────────────────────────

export const CALORIE_FLOOR = {
  male: 1500,
  female: 1200,
  other: 1350, // average of male and female
} as const;

// Minimum protein: 0.7g per kg body weight
export const MIN_PROTEIN_G_PER_KG = 0.7;

// ── Pace → daily calorie adjustment ──────────────────────────────

// 1 kg of body fat ≈ 7700 kcal
// daily_adjustment = (pace_kg_per_week × 7700) / 7
export const KCAL_PER_KG_FAT = 7700;

// ── Suggestion engine weights ─────────────────────────────────────

export const SUGGESTION_WEIGHTS = {
  calorieFit: 0.25,
  proteinFit: 0.3,
  carbsFit: 0.15,
  fatFit: 0.15,
  familiarity: 0.1,
  preference: 0.05,
} as const;

// ── Familiarity thresholds ────────────────────────────────────────

export const FAMILIARITY_SCORES = {
  highFrequency: { minLogs: 5, score: 100 },
  mediumFrequency: { minLogs: 2, score: 70 },
  lowFrequency: { minLogs: 1, score: 40 },
  favorite: { score: 60 },
  unknown: { score: 0 },
} as const;

// ── App defaults ──────────────────────────────────────────────────

export const DEFAULT_MEAL_SLOTS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const;

export const RECENT_FOODS_DAYS = 14;
export const FOOD_HISTORY_DAYS = 30;
export const MAX_COMBINATION_CANDIDATES = 20;
export const MAX_CALORIE_OVERAGE_RATIO = 1.5;
export const SHARE_LINK_EXPIRY_DAYS = 30;
