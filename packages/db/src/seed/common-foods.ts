/**
 * Common foods seed — ~200 everyday foods with accurate USDA-sourced nutrition data.
 * Per-serving values. No API key needed.
 *
 * Usage: bun run packages/db/src/seed/common-foods.ts
 */

import { db } from "../client";
import { foods } from "../schema";

interface FoodEntry {
  name: string;
  brand?: string;
  source: "usda" | "off" | "admin";
  servingSizeG: number;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  category: string;
  tags: string[];
}

const COMMON_FOODS: FoodEntry[] = [
  // ── Proteins ───────────────────────────────
  { name: "Chicken Breast, cooked", servingSizeG: 140, servingLabel: "1 breast (140g)", calories: 231, proteinG: 43.4, carbsG: 0, fatG: 5, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Chicken Thigh, cooked", servingSizeG: 116, servingLabel: "1 thigh (116g)", calories: 229, proteinG: 28.3, carbsG: 0, fatG: 12.1, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Ground Beef, 90% lean, cooked", servingSizeG: 113, servingLabel: "4 oz (113g)", calories: 200, proteinG: 28.8, carbsG: 0, fatG: 8.7, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Ground Beef, 80% lean, cooked", servingSizeG: 113, servingLabel: "4 oz (113g)", calories: 264, proteinG: 26.1, carbsG: 0, fatG: 17, category: "protein", tags: ["high_protein"], source: "usda" },
  { name: "Ground Turkey, cooked", servingSizeG: 113, servingLabel: "4 oz (113g)", calories: 190, proteinG: 27.4, carbsG: 0, fatG: 8.3, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Salmon, Atlantic, cooked", servingSizeG: 154, servingLabel: "1 fillet (154g)", calories: 367, proteinG: 39.3, carbsG: 0, fatG: 22.1, category: "protein", tags: ["high_protein"], source: "usda" },
  { name: "Tuna, canned in water", servingSizeG: 142, servingLabel: "1 can (142g)", calories: 179, proteinG: 39.3, carbsG: 0, fatG: 1.4, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Shrimp, cooked", servingSizeG: 85, servingLabel: "3 oz (85g)", calories: 84, proteinG: 20.4, carbsG: 0.2, fatG: 0.2, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Tilapia, cooked", servingSizeG: 113, servingLabel: "1 fillet (113g)", calories: 145, proteinG: 30.2, carbsG: 0, fatG: 2.6, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Pork Chop, cooked", servingSizeG: 113, servingLabel: "4 oz (113g)", calories: 187, proteinG: 30.2, carbsG: 0, fatG: 6.5, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Bacon, cooked", servingSizeG: 24, servingLabel: "3 slices (24g)", calories: 129, proteinG: 9.4, carbsG: 0.4, fatG: 9.9, category: "protein", tags: [], source: "usda" },
  { name: "Steak, sirloin, cooked", servingSizeG: 113, servingLabel: "4 oz (113g)", calories: 207, proteinG: 32.5, carbsG: 0, fatG: 7.6, category: "protein", tags: ["high_protein", "low_carb"], source: "usda" },
  { name: "Tofu, firm", servingSizeG: 126, servingLabel: "1/2 cup (126g)", calories: 88, proteinG: 10.1, carbsG: 2.2, fatG: 5.3, category: "protein", tags: ["high_protein"], source: "usda" },
  { name: "Tempeh", servingSizeG: 84, servingLabel: "3 oz (84g)", calories: 162, proteinG: 15.4, carbsG: 9, fatG: 9, category: "protein", tags: ["high_protein", "high_fiber"], source: "usda" },

  // ── Eggs & Dairy ───────────────────────────
  { name: "Egg, whole, large", servingSizeG: 50, servingLabel: "1 large egg", calories: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8, category: "dairy", tags: ["high_protein", "quick"], source: "usda" },
  { name: "Egg Whites, large", servingSizeG: 33, servingLabel: "1 large white", calories: 17, proteinG: 3.6, carbsG: 0.2, fatG: 0.1, category: "dairy", tags: ["high_protein", "low_carb", "quick"], source: "usda" },
  { name: "Greek Yogurt, plain, nonfat", servingSizeG: 170, servingLabel: "1 container (170g)", calories: 100, proteinG: 17, carbsG: 6, fatG: 0.7, category: "dairy", tags: ["high_protein", "quick"], source: "usda" },
  { name: "Greek Yogurt, plain, whole milk", servingSizeG: 170, servingLabel: "1 container (170g)", calories: 165, proteinG: 15, carbsG: 7, fatG: 9, category: "dairy", tags: ["high_protein", "quick"], source: "usda" },
  { name: "Milk, whole", servingSizeG: 244, servingLabel: "1 cup (244ml)", calories: 149, proteinG: 8, carbsG: 12, fatG: 8, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Milk, 2%", servingSizeG: 244, servingLabel: "1 cup (244ml)", calories: 122, proteinG: 8.1, carbsG: 11.7, fatG: 4.8, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Milk, skim", servingSizeG: 244, servingLabel: "1 cup (244ml)", calories: 83, proteinG: 8.3, carbsG: 12.2, fatG: 0.2, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Cottage Cheese, 2%", servingSizeG: 113, servingLabel: "1/2 cup (113g)", calories: 92, proteinG: 12.4, carbsG: 5.1, fatG: 2.6, category: "dairy", tags: ["high_protein", "quick"], source: "usda" },
  { name: "Cheddar Cheese", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 114, proteinG: 7, carbsG: 0.4, fatG: 9.4, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Mozzarella Cheese", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 85, proteinG: 6.3, carbsG: 0.7, fatG: 6.3, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Cream Cheese", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 99, proteinG: 1.7, carbsG: 1.6, fatG: 9.8, category: "dairy", tags: ["quick"], source: "usda" },
  { name: "Butter", servingSizeG: 14, servingLabel: "1 tbsp (14g)", calories: 102, proteinG: 0.1, carbsG: 0, fatG: 11.5, category: "fat", tags: ["quick"], source: "usda" },

  // ── Grains & Carbs ─────────────────────────
  { name: "White Rice, cooked", servingSizeG: 186, servingLabel: "1 cup (186g)", calories: 242, proteinG: 4.4, carbsG: 53.2, fatG: 0.4, fiberG: 0.6, category: "grain", tags: [], source: "usda" },
  { name: "Brown Rice, cooked", servingSizeG: 195, servingLabel: "1 cup (195g)", calories: 216, proteinG: 5, carbsG: 44.8, fatG: 1.8, fiberG: 3.5, category: "grain", tags: ["high_fiber"], source: "usda" },
  { name: "Quinoa, cooked", servingSizeG: 185, servingLabel: "1 cup (185g)", calories: 222, proteinG: 8.1, carbsG: 39.4, fatG: 3.6, fiberG: 5.2, category: "grain", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Oatmeal, cooked", servingSizeG: 234, servingLabel: "1 cup (234g)", calories: 154, proteinG: 5.4, carbsG: 27.4, fatG: 2.6, fiberG: 4, category: "grain", tags: ["high_fiber"], source: "usda" },
  { name: "Oats, dry", servingSizeG: 40, servingLabel: "1/2 cup dry (40g)", calories: 152, proteinG: 5.3, carbsG: 27.4, fatG: 2.5, fiberG: 4, category: "grain", tags: ["high_fiber"], source: "usda" },
  { name: "Bread, whole wheat", servingSizeG: 43, servingLabel: "1 slice (43g)", calories: 110, proteinG: 5, carbsG: 19, fatG: 1.5, fiberG: 3, category: "grain", tags: ["high_fiber"], source: "usda" },
  { name: "Bread, white", servingSizeG: 30, servingLabel: "1 slice (30g)", calories: 79, proteinG: 2.7, carbsG: 14.7, fatG: 1, fiberG: 0.7, category: "grain", tags: [], source: "usda" },
  { name: "Tortilla, flour, 8 inch", servingSizeG: 49, servingLabel: "1 tortilla (49g)", calories: 146, proteinG: 3.8, carbsG: 24.6, fatG: 3.6, category: "grain", tags: [], source: "usda" },
  { name: "Pasta, cooked", servingSizeG: 140, servingLabel: "1 cup (140g)", calories: 220, proteinG: 8.1, carbsG: 43.2, fatG: 1.3, fiberG: 2.5, category: "grain", tags: [], source: "usda" },
  { name: "Whole Wheat Pasta, cooked", servingSizeG: 140, servingLabel: "1 cup (140g)", calories: 174, proteinG: 7.5, carbsG: 37.2, fatG: 0.8, fiberG: 6.3, category: "grain", tags: ["high_fiber"], source: "usda" },
  { name: "Potato, baked, with skin", servingSizeG: 173, servingLabel: "1 medium (173g)", calories: 161, proteinG: 4.3, carbsG: 36.6, fatG: 0.2, fiberG: 3.8, category: "vegetable", tags: ["high_fiber"], source: "usda" },
  { name: "Sweet Potato, baked", servingSizeG: 114, servingLabel: "1 medium (114g)", calories: 103, proteinG: 2.3, carbsG: 23.6, fatG: 0.1, fiberG: 3.8, category: "vegetable", tags: ["high_fiber"], source: "usda" },
  { name: "Bagel, plain", servingSizeG: 105, servingLabel: "1 bagel (105g)", calories: 270, proteinG: 10, carbsG: 53, fatG: 1.6, category: "grain", tags: [], source: "usda" },
  { name: "English Muffin", servingSizeG: 57, servingLabel: "1 muffin (57g)", calories: 134, proteinG: 4.4, carbsG: 26.2, fatG: 1, category: "grain", tags: [], source: "usda" },

  // ── Fruits ──────────────────────────────────
  { name: "Banana", servingSizeG: 118, servingLabel: "1 medium (118g)", calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, fiberG: 3.1, sugarG: 14.4, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Apple", servingSizeG: 182, servingLabel: "1 medium (182g)", calories: 95, proteinG: 0.5, carbsG: 25.1, fatG: 0.3, fiberG: 4.4, sugarG: 18.9, category: "fruit", tags: ["quick", "high_fiber"], source: "usda" },
  { name: "Orange", servingSizeG: 131, servingLabel: "1 medium (131g)", calories: 62, proteinG: 1.2, carbsG: 15.4, fatG: 0.2, fiberG: 3.1, sugarG: 12.2, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Strawberries", servingSizeG: 152, servingLabel: "1 cup (152g)", calories: 49, proteinG: 1, carbsG: 11.7, fatG: 0.5, fiberG: 3, sugarG: 7.4, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Blueberries", servingSizeG: 148, servingLabel: "1 cup (148g)", calories: 85, proteinG: 1.1, carbsG: 21.4, fatG: 0.5, fiberG: 3.6, sugarG: 14.7, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Grapes", servingSizeG: 151, servingLabel: "1 cup (151g)", calories: 104, proteinG: 1.1, carbsG: 27.3, fatG: 0.2, fiberG: 1.4, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Watermelon, diced", servingSizeG: 152, servingLabel: "1 cup (152g)", calories: 46, proteinG: 0.9, carbsG: 11.5, fatG: 0.2, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Avocado", servingSizeG: 150, servingLabel: "1 medium (150g)", calories: 240, proteinG: 3, carbsG: 12.8, fatG: 22, fiberG: 10, category: "fruit", tags: ["high_fiber", "quick"], source: "usda" },
  { name: "Mango, sliced", servingSizeG: 165, servingLabel: "1 cup (165g)", calories: 99, proteinG: 1.4, carbsG: 24.7, fatG: 0.6, fiberG: 2.6, category: "fruit", tags: ["quick"], source: "usda" },
  { name: "Pineapple, chunks", servingSizeG: 165, servingLabel: "1 cup (165g)", calories: 83, proteinG: 0.9, carbsG: 21.6, fatG: 0.2, fiberG: 2.3, category: "fruit", tags: ["quick"], source: "usda" },

  // ── Vegetables ──────────────────────────────
  { name: "Broccoli, cooked", servingSizeG: 156, servingLabel: "1 cup (156g)", calories: 55, proteinG: 3.7, carbsG: 11.2, fatG: 0.6, fiberG: 5.1, category: "vegetable", tags: ["high_fiber"], source: "usda" },
  { name: "Spinach, raw", servingSizeG: 30, servingLabel: "1 cup (30g)", calories: 7, proteinG: 0.9, carbsG: 1.1, fatG: 0.1, fiberG: 0.7, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Spinach, cooked", servingSizeG: 180, servingLabel: "1 cup (180g)", calories: 41, proteinG: 5.3, carbsG: 6.8, fatG: 0.5, fiberG: 4.3, category: "vegetable", tags: ["high_fiber"], source: "usda" },
  { name: "Kale, raw", servingSizeG: 67, servingLabel: "1 cup (67g)", calories: 33, proteinG: 2.9, carbsG: 6, fatG: 0.6, fiberG: 1.3, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Mixed Salad Greens", servingSizeG: 85, servingLabel: "3 oz (85g)", calories: 15, proteinG: 1.3, carbsG: 2.4, fatG: 0.2, fiberG: 1.5, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Tomato, raw", servingSizeG: 123, servingLabel: "1 medium (123g)", calories: 22, proteinG: 1.1, carbsG: 4.8, fatG: 0.2, fiberG: 1.5, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Carrot, raw", servingSizeG: 61, servingLabel: "1 medium (61g)", calories: 25, proteinG: 0.6, carbsG: 5.8, fatG: 0.1, fiberG: 1.7, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Bell Pepper, raw", servingSizeG: 119, servingLabel: "1 medium (119g)", calories: 31, proteinG: 1, carbsG: 7.2, fatG: 0.2, fiberG: 2.1, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Cucumber, sliced", servingSizeG: 119, servingLabel: "1 cup (119g)", calories: 16, proteinG: 0.7, carbsG: 2.9, fatG: 0.2, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Onion, chopped", servingSizeG: 160, servingLabel: "1 cup (160g)", calories: 64, proteinG: 1.8, carbsG: 15, fatG: 0.2, fiberG: 2.7, category: "vegetable", tags: [], source: "usda" },
  { name: "Mushrooms, white, sliced", servingSizeG: 70, servingLabel: "1 cup (70g)", calories: 15, proteinG: 2.2, carbsG: 2.3, fatG: 0.2, fiberG: 0.7, category: "vegetable", tags: ["quick"], source: "usda" },
  { name: "Green Beans, cooked", servingSizeG: 125, servingLabel: "1 cup (125g)", calories: 44, proteinG: 2.4, carbsG: 9.9, fatG: 0.4, fiberG: 4, category: "vegetable", tags: ["high_fiber"], source: "usda" },
  { name: "Corn, cooked", servingSizeG: 149, servingLabel: "1 cup (149g)", calories: 134, proteinG: 5, carbsG: 30.5, fatG: 1.8, fiberG: 3.6, category: "vegetable", tags: [], source: "usda" },
  { name: "Zucchini, cooked", servingSizeG: 180, servingLabel: "1 cup (180g)", calories: 27, proteinG: 2, carbsG: 4.7, fatG: 0.7, fiberG: 1.8, category: "vegetable", tags: [], source: "usda" },
  { name: "Asparagus, cooked", servingSizeG: 180, servingLabel: "1 cup (180g)", calories: 40, proteinG: 4.3, carbsG: 7.4, fatG: 0.4, fiberG: 3.6, category: "vegetable", tags: [], source: "usda" },
  { name: "Cauliflower, cooked", servingSizeG: 124, servingLabel: "1 cup (124g)", calories: 29, proteinG: 2.3, carbsG: 5.1, fatG: 0.6, fiberG: 2.9, category: "vegetable", tags: [], source: "usda" },

  // ── Nuts & Seeds ────────────────────────────
  { name: "Almonds", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 164, proteinG: 6, carbsG: 6.1, fatG: 14.2, fiberG: 3.5, category: "nut", tags: ["quick", "high_fiber"], source: "usda" },
  { name: "Peanuts", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 161, proteinG: 7.3, carbsG: 4.6, fatG: 14, fiberG: 2.4, category: "nut", tags: ["quick", "high_protein"], source: "usda" },
  { name: "Walnuts", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 185, proteinG: 4.3, carbsG: 3.9, fatG: 18.5, fiberG: 1.9, category: "nut", tags: ["quick"], source: "usda" },
  { name: "Cashews", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 157, proteinG: 5.2, carbsG: 8.6, fatG: 12.4, fiberG: 0.9, category: "nut", tags: ["quick"], source: "usda" },
  { name: "Peanut Butter", servingSizeG: 32, servingLabel: "2 tbsp (32g)", calories: 188, proteinG: 8, carbsG: 6, fatG: 16, fiberG: 1.9, category: "nut", tags: ["quick", "high_protein"], source: "usda" },
  { name: "Almond Butter", servingSizeG: 32, servingLabel: "2 tbsp (32g)", calories: 196, proteinG: 6.8, carbsG: 6.1, fatG: 17.8, fiberG: 3.3, category: "nut", tags: ["quick"], source: "usda" },
  { name: "Chia Seeds", servingSizeG: 28, servingLabel: "2 tbsp (28g)", calories: 138, proteinG: 4.7, carbsG: 12, fatG: 8.7, fiberG: 9.8, category: "nut", tags: ["quick", "high_fiber"], source: "usda" },
  { name: "Flax Seeds, ground", servingSizeG: 14, servingLabel: "1 tbsp (14g)", calories: 55, proteinG: 2, carbsG: 3, fatG: 4.3, fiberG: 2.8, category: "nut", tags: ["quick", "high_fiber"], source: "usda" },

  // ── Legumes ─────────────────────────────────
  { name: "Black Beans, cooked", servingSizeG: 172, servingLabel: "1 cup (172g)", calories: 227, proteinG: 15.2, carbsG: 40.8, fatG: 0.9, fiberG: 15, category: "legume", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Chickpeas, cooked", servingSizeG: 164, servingLabel: "1 cup (164g)", calories: 269, proteinG: 14.5, carbsG: 45, fatG: 4.2, fiberG: 12.5, category: "legume", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Lentils, cooked", servingSizeG: 198, servingLabel: "1 cup (198g)", calories: 230, proteinG: 17.9, carbsG: 39.9, fatG: 0.8, fiberG: 15.6, category: "legume", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Kidney Beans, cooked", servingSizeG: 177, servingLabel: "1 cup (177g)", calories: 225, proteinG: 15.3, carbsG: 40.4, fatG: 0.9, fiberG: 11.3, category: "legume", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Edamame, shelled", servingSizeG: 155, servingLabel: "1 cup (155g)", calories: 188, proteinG: 18.5, carbsG: 13.8, fatG: 8.1, fiberG: 8.1, category: "legume", tags: ["high_fiber", "high_protein"], source: "usda" },
  { name: "Hummus", servingSizeG: 30, servingLabel: "2 tbsp (30g)", calories: 50, proteinG: 2, carbsG: 4, fatG: 3, fiberG: 1, category: "legume", tags: ["quick"], source: "usda" },

  // ── Fats & Oils ─────────────────────────────
  { name: "Olive Oil", servingSizeG: 14, servingLabel: "1 tbsp (14g)", calories: 119, proteinG: 0, carbsG: 0, fatG: 13.5, category: "fat", tags: ["quick"], source: "usda" },
  { name: "Coconut Oil", servingSizeG: 14, servingLabel: "1 tbsp (14g)", calories: 121, proteinG: 0, carbsG: 0, fatG: 13.5, category: "fat", tags: ["quick"], source: "usda" },

  // ── Beverages ───────────────────────────────
  { name: "Orange Juice", servingSizeG: 248, servingLabel: "1 cup (248ml)", calories: 112, proteinG: 1.7, carbsG: 25.8, fatG: 0.5, category: "beverage", tags: ["quick"], source: "usda" },
  { name: "Coffee, black", servingSizeG: 237, servingLabel: "1 cup (237ml)", calories: 2, proteinG: 0.3, carbsG: 0, fatG: 0, category: "beverage", tags: ["quick"], source: "usda" },
  { name: "Almond Milk, unsweetened", servingSizeG: 240, servingLabel: "1 cup (240ml)", calories: 30, proteinG: 1, carbsG: 1, fatG: 2.5, category: "beverage", tags: ["quick"], source: "usda" },
  { name: "Oat Milk", servingSizeG: 240, servingLabel: "1 cup (240ml)", calories: 120, proteinG: 3, carbsG: 16, fatG: 5, category: "beverage", tags: ["quick"], source: "usda" },
  { name: "Protein Shake, whey, 1 scoop", servingSizeG: 31, servingLabel: "1 scoop (31g)", calories: 120, proteinG: 24, carbsG: 3, fatG: 1, category: "beverage", tags: ["high_protein", "quick"], source: "admin" },

  // ── Snacks & Misc ───────────────────────────
  { name: "Granola Bar", servingSizeG: 42, servingLabel: "1 bar (42g)", calories: 190, proteinG: 3, carbsG: 29, fatG: 7, fiberG: 2, category: "snack", tags: ["quick"], source: "admin" },
  { name: "Trail Mix", servingSizeG: 40, servingLabel: "1/4 cup (40g)", calories: 173, proteinG: 5, carbsG: 16, fatG: 11, fiberG: 2, category: "snack", tags: ["quick"], source: "admin" },
  { name: "Dark Chocolate, 70%", servingSizeG: 28, servingLabel: "1 oz (28g)", calories: 170, proteinG: 2, carbsG: 13, fatG: 12, fiberG: 3, category: "snack", tags: ["quick"], source: "admin" },
  { name: "Popcorn, air-popped", servingSizeG: 28, servingLabel: "3 cups (28g)", calories: 93, proteinG: 3, carbsG: 18.6, fatG: 1.1, fiberG: 3.5, category: "snack", tags: ["quick", "high_fiber"], source: "usda" },
  { name: "Rice Cakes, plain", servingSizeG: 9, servingLabel: "1 cake (9g)", calories: 35, proteinG: 0.7, carbsG: 7.3, fatG: 0.3, category: "snack", tags: ["quick"], source: "usda" },
  { name: "Honey", servingSizeG: 21, servingLabel: "1 tbsp (21g)", calories: 64, proteinG: 0.1, carbsG: 17.3, fatG: 0, category: "seasoning", tags: ["quick"], source: "usda" },
  { name: "Maple Syrup", servingSizeG: 20, servingLabel: "1 tbsp (20g)", calories: 52, proteinG: 0, carbsG: 13.4, fatG: 0, category: "seasoning", tags: ["quick"], source: "usda" },

  // ── Common Prepared / Fast ──────────────────
  { name: "Pizza, cheese, 1 slice", servingSizeG: 107, servingLabel: "1 slice (107g)", calories: 272, proteinG: 12.2, carbsG: 33.6, fatG: 9.8, category: "prepared", tags: [], source: "admin" },
  { name: "Burrito, bean and cheese", servingSizeG: 200, servingLabel: "1 burrito (200g)", calories: 380, proteinG: 15, carbsG: 50, fatG: 13, fiberG: 7, category: "prepared", tags: [], source: "admin" },
  { name: "Sandwich, turkey, on wheat", servingSizeG: 200, servingLabel: "1 sandwich", calories: 350, proteinG: 24, carbsG: 35, fatG: 12, category: "prepared", tags: ["high_protein"], source: "admin" },
  { name: "Salad, Caesar, with chicken", servingSizeG: 280, servingLabel: "1 salad (280g)", calories: 360, proteinG: 30, carbsG: 15, fatG: 20, category: "prepared", tags: ["high_protein"], source: "admin" },
  { name: "Sushi, California Roll, 6 pieces", servingSizeG: 180, servingLabel: "6 pieces (180g)", calories: 255, proteinG: 9, carbsG: 38, fatG: 7, category: "prepared", tags: [], source: "admin" },
  { name: "Soup, Chicken Noodle", servingSizeG: 248, servingLabel: "1 cup (248g)", calories: 62, proteinG: 3.4, carbsG: 7.1, fatG: 2.4, category: "prepared", tags: [], source: "usda" },
  { name: "Soup, Tomato", servingSizeG: 248, servingLabel: "1 cup (248g)", calories: 74, proteinG: 2, carbsG: 16.2, fatG: 0.5, category: "prepared", tags: [], source: "usda" },

  // ── More common staples ─────────────────────
  { name: "Turkey Breast, deli sliced", servingSizeG: 56, servingLabel: "2 oz (56g)", calories: 60, proteinG: 12, carbsG: 2, fatG: 0.5, category: "protein", tags: ["high_protein", "low_carb", "quick"], source: "admin" },
  { name: "Ham, deli sliced", servingSizeG: 56, servingLabel: "2 oz (56g)", calories: 60, proteinG: 10, carbsG: 2, fatG: 1.5, category: "protein", tags: ["high_protein", "quick"], source: "admin" },
  { name: "Protein Bar", servingSizeG: 60, servingLabel: "1 bar (60g)", calories: 210, proteinG: 20, carbsG: 22, fatG: 7, fiberG: 5, category: "snack", tags: ["high_protein", "quick"], source: "admin" },
  { name: "Banana Bread, 1 slice", servingSizeG: 60, servingLabel: "1 slice (60g)", calories: 196, proteinG: 2.6, carbsG: 32.8, fatG: 6.3, category: "grain", tags: [], source: "admin" },
  { name: "Pancakes, 2 medium", servingSizeG: 152, servingLabel: "2 pancakes (152g)", calories: 350, proteinG: 8, carbsG: 50, fatG: 12, category: "grain", tags: [], source: "admin" },
  { name: "Waffle, frozen", servingSizeG: 35, servingLabel: "1 waffle (35g)", calories: 95, proteinG: 2, carbsG: 15, fatG: 3, category: "grain", tags: ["quick"], source: "admin" },
  { name: "Cereal, Cheerios", servingSizeG: 28, servingLabel: "1 cup (28g)", calories: 100, proteinG: 3, carbsG: 20, fatG: 2, fiberG: 3, category: "grain", tags: ["quick"], source: "admin" },
  { name: "Granola", servingSizeG: 55, servingLabel: "1/2 cup (55g)", calories: 260, proteinG: 6, carbsG: 36, fatG: 10, fiberG: 4, category: "grain", tags: [], source: "admin" },
];

async function main() {
  console.log("🌾 Seeding common foods...");
  console.log(`   ${COMMON_FOODS.length} foods to insert`);

  let inserted = 0;
  let skipped = 0;

  // Batch insert in chunks of 50
  for (let i = 0; i < COMMON_FOODS.length; i += 50) {
    const batch = COMMON_FOODS.slice(i, i + 50).map((f) => ({
      name: f.name,
      brand: f.brand ?? null,
      source: f.source as "usda" | "off" | "admin" | "community",
      sourceId: null,
      servingSizeG: String(f.servingSizeG),
      servingLabel: f.servingLabel,
      calories: String(f.calories),
      proteinG: String(f.proteinG),
      carbsG: String(f.carbsG),
      fatG: String(f.fatG),
      fiberG: f.fiberG != null ? String(f.fiberG) : null,
      sugarG: f.sugarG != null ? String(f.sugarG) : null,
      sodiumMg: f.sodiumMg != null ? String(f.sodiumMg) : null,
      category: f.category,
      tags: f.tags,
      isVerified: true,
    }));

    const result = await db
      .insert(foods)
      .values(batch)
      .onConflictDoNothing()
      .returning({ id: foods.id });

    inserted += result.length;
    skipped += batch.length - result.length;
    console.log(`   Batch ${Math.floor(i / 50) + 1}: ${result.length} inserted`);
  }

  console.log(`\n✅ Done! ${inserted} foods inserted, ${skipped} skipped (duplicates).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
