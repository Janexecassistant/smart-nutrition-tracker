/**
 * Combination suggestion engine (Tier 3).
 *
 * Finds 2-food and 3-food combos that together closely match
 * the user's remaining calorie and macro budget.
 *
 * Algorithm:
 *   1. Take top 20 candidates from Tier 2 (already scored)
 *   2. For each pair (i, j) where i ≠ j, compute combined macros
 *   3. Score how closely the combo matches remaining budget (gap_score)
 *   4. Return top 3 pairs with lowest gap_score
 *   5. Optionally extend to triples if no pair scores well
 */

import type { RemainingBudget } from "@snt/shared";
import { MAX_COMBINATION_CANDIDATES } from "@snt/shared";
import type { ScoredCandidate } from "./scoring";

export interface FoodCombo {
  items: Pick<ScoredCandidate, "id" | "name" | "calories" | "proteinG" | "carbsG" | "fatG">[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  gapScore: number;
}

/**
 * Calculate how closely a combination matches remaining budget.
 * Lower is better. 0 = perfect match.
 */
function computeGapScore(
  totalCal: number,
  totalPro: number,
  totalCarb: number,
  totalFat: number,
  remaining: RemainingBudget
): number {
  const calGap = remaining.calories > 0
    ? Math.abs(remaining.calories - totalCal) / remaining.calories
    : totalCal > 0 ? 1 : 0;

  const proGap = remaining.proteinG > 0
    ? Math.abs(remaining.proteinG - totalPro) / remaining.proteinG
    : totalPro > 0 ? 1 : 0;

  const carbGap = remaining.carbsG > 0
    ? Math.abs(remaining.carbsG - totalCarb) / remaining.carbsG
    : totalCarb > 0 ? 1 : 0;

  const fatGap = remaining.fatG > 0
    ? Math.abs(remaining.fatG - totalFat) / remaining.fatG
    : totalFat > 0 ? 1 : 0;

  // Weighted same as the main scoring engine
  return calGap * 0.25 + proGap * 0.30 + carbGap * 0.15 + fatGap * 0.15;
}

/**
 * Find the best 2-food combinations from a ranked candidate list.
 */
export function findPairCombinations(
  candidates: ScoredCandidate[],
  remaining: RemainingBudget,
  maxResults: number = 3
): FoodCombo[] {
  const pool = candidates.slice(0, MAX_COMBINATION_CANDIDATES);
  const combos: FoodCombo[] = [];

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i]!;
      const b = pool[j]!;

      const totalCal = a.calories + b.calories;
      const totalPro = a.proteinG + b.proteinG;
      const totalCarb = a.carbsG + b.carbsG;
      const totalFat = a.fatG + b.fatG;

      // Skip combos that are way over budget
      if (totalCal > remaining.calories * 1.3) continue;

      const gapScore = computeGapScore(
        totalCal, totalPro, totalCarb, totalFat, remaining
      );

      combos.push({
        items: [
          { id: a.id, name: a.name, calories: a.calories, proteinG: a.proteinG, carbsG: a.carbsG, fatG: a.fatG },
          { id: b.id, name: b.name, calories: b.calories, proteinG: b.proteinG, carbsG: b.carbsG, fatG: b.fatG },
        ],
        totalCalories: Math.round(totalCal * 10) / 10,
        totalProteinG: Math.round(totalPro * 100) / 100,
        totalCarbsG: Math.round(totalCarb * 100) / 100,
        totalFatG: Math.round(totalFat * 100) / 100,
        gapScore: Math.round(gapScore * 1000) / 1000,
      });
    }
  }

  return combos
    .sort((a, b) => a.gapScore - b.gapScore)
    .slice(0, maxResults);
}

/**
 * Find the best 3-food combinations. Only called if pairs aren't great.
 */
export function findTripleCombinations(
  candidates: ScoredCandidate[],
  remaining: RemainingBudget,
  maxResults: number = 2
): FoodCombo[] {
  // Use a smaller pool for triples (O(n³) complexity)
  const pool = candidates.slice(0, 12);
  const combos: FoodCombo[] = [];

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      for (let k = j + 1; k < pool.length; k++) {
        const a = pool[i]!;
        const b = pool[j]!;
        const c = pool[k]!;

        const totalCal = a.calories + b.calories + c.calories;
        const totalPro = a.proteinG + b.proteinG + c.proteinG;
        const totalCarb = a.carbsG + b.carbsG + c.carbsG;
        const totalFat = a.fatG + b.fatG + c.fatG;

        if (totalCal > remaining.calories * 1.3) continue;

        const gapScore = computeGapScore(
          totalCal, totalPro, totalCarb, totalFat, remaining
        );

        combos.push({
          items: [
            { id: a.id, name: a.name, calories: a.calories, proteinG: a.proteinG, carbsG: a.carbsG, fatG: a.fatG },
            { id: b.id, name: b.name, calories: b.calories, proteinG: b.proteinG, carbsG: b.carbsG, fatG: b.fatG },
            { id: c.id, name: c.name, calories: c.calories, proteinG: c.proteinG, carbsG: c.carbsG, fatG: c.fatG },
          ],
          totalCalories: Math.round(totalCal * 10) / 10,
          totalProteinG: Math.round(totalPro * 100) / 100,
          totalCarbsG: Math.round(totalCarb * 100) / 100,
          totalFatG: Math.round(totalFat * 100) / 100,
          gapScore: Math.round(gapScore * 1000) / 1000,
        });
      }
    }
  }

  return combos
    .sort((a, b) => a.gapScore - b.gapScore)
    .slice(0, maxResults);
}
