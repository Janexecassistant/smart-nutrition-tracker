import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// ── Custom Recipes ────────────────────────────────────────────────

export const customRecipes = pgTable(
  "custom_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    servings: integer("servings").notNull().default(1),
    notes: text("notes"),
    // Denormalized totals (recomputed on ingredient change)
    totalCalories: numeric("total_calories", { precision: 8, scale: 1 }),
    totalProteinG: numeric("total_protein_g", { precision: 7, scale: 2 }),
    totalCarbsG: numeric("total_carbs_g", { precision: 7, scale: 2 }),
    totalFatG: numeric("total_fat_g", { precision: 7, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_recipes_user").on(table.userId)]
);

// ── Recipe Ingredients ────────────────────────────────────────────

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => customRecipes.id, { onDelete: "cascade" }),
    foodId: uuid("food_id"),
    foodType: text("food_type", { enum: ["global", "custom"] }).notNull(),
    quantityG: numeric("quantity_g", { precision: 7, scale: 1 }).notNull(),
    label: text("label"),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("idx_ingredients_recipe").on(table.recipeId)]
);

// ── Saved Meals ───────────────────────────────────────────────────

export const savedMeals = pgTable(
  "saved_meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_saved_meals_user").on(table.userId)]
);

export const savedMealItems = pgTable(
  "saved_meal_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => savedMeals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id"),
    foodType: text("food_type", {
      enum: ["global", "custom", "recipe"],
    }).notNull(),
    quantityG: numeric("quantity_g", { precision: 7, scale: 1 }).notNull(),
    servingLabel: text("serving_label"),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("idx_meal_items_meal").on(table.mealId)]
);
