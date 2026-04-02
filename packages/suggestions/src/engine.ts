/**
 * Main suggestion engine — orchestrates filters, scoring, and combinations.
 *
 * This is the top-level function the API calls. It takes:
 *   - User's remaining budget
 *   - User's profile (allergies, preferences, etc.)
 *   - Candidate foods from the database
 *   - User's food history (for familiarity scoring)
 *   - Active filters from the UI
 *
 * And returns tiered suggestions:
 *   Tier 1: User's own foods (saved meals, recipes, frequents)
 *   Tier 2: Database foods ranked by fit score
 *   Tier 3: 2-food and 3-food combinations
 */

import type { RemainingBudget } from "@snt/shared";
import type { CandidateFood, ScoredCandidate } from "./scoring";
import { rankCandidates } from "./scoring";
import { applyFilters, type FilterConfig } from "./filters";
import { findPairCombinations, findTripleCombinations, type FoodCombo } from "./combinations";

export interface SuggestionInput {
  remaining: RemainingBudget;
  allergies: string[];
  dislikedFoods: string[];
  dietaryPreferences: string[];
  activeFilters: string[];
  /** User's own foods (saved meals, recipes, frequently logged) */
  userFoods: CandidateFood[];
  /** Foods from the global database */
  databaseFoods: CandidateFood[];
}

export interface SuggestionOutput {
  remaining: RemainingBudget;
  /** Tier 1: user's own foods ranked by fit */
  yourFoods: ScoredCandidate[];
  /** Tier 2: database foods ranked by fit */
  suggestedFoods: ScoredCandidate[];
  /** Tier 3: multi-food combos */
  combinations: FoodCombo[];
}

export function generateSuggestions(input: SuggestionInput): SuggestionOutput {
  const filterConfig: FilterConfig = {
    allergies: input.allergies,
    dislikedFoods: input.dislikedFoods,
    dietaryPreferences: input.dietaryPreferences,
    remaining: input.remaining,
  };

  // Tier 1: Score user's own foods (already filtered by ownership)
  const filteredUserFoods = applyFilters(input.userFoods, filterConfig);
  const yourFoods = rankCandidates(
    filteredUserFoods,
    input.remaining,
    input.activeFilters,
    5
  );

  // Tier 2: Score database foods
  const filteredDbFoods = applyFilters(input.databaseFoods, filterConfig);
  const suggestedFoods = rankCandidates(
    filteredDbFoods,
    input.remaining,
    input.activeFilters,
    10
  );

  // Tier 3: Find combinations from top Tier 2 results
  const combinationPool = rankCandidates(
    filteredDbFoods,
    input.remaining,
    input.activeFilters,
    20 // top 20 for combination search
  );

  let combinations = findPairCombinations(combinationPool, input.remaining, 3);

  // If best pair has a poor gap score (>0.4), try triples
  if (combinations.length === 0 || combinations[0]!.gapScore > 0.4) {
    const triples = findTripleCombinations(combinationPool, input.remaining, 2);
    combinations = [...combinations, ...triples]
      .sort((a, b) => a.gapScore - b.gapScore)
      .slice(0, 3);
  }

  return {
    remaining: input.remaining,
    yourFoods,
    suggestedFoods,
    combinations,
  };
}
