/**
 * Unit conversion utilities for food logging.
 *
 * Design principle: all unit conversions go through GRAMS. The user picks
 * an "amount" and a "unit option" at log time, we convert to grams, then
 * scale the food's per-serving nutrition by `grams / servingSizeG`.
 *
 * There are two types of units:
 *
 *   1. Universal units — always work for any food:
 *        - "serving": the food's default serving (uses food.servingSizeG)
 *        - "g":       grams (1:1)
 *        - "oz":      ounces (1 oz = 28.3495 g)
 *        - "ml":      milliliters (only valid when the food's serving is
 *                     listed in ml/volume; otherwise excluded)
 *
 *   2. Food-specific portions — from USDA's foodPortions array:
 *        - "1 medium apple (182 g)"
 *        - "1 cup sliced (109 g)"
 *        - "1 tbsp"
 *      These come with an exact gram weight per food, so no density
 *      guessing is needed. We NEVER show cup/tbsp/tsp generically —
 *      only when backed by a food-specific portion row.
 */

// ── Types ─────────────────────────────────────────────────────────

export type UniversalUnitKey = "serving" | "g" | "oz";

export interface FoodPortion {
  id: string;
  amount: number | string;
  unit: string;
  modifier?: string | null;
  description: string;
  gramWeight: number | string;
  sequenceNumber?: number | null;
}

/**
 * A single selectable "unit option" in the logging UI. The user picks
 * one of these, then enters an amount multiplier.
 *
 * Examples:
 *   { kind: "universal", key: "serving", label: "1 serving (227 g)", gramsPerUnit: 227 }
 *   { kind: "universal", key: "g",       label: "gram (g)",          gramsPerUnit: 1 }
 *   { kind: "universal", key: "oz",      label: "ounce (oz)",        gramsPerUnit: 28.3495 }
 *   { kind: "portion",   portionId: "…", label: "1 cup sliced (109 g)", gramsPerUnit: 109 }
 */
export type UnitOption =
  | {
      kind: "universal";
      key: UniversalUnitKey;
      label: string;
      gramsPerUnit: number;
    }
  | {
      kind: "portion";
      portionId: string;
      label: string;
      gramsPerUnit: number;
      sequenceNumber: number;
    };

// ── Constants ─────────────────────────────────────────────────────

export const GRAMS_PER_OZ = 28.3495;

// ── Helpers ───────────────────────────────────────────────────────

function num(v: number | string | null | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Build the list of unit options shown in the AddFood modal.
 *
 * Order:
 *   1. "1 serving" — always first, uses food.servingLabel as label
 *   2. All food-specific portions, sorted by sequenceNumber
 *   3. Generic "g" (grams)
 *   4. Generic "oz" (ounces)
 *
 * Duplicates are deduped by label (case-insensitive).
 */
export function buildUnitOptions(food: {
  servingSizeG: number | string;
  servingLabel?: string | null;
  portions?: FoodPortion[];
}): UnitOption[] {
  const options: UnitOption[] = [];
  const seen = new Set<string>();

  const push = (opt: UnitOption) => {
    const key = opt.label.toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    options.push(opt);
  };

  const servingSizeG = num(food.servingSizeG, 100);

  // 1. Default "1 serving" — uses the food's label if present.
  const servingLabel =
    food.servingLabel && food.servingLabel.trim()
      ? `1 serving (${food.servingLabel})`
      : `1 serving (${round(servingSizeG, 1)} g)`;

  push({
    kind: "universal",
    key: "serving",
    label: servingLabel,
    gramsPerUnit: servingSizeG,
  });

  // 2. Food-specific portions, sorted by USDA's recommended order.
  const portions = (food.portions ?? [])
    .slice()
    .sort(
      (a, b) =>
        (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0)
    );

  for (const p of portions) {
    const gw = num(p.gramWeight, 0);
    if (gw <= 0) continue;
    const label = `${p.description} (${round(gw, 1)} g)`;
    push({
      kind: "portion",
      portionId: p.id,
      label,
      gramsPerUnit: gw,
      sequenceNumber: Number(p.sequenceNumber) || 0,
    });
  }

  // 3. Generic grams.
  push({
    kind: "universal",
    key: "g",
    label: "gram (g)",
    gramsPerUnit: 1,
  });

  // 4. Generic ounces.
  push({
    kind: "universal",
    key: "oz",
    label: "ounce (oz)",
    gramsPerUnit: GRAMS_PER_OZ,
  });

  return options;
}

/**
 * Convert the user's (amount, unit) input to grams.
 */
export function toGrams(amount: number, option: UnitOption): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return round(amount * option.gramsPerUnit, 2);
}

/**
 * Scale a per-serving nutrition snapshot to the chosen portion.
 *
 * `food` provides the baseline (servingSizeG + perServing nutrition).
 * Returns the nutrition for `grams` grams of the food.
 */
export function scaleNutrition(
  food: {
    servingSizeG: number | string;
    calories: number | string;
    proteinG: number | string;
    carbsG: number | string;
    fatG: number | string;
    fiberG?: number | string | null;
    sugarG?: number | string | null;
    sodiumMg?: number | string | null;
  },
  grams: number
): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
} {
  const servingSizeG = num(food.servingSizeG, 100);
  const ratio = servingSizeG > 0 ? grams / servingSizeG : 0;

  const fiber = food.fiberG != null ? num(food.fiberG) : null;
  const sugar = food.sugarG != null ? num(food.sugarG) : null;
  const sodium = food.sodiumMg != null ? num(food.sodiumMg) : null;

  return {
    calories: Math.round(num(food.calories) * ratio),
    proteinG: round(num(food.proteinG) * ratio, 1),
    carbsG: round(num(food.carbsG) * ratio, 1),
    fatG: round(num(food.fatG) * ratio, 1),
    fiberG: fiber != null ? round(fiber * ratio, 1) : null,
    sugarG: sugar != null ? round(sugar * ratio, 1) : null,
    sodiumMg: sodium != null ? round(sodium * ratio, 1) : null,
  };
}

/**
 * Build a human-readable serving label for the log entry based on the
 * user's selected (amount, unit). This is what shows up in the diary.
 *
 * Examples:
 *   (1.5, "1 serving (170 g)")   → "1.5 servings"
 *   (1,   "1 cup sliced (109 g)") → "1 cup sliced"
 *   (85,  "gram (g)")             → "85 g"
 *   (2,   "ounce (oz)")           → "2 oz"
 */
export function formatServingLabel(
  amount: number,
  option: UnitOption
): string {
  const a = Number.isFinite(amount) ? amount : 1;
  const pretty = Number.isInteger(a) ? String(a) : round(a, 2).toString();

  if (option.kind === "universal") {
    if (option.key === "g") return `${pretty} g`;
    if (option.key === "oz") return `${pretty} oz`;
    // "serving"
    return a === 1 ? "1 serving" : `${pretty} servings`;
  }

  // Portion: strip the trailing "(### g)" we appended in buildUnitOptions
  const base = option.label.replace(/\s*\([^)]*\bg\)\s*$/i, "").trim();
  if (a === 1) return base;
  // Lead with the amount: "2 × 1 cup sliced"
  return `${pretty} × ${base}`;
}
