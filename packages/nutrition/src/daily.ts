import type { MacroSnapshot, MacroTargets, RemainingBudget } from "@snt/shared";

/**
 * Calculate remaining budget for the day.
 */
export function calculateRemaining(
  target: MacroTargets,
  consumed: MacroSnapshot
): RemainingBudget {
  return {
    calories: Math.max(0, target.calories - consumed.calories),
    proteinG: Math.max(0, target.proteinG - consumed.proteinG),
    carbsG: Math.max(0, target.carbsG - consumed.carbsG),
    fatG: Math.max(0, target.fatG - consumed.fatG),
  };
}

/**
 * Calculate percentage of target consumed.
 */
export function calculateAdherence(
  target: MacroTargets,
  consumed: MacroSnapshot
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    calories: target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0,
    protein: target.proteinG > 0 ? (consumed.proteinG / target.proteinG) * 100 : 0,
    carbs: target.carbsG > 0 ? (consumed.carbsG / target.carbsG) * 100 : 0,
    fat: target.fatG > 0 ? (consumed.fatG / target.fatG) * 100 : 0,
  };
}

/**
 * Scale a food's nutrition values to a given quantity in grams.
 */
export function scaleNutrition(
  baseServingG: number,
  baseMacros: MacroSnapshot,
  quantityG: number
): MacroSnapshot {
  if (baseServingG <= 0) return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const ratio = quantityG / baseServingG;
  return {
    calories: Math.round(baseMacros.calories * ratio * 10) / 10,
    proteinG: Math.round(baseMacros.proteinG * ratio * 100) / 100,
    carbsG: Math.round(baseMacros.carbsG * ratio * 100) / 100,
    fatG: Math.round(baseMacros.fatG * ratio * 100) / 100,
  };
}

/**
 * Sum multiple macro snapshots into a total.
 */
export function sumMacros(items: MacroSnapshot[]): MacroSnapshot {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteinG: acc.proteinG + item.proteinG,
      carbsG: acc.carbsG + item.carbsG,
      fatG: acc.fatG + item.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}
