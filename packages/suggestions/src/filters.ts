/**
 * Hard filters — exclude foods before scoring.
 *
 * Applied before the scoring engine runs so we never waste
 * compute on foods the user can't or won't eat.
 */

import type { RemainingBudget } from "@snt/shared";
import { MAX_CALORIE_OVERAGE_RATIO } from "@snt/shared";
import type { CandidateFood } from "./scoring";

export interface FilterConfig {
  allergies: string[];
  dislikedFoods: string[];
  dietaryPreferences: string[];
  remaining: RemainingBudget;
}

// Foods tagged as containing these allergens
const ALLERGEN_TAG_MAP: Record<string, string[]> = {
  peanuts: ["peanut", "peanuts"],
  tree_nuts: ["almond", "almonds", "walnut", "walnuts", "cashew", "cashews", "pecan", "pecans", "pistachio"],
  shellfish: ["shrimp", "crab", "lobster", "shellfish"],
  fish: ["salmon", "tuna", "cod", "tilapia", "fish"],
  dairy: ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
  eggs: ["egg", "eggs"],
  soy: ["soy", "tofu", "edamame"],
  wheat: ["wheat", "bread", "pasta", "flour"],
  gluten: ["wheat", "barley", "rye", "bread", "pasta"],
};

// Dietary preference exclusions
const DIET_EXCLUSIONS: Record<string, string[]> = {
  vegetarian: ["protein"], // exclude meat category — a rough heuristic
  vegan: ["protein", "dairy"],
  keto: [], // handled by macro scoring, not hard filter
  paleo: ["grain", "legume", "dairy"],
};

// More precise: check food name for animal products
const MEAT_KEYWORDS = [
  "chicken", "beef", "pork", "turkey", "lamb", "veal", "bacon",
  "sausage", "steak", "ham", "salami", "pepperoni", "brisket",
  "ribs", "wing", "thigh", "drumstick",
];

const ANIMAL_KEYWORDS = [
  ...MEAT_KEYWORDS,
  "milk", "cheese", "yogurt", "butter", "cream", "egg",
  "whey", "casein", "gelatin", "honey",
];

/**
 * Returns true if the food should be EXCLUDED (filtered out).
 */
export function shouldExclude(
  food: CandidateFood,
  config: FilterConfig
): boolean {
  const nameLower = food.name.toLowerCase();

  // 1. Allergen check
  for (const allergy of config.allergies) {
    const keywords = ALLERGEN_TAG_MAP[allergy.toLowerCase()];
    if (keywords) {
      for (const kw of keywords) {
        if (nameLower.includes(kw)) return true;
      }
    }
  }

  // 2. Disliked foods (simple name match)
  for (const disliked of config.dislikedFoods) {
    if (nameLower.includes(disliked.toLowerCase())) return true;
  }

  // 3. Dietary preference exclusions
  for (const pref of config.dietaryPreferences) {
    if (pref === "vegetarian") {
      for (const kw of MEAT_KEYWORDS) {
        if (nameLower.includes(kw)) return true;
      }
    }
    if (pref === "vegan") {
      for (const kw of ANIMAL_KEYWORDS) {
        if (nameLower.includes(kw)) return true;
      }
    }
  }

  // 4. Way over calorie budget
  if (
    config.remaining.calories > 0 &&
    food.calories > config.remaining.calories * MAX_CALORIE_OVERAGE_RATIO
  ) {
    return true;
  }

  return false;
}

/**
 * Apply all hard filters to a candidate list.
 */
export function applyFilters(
  candidates: CandidateFood[],
  config: FilterConfig
): CandidateFood[] {
  return candidates.filter((c) => !shouldExclude(c, config));
}
