/**
 * Suggestion scoring engine.
 *
 * Each candidate food gets a fit score from 0-100 based on how well
 * it fills the user's remaining calorie and macro budget for the day.
 *
 * Score formula:
 *   fit_score = calorie_fit × 0.25
 *             + protein_fit × 0.30
 *             + carbs_fit   × 0.15
 *             + fat_fit     × 0.15
 *             + familiarity × 0.10
 *             + preference  × 0.05
 */

import type { RemainingBudget } from "@snt/shared";
import { SUGGESTION_WEIGHTS, FAMILIARITY_SCORES } from "@snt/shared";

export interface CandidateFood {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
  // Populated by the caller
  logCount30d?: number;
  isFavorite?: boolean;
}

export interface ScoredCandidate extends CandidateFood {
  fitScore: number;
  breakdown: {
    calorieFit: number;
    proteinFit: number;
    carbsFit: number;
    fatFit: number;
    familiarity: number;
    preference: number;
  };
}

// ── Individual Fit Scores ─────────────────────────────────────────

/**
 * How well a food fills a remaining macro budget.
 *
 * - A food that fills 70-90% of remaining scores highest (bell curve)
 * - Going over is penalized, but mildly up to 10% over
 * - Going way over (>50%) scores near 0
 * - Very small foods (<20% of remaining) score lower
 */
function macroFitScore(foodAmount: number, remaining: number): number {
  if (remaining <= 0) {
    // Already over budget — any additional food is a penalty
    return Math.max(0, 20 - foodAmount * 2);
  }

  const ratio = foodAmount / remaining;

  if (ratio <= 0) return 0;

  if (ratio <= 1) {
    // Under budget: bell curve peaking at 0.8 (80% of remaining)
    // Score = 100 × (1 - |ratio - 0.8| / 0.8)
    // This gives: 0% ratio → 0, 40% → 50, 80% → 100, 100% → 75
    const distFromPeak = Math.abs(ratio - 0.8);
    return Math.max(0, 100 * (1 - distFromPeak / 0.8));
  }

  // Over budget: linear penalty
  const overage = ratio - 1;
  return Math.max(0, 75 - overage * 150);
}

// ── Familiarity Score ─────────────────────────────────────────────

function familiarityScore(logCount: number, isFavorite: boolean): number {
  if (logCount >= FAMILIARITY_SCORES.highFrequency.minLogs) {
    return FAMILIARITY_SCORES.highFrequency.score;
  }
  if (logCount >= FAMILIARITY_SCORES.mediumFrequency.minLogs) {
    return FAMILIARITY_SCORES.mediumFrequency.score;
  }
  if (logCount >= FAMILIARITY_SCORES.lowFrequency.minLogs) {
    return FAMILIARITY_SCORES.lowFrequency.score;
  }
  if (isFavorite) {
    return FAMILIARITY_SCORES.favorite.score;
  }
  return FAMILIARITY_SCORES.unknown.score;
}

// ── Preference Score ──────────────────────────────────────────────

function preferenceScore(
  foodTags: string[],
  activeFilters: string[]
): number {
  if (activeFilters.length === 0) return 50; // neutral when no filters

  let matched = 0;
  for (const filter of activeFilters) {
    if (foodTags.includes(filter)) matched++;
  }

  return activeFilters.length > 0
    ? (matched / activeFilters.length) * 100
    : 0;
}

// ── Main Scoring Function ─────────────────────────────────────────

export function scoreCandidate(
  food: CandidateFood,
  remaining: RemainingBudget,
  activeFilters: string[] = []
): ScoredCandidate {
  const calFit = macroFitScore(food.calories, remaining.calories);
  const proFit = macroFitScore(food.proteinG, remaining.proteinG);
  const carbFit = macroFitScore(food.carbsG, remaining.carbsG);
  const fatFit = macroFitScore(food.fatG, remaining.fatG);
  const fam = familiarityScore(food.logCount30d ?? 0, food.isFavorite ?? false);
  const pref = preferenceScore(food.tags, activeFilters);

  const fitScore =
    calFit * SUGGESTION_WEIGHTS.calorieFit +
    proFit * SUGGESTION_WEIGHTS.proteinFit +
    carbFit * SUGGESTION_WEIGHTS.carbsFit +
    fatFit * SUGGESTION_WEIGHTS.fatFit +
    fam * SUGGESTION_WEIGHTS.familiarity +
    pref * SUGGESTION_WEIGHTS.preference;

  return {
    ...food,
    fitScore: Math.round(fitScore * 10) / 10,
    breakdown: {
      calorieFit: Math.round(calFit),
      proteinFit: Math.round(proFit),
      carbsFit: Math.round(carbFit),
      fatFit: Math.round(fatFit),
      familiarity: Math.round(fam),
      preference: Math.round(pref),
    },
  };
}

// ── Batch Score & Rank ────────────────────────────────────────────

export function rankCandidates(
  candidates: CandidateFood[],
  remaining: RemainingBudget,
  activeFilters: string[] = [],
  limit: number = 10
): ScoredCandidate[] {
  return candidates
    .map((c) => scoreCandidate(c, remaining, activeFilters))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
}
