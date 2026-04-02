import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Global Food Database ──────────────────────────────────────────

export const foods = pgTable(
  "foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    brand: text("brand"),
    barcode: text("barcode"),
    source: text("source", {
      enum: ["usda", "off", "admin", "community"],
    }).notNull(),
    sourceId: text("source_id"),
    servingSizeG: numeric("serving_size_g", {
      precision: 7,
      scale: 1,
    }).notNull(),
    servingLabel: text("serving_label"),
    calories: numeric("calories", { precision: 7, scale: 1 }).notNull(),
    proteinG: numeric("protein_g", { precision: 7, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 7, scale: 2 }).notNull(),
    fatG: numeric("fat_g", { precision: 7, scale: 2 }).notNull(),
    fiberG: numeric("fiber_g", { precision: 7, scale: 2 }),
    sugarG: numeric("sugar_g", { precision: 7, scale: 2 }),
    sodiumMg: numeric("sodium_mg", { precision: 7, scale: 1 }),
    category: text("category"),
    tags: text("tags").array().default([]),
    isVerified: boolean("is_verified").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_foods_barcode").on(table.barcode),
    index("idx_foods_category").on(table.category),
    index("idx_foods_source").on(table.source),
  ]
);

// ── Extended Nutrients (ready for Phase 2 micronutrients) ─────────

export const foodNutrients = pgTable(
  "food_nutrients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    nutrientCode: text("nutrient_code").notNull(),
    amount: numeric("amount", { precision: 10, scale: 3 }).notNull(),
    unit: text("unit").notNull(),
  },
  (table) => [
    uniqueIndex("idx_food_nutrients_unique").on(
      table.foodId,
      table.nutrientCode
    ),
  ]
);

// ── Custom Foods (user-created) ───────────────────────────────────

export const customFoods = pgTable(
  "custom_foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    barcode: text("barcode"),
    servingSizeG: numeric("serving_size_g", {
      precision: 7,
      scale: 1,
    }).notNull(),
    servingLabel: text("serving_label"),
    calories: numeric("calories", { precision: 7, scale: 1 }).notNull(),
    proteinG: numeric("protein_g", { precision: 7, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 7, scale: 2 }).notNull(),
    fatG: numeric("fat_g", { precision: 7, scale: 2 }).notNull(),
    fiberG: numeric("fiber_g", { precision: 7, scale: 2 }),
    sugarG: numeric("sugar_g", { precision: 7, scale: 2 }),
    sodiumMg: numeric("sodium_mg", { precision: 7, scale: 1 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_custom_foods_user").on(table.userId)]
);
