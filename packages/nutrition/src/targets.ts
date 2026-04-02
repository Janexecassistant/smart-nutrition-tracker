import type {
  Sex,
  Goal,
  ActivityLevel,
  DietaryPreference,
  MacroTargets,
} from "@snt/shared";
import {
  ACTIVITY_MULTIPLIERS,
  DEFAULT_MACRO_SPLITS,
  DIETARY_MACRO_OVERRIDES,
  CALORIE_FLOOR,
  MIN_PROTEIN_G_PER_KG,
  KCAL_PER_KG_FAT,
} from "@snt/shared";
import { calculateBMR, calculateAge } from "./bmr";

export interface TargetCalculationInput {
  dateOfBirth: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetPaceKgPerWeek: number;
  dietaryPreferences: DietaryPreference[];
}

export interface TargetCalculationResult {
  bmr: number;
  tdee: number;
  targets: MacroTargets;
  calorieFloorApplied: boolean;
  proteinFloorApplied: boolean;
}

/**
 * Calculate recommended calorie and macro targets from a user profile.
 *
 * Steps:
 * 1. BMR via Mifflin-St Jeor
 * 2. TDEE = BMR × activity multiplier
 * 3. Calorie target = TDEE ± pace adjustment
 * 4. Apply safety floor
 * 5. Macro split based on goal (with dietary preference overrides)
 * 6. Enforce protein floor
 */
export function calculateTargets(
  input: TargetCalculationInput
): TargetCalculationResult {
  const age = calculateAge(input.dateOfBirth);

  // Step 1: BMR
  const bmr = calculateBMR(input.weightKg, input.heightCm, age, input.sex);

  // Step 2: TDEE
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];

  // Step 3: Calorie adjustment based on goal and pace
  const dailyAdjustment =
    (input.targetPaceKgPerWeek * KCAL_PER_KG_FAT) / 7;

  let calorieTarget: number;
  switch (input.goal) {
    case "lose":
      calorieTarget = tdee - dailyAdjustment;
      break;
    case "gain":
      calorieTarget = tdee + dailyAdjustment;
      break;
    case "maintain":
      calorieTarget = tdee;
      break;
  }

  // Step 4: Safety floor
  const floor = CALORIE_FLOOR[input.sex];
  let calorieFloorApplied = false;
  if (calorieTarget < floor) {
    calorieTarget = floor;
    calorieFloorApplied = true;
  }

  calorieTarget = Math.round(calorieTarget);

  // Step 5: Macro split
  // Check for dietary preference overrides (first matching override wins)
  let macroSplit = DEFAULT_MACRO_SPLITS[input.goal];
  for (const pref of input.dietaryPreferences) {
    const override = DIETARY_MACRO_OVERRIDES[pref];
    if (override) {
      macroSplit = override;
      break;
    }
  }

  let proteinG = (calorieTarget * macroSplit.protein) / 4;
  let carbsG = (calorieTarget * macroSplit.carbs) / 4;
  let fatG = (calorieTarget * macroSplit.fat) / 9;

  // Step 6: Protein floor (0.7g per kg body weight)
  let proteinFloorApplied = false;
  const proteinFloor = input.weightKg * MIN_PROTEIN_G_PER_KG;
  if (proteinG < proteinFloor) {
    const proteinIncrease = proteinFloor - proteinG;
    proteinG = proteinFloor;
    // Reduce carbs to compensate (protein and carbs are both 4 cal/g)
    carbsG = Math.max(0, carbsG - proteinIncrease);
    proteinFloorApplied = true;
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targets: {
      calories: calorieTarget,
      proteinG: Math.round(proteinG * 10) / 10,
      carbsG: Math.round(carbsG * 10) / 10,
      fatG: Math.round(fatG * 10) / 10,
    },
    calorieFloorApplied,
    proteinFloorApplied,
  };
}
