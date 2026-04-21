/**
 * USDA FoodData Central import configuration.
 *
 * Data source: https://fdc.nal.usda.gov/
 * API docs:    https://fdc.nal.usda.gov/api-guide.html
 *
 * We pull three datasets:
 *   - Foundation       (~200)    High-quality lab-analyzed whole foods
 *   - SR Legacy        (~7,800)  USDA Standard Reference — comprehensive generics
 *   - Branded          (limited) Name-brand items (Chobani, Kind, Kirkland, etc.)
 *
 * Branded is capped via BRANDED_MAX_FOODS below to keep the DB lean.
 */

// Nutrient IDs we care about from the USDA API
export const NUTRIENT_MAP: Record<number, { code: string; unit: string }> = {
  1008: { code: "calories", unit: "kcal" },
  1003: { code: "protein", unit: "g" },
  1005: { code: "carbs", unit: "g" },
  1004: { code: "fat", unit: "g" },
  1079: { code: "fiber", unit: "g" },
  2000: { code: "sugar", unit: "g" },
  1093: { code: "sodium", unit: "mg" },
  // Phase 2 micronutrients — imported now, displayed later
  1087: { code: "calcium", unit: "mg" },
  1089: { code: "iron", unit: "mg" },
  1090: { code: "magnesium", unit: "mg" },
  1092: { code: "phosphorus", unit: "mg" },
  1091: { code: "potassium", unit: "mg" },
  1095: { code: "zinc", unit: "mg" },
  1162: { code: "vitamin_c", unit: "mg" },
  1165: { code: "vitamin_b1", unit: "mg" },
  1166: { code: "vitamin_b2", unit: "mg" },
  1167: { code: "vitamin_b3", unit: "mg" },
  1175: { code: "vitamin_b6", unit: "mg" },
  1177: { code: "folate", unit: "mcg" },
  1178: { code: "vitamin_b12", unit: "mcg" },
  1106: { code: "vitamin_a", unit: "mcg" },
  1114: { code: "vitamin_d", unit: "mcg" },
  1109: { code: "vitamin_e", unit: "mg" },
  1185: { code: "vitamin_k", unit: "mcg" },
};

// Core macros needed for the foods table (not stored in food_nutrients)
export const CORE_NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
};

// USDA data types we import. Order matters — Foundation/SR first gives
// generic whole foods a natural rank boost before branded items.
export const USDA_DATA_TYPES = [
  "Foundation",    // High-quality lab-analyzed foods
  "SR Legacy",     // USDA Standard Reference (legacy but comprehensive)
  "Branded",       // Name-brand products
] as const;

// Cap on Branded imports. USDA has ~400k branded items; 50k gives us
// strong coverage of US retail products without bloating search.
export const BRANDED_MAX_FOODS = Number(process.env.BRANDED_MAX_FOODS) || 50_000;

// Food categories mapped to our simplified category system
export const CATEGORY_MAP: Record<string, string> = {
  "Dairy and Egg Products": "dairy",
  "Spices and Herbs": "seasoning",
  "Baby Foods": "other",
  "Fats and Oils": "fat",
  "Poultry Products": "protein",
  "Soups, Sauces, and Gravies": "prepared",
  "Sausages and Luncheon Meats": "protein",
  "Breakfast Cereals": "grain",
  "Fruits and Fruit Juices": "fruit",
  "Pork Products": "protein",
  "Vegetables and Vegetable Products": "vegetable",
  "Nut and Seed Products": "nut",
  "Beef Products": "protein",
  "Beverages": "beverage",
  "Finfish and Shellfish Products": "protein",
  "Legumes and Legume Products": "legume",
  "Lamb, Veal, and Game Products": "protein",
  "Baked Products": "grain",
  "Snacks": "snack",
  "Sweets": "snack",
  "Cereal Grains and Pasta": "grain",
  "Fast Foods": "prepared",
  "Meals, Entrees, and Side Dishes": "prepared",
  "Restaurant Foods": "prepared",
};

// Rate limiting for USDA API
export const API_RATE_LIMIT_MS = 200; // 5 requests/sec max
export const API_PAGE_SIZE = 200;
export const API_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// DB insert batch size. Keep under 1000 to stay within Postgres param limits
// given ~20 columns per row (~20 * 500 = 10k params, well under the 65k limit).
export const DB_BATCH_SIZE = 500;
