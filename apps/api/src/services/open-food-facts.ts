/**
 * Open Food Facts API integration.
 *
 * Free, open-source database with 3M+ products worldwide.
 * No API key needed. Includes barcode data.
 * Docs: https://wiki.openfoodfacts.org/API
 */

const OFF_BASE = "https://world.openfoodfacts.org";

export interface OFFProduct {
  code: string;
  product_name: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments: {
    "energy-kcal_serving"?: number;
    "energy-kcal_100g"?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
    fiber_serving?: number;
    fiber_100g?: number;
    sugars_serving?: number;
    sugars_100g?: number;
    sodium_serving?: number;
    sodium_100g?: number;
  };
  categories_tags?: string[];
  image_front_small_url?: string;
}

interface NormalizedFood {
  name: string;
  brand: string | null;
  barcode: string;
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
  source: "off";
}

function normalizeProduct(p: OFFProduct): NormalizedFood | null {
  if (!p.product_name) return null;

  const n = p.nutriments;

  // Prefer per-serving values, fall back to per-100g
  const hasServing = n["energy-kcal_serving"] != null;
  const servingSizeG = p.serving_quantity || (hasServing ? 100 : 100);

  const calories = hasServing ? (n["energy-kcal_serving"] ?? 0) : (n["energy-kcal_100g"] ?? 0);
  const proteinG = hasServing ? (n.proteins_serving ?? 0) : (n.proteins_100g ?? 0);
  const carbsG = hasServing ? (n.carbohydrates_serving ?? 0) : (n.carbohydrates_100g ?? 0);
  const fatG = hasServing ? (n.fat_serving ?? 0) : (n.fat_100g ?? 0);
  const fiberG = hasServing ? (n.fiber_serving ?? null) : (n.fiber_100g ?? null);
  const sugarG = hasServing ? (n.sugars_serving ?? null) : (n.sugars_100g ?? null);
  const sodiumMg = hasServing
    ? (n.sodium_serving != null ? n.sodium_serving * 1000 : null)
    : (n.sodium_100g != null ? n.sodium_100g * 1000 : null);

  // Skip products with no nutrition data at all
  if (calories === 0 && proteinG === 0 && carbsG === 0 && fatG === 0) return null;

  const servingLabel = p.serving_size || `${servingSizeG}g`;

  return {
    name: p.product_name,
    brand: p.brands?.split(",")[0]?.trim() || null,
    barcode: p.code,
    servingSizeG,
    servingLabel,
    calories: Math.round(calories),
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    fiberG: fiberG != null ? Math.round(fiberG * 10) / 10 : null,
    sugarG: sugarG != null ? Math.round(sugarG * 10) / 10 : null,
    sodiumMg: sodiumMg != null ? Math.round(sodiumMg) : null,
    imageUrl: p.image_front_small_url || null,
    source: "off",
  };
}

/**
 * Search Open Food Facts by text query.
 */
export async function searchOFF(query: string, limit = 20): Promise<NormalizedFood[]> {
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,serving_size,serving_quantity,nutriments,categories_tags,image_front_small_url`;

  const res = await fetch(url, {
    headers: { "User-Agent": "SmartNutritionTracker/1.0 (contact@snt.app)" },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const products: OFFProduct[] = data.products || [];

  return products
    .map(normalizeProduct)
    .filter((f): f is NormalizedFood => f !== null);
}

/**
 * Look up a product by barcode.
 */
export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const url = `${OFF_BASE}/api/v2/product/${barcode}?fields=code,product_name,brands,serving_size,serving_quantity,nutriments,categories_tags,image_front_small_url`;

  const res = await fetch(url, {
    headers: { "User-Agent": "SmartNutritionTracker/1.0 (contact@snt.app)" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  return normalizeProduct(data.product);
}
