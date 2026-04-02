import type { Sex } from "@snt/shared";

/**
 * Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
 *
 * This is the most validated equation for modern populations and is
 * the standard used by clinical dietitians.
 *
 * Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) + 5
 * Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age_years) - 161
 * Other:  Average of male and female results
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;

  switch (sex) {
    case "male":
      return base + 5;
    case "female":
      return base - 161;
    case "other":
      // Average of male and female
      return base + (5 + -161) / 2;
  }
}

/**
 * Calculate age in years from a date of birth string (YYYY-MM-DD).
 */
export function calculateAge(dateOfBirth: string, asOf?: Date): number {
  const today = asOf ?? new Date();
  const birth = new Date(dateOfBirth);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}
