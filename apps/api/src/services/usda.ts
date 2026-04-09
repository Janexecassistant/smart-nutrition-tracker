/**
 * USDA FoodData Central API integration.
 *
 * 400k+ branded food products, whole foods, and SR Legacy items.
 * Requires free API key from https://fdc.nal.usda.gov/api-key-signup
 * Rate limit: 1,000 requests/hour per IP.
 * Docs: https://fdc.nal.usda.gov/api-guide/
 */

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = process.env.USDA_API_KEY || "";

// ── Nutrient IDs ────────────────────────────────────────────────────
// These are the standard USDA nutrient IDs used in foodNutrients arrays.
const NUTRIENT_IDS = {
  ENERGY: 1008,       // Energy (kcal)
  PROTEIN: 1003,      // Protein (g)
  CARBS: 1005,        // Carbohydrate, by difference (g)
  FAT: 1004,          // Total lipid / fat (g)
  FIBER: 1079,        // Fiber, total dietary (g)
  SUGARS: 2000,       // Total Sugars (g)
  SODIUM: 1093,       // Sodium, Na (mg)
} as const;

// ── Types ───────────────────────────────────────────────────────────

interface FDCNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  value: number;
  unitName: string;
}

interface FDCFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: FDCNutrient[];
}

interface FDCSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: FDCFood[];
}

export interface NormalizedFood {
  name: string;
  brand: string | null;
  barcode: string | null;
  servingSizeG: number;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  imageUrl: string | null;
  source: "usda";
}

// ── Helpers ─────────────────────────────────────────────────────────

function getNutrient(nutrients: FDCNutrient[], id: number): number | null {
  const n = nutrients.find((n) => n.nutrientId === id);
  return n ? n.value : null;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeFood(f: FDCFood): NormalizedFood | null {
  if (!f.description) return null;

  const calories = getNutrient(f.foodNutrients, NUTRIENT_IDS.ENERGY) ?? 0;
  const proteinG = getNutrient(f.foodNutrients, NUTRIENT_IDS.PROTEIN) ?? 0;
  const carbsG = getNutrient(f.foodNutrients, NUTRIENT_IDS.CARBS) ?? 0;
  const fatG = getNutrient(f.foodNutrients, NUTRIENT_IDS.FAT) ?? 0;
  const fiberG = getNutrient(f.foodNutrients, NUTRIENT_IDS.FIBER);
  const sugarG = getNutrient(f.foodNutrients, NUTRIENT_IDS.SUGARS);
  const sodiumMg = getNutrient(f.foodNutrients, NUTRIENT_IDS.SODIUM);

  // Skip items with zero nutrition data
  if (calories === 0 && proteinG === 0 && carbsG === 0 && fatG === 0) return null;

  // Serving size: USDA branded foods include servingSize in grams
  const servingSizeG = f.servingSize || 100;
  const servingLabel =
    f.householdServingFullText ||
    (f.servingSize
      ? `${f.servingSize}${f.servingSizeUnit || "g"}`
      : "100g");

  // Clean up the name: USDA stores descriptions in ALL CAPS for branded
  const name =
    f.dataType === "Branded"
      ? titleCase(f.description)
      : f.description;

  // Brand: prefer brandName, fall back to brandOwner
  const brand = f.brandName || f.brandOwner || null;

  return {
    name,
    brand: brand ? titleCase(brand) : null,
    barcode: f.gtinUpc || null,
    servingSizeG,
    servingLabel,
    calories: Math.round(calories),
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    fiberG: fiberG != null ? Math.round(fiberG * 10) / 10 : null,
    sugarG: sugarG != null ? Math.round(sugarG * 10) / 10 : null,
    sodiumMg: sodiumMg != null ? Math.round(sodiumMg) : null,
    imageUrl: null, // USDA doesn't provide images
    source: "usda",
  };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Search USDA FoodData Central by text query.
 * Searches Branded foods first (name-brand products), plus Foundation
 * and SR Legacy (whole/generic foods like "chicken breast").
 */
export async function searchUSDA(
  query: string,
  limit = 20
): Promise<NormalizedFood[]> {
  if (!API_KEY) {
    console.warn("[USDA] No API key configured, skipping USDA search");
    return [];
  }

  const url = `${FDC_BASE}/foods/search?api_key=${API_KEY}`;

  const body = {
    query,
    dataType: ["Branded", "SR Legacy", "Foundation"],
    pageSize: Math.min(limit, 50),
    pageNumber: 1,
    sortBy: "dataType.keyword",
    sortOrder: "asc",
  };

  console.log(`[USDA] Searching for "${query}", limit=${limit}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SmartNutritionTracker/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[USDA] HTTP ${res.status}: ${res.statusText}`);
      return [];
    }

    const data: FDCSearchResponse = await res.json();
    console.log(`[USDA] Got ${data.totalHits} total hits, ${data.foods.length} returned`);

    return data.foods
      .map(normalizeFood)
      .filter((f): f is NormalizedFood => f !== null);
  } catch (err) {
    console.error("[USDA] Search failed:", err);
    return [];
  }
}

/**
 * Look up a product by barcode (GTIN/UPC) in USDA FoodData Central.
 */
export async function lookupUSDABarcode(
  barcode: string
): Promise<NormalizedFood | null> {
  if (!API_KEY) {
    console.warn("[USDA] No API key configured, skipping barcode lookup");
    return null;
  }

  const url = `${FDC_BASE}/foods/search?api_key=${API_KEY}`;

  const body = {
    query: barcode,
    dataType: ["Branded"],
    pageSize: 1,
    pageNumber: 1,
  };

  console.log(`[USDA] Barcode lookup: ${barcode}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SmartNutritionTracker/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data: FDCSearchResponse = await res.json();

    // Find an exact barcode match
    const match = data.foods.find(
      (f) => f.gtinUpc === barcode || f.gtinUpc === barcode.padStart(12, "0")
    );

    if (!match) return null;

    return normalizeFood(match);
  } catch (err) {
    console.error("[USDA] Barcode lookup failed:", err);
    return null;
  }
}
