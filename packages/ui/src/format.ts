/**
 * Shared formatting utilities for nutrition values.
 * Used by both web and mobile to ensure consistent display.
 */

/**
 * Format a calorie number for display (no decimals).
 * e.g., 2150.4 → "2,150"
 */
export function formatCalories(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Format a macro value in grams (1 decimal).
 * e.g., 43.456 → "43.5g"
 */
export function formatGrams(value: number): string {
  return `${(Math.round(value * 10) / 10).toFixed(1)}g`;
}

/**
 * Format a macro value without unit (1 decimal).
 * e.g., 43.456 → "43.5"
 */
export function formatMacro(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

/**
 * Format a percentage (0 decimals).
 * e.g., 78.6 → "79%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format a weight value based on unit system.
 * Metric: "85.2 kg"
 * Imperial: "187.8 lbs"
 */
export function formatWeight(
  kg: number,
  system: "metric" | "imperial" = "metric"
): string {
  if (system === "imperial") {
    const lbs = kg * 2.20462;
    return `${(Math.round(lbs * 10) / 10).toFixed(1)} lbs`;
  }
  return `${(Math.round(kg * 10) / 10).toFixed(1)} kg`;
}

/**
 * Format a height value based on unit system.
 * Metric: "175.5 cm"
 * Imperial: "5'9""
 */
export function formatHeight(
  cm: number,
  system: "metric" | "imperial" = "metric"
): string {
  if (system === "imperial") {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm * 10) / 10} cm`;
}

/**
 * Format a serving label with quantity.
 * e.g., (140, "1 breast (140g)") → "1 breast (140g)"
 * e.g., (280, "1 breast (140g)") → "280g"
 */
export function formatServing(
  quantityG: number,
  baseServingG: number,
  servingLabel: string | null
): string {
  if (!servingLabel) return `${Math.round(quantityG)}g`;

  // If quantity matches the base serving, use the label
  const ratio = quantityG / baseServingG;
  if (Math.abs(ratio - 1) < 0.01) return servingLabel;
  if (Math.abs(ratio - Math.round(ratio)) < 0.01 && ratio >= 0.5) {
    return `${ratio}× ${servingLabel}`;
  }

  return `${Math.round(quantityG)}g`;
}
