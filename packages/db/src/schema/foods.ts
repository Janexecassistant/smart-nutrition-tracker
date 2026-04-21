import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
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
    calories: numeric("calories", { precision: 10, scale: 2 }).notNull(),
    proteinG: numeric("protein_g", { precision: 10, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 10, scale: 2 }).notNull(),
    fatG: numeric("fat_g", { precision: 10, scale: 2 }).notNull(),
    fiberG: numeric("fiber_g", { precision: 10, scale: 2 }),
    sugarG: numeric("sugar_g", { precision: 10, scale: 2 }),
    sodiumMg: numeric("sodium_mg", { precision: 10, scale: 2 }),
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
    // Idempotent upserts rely on (source, source_id). Enforced via a partial
    // unique index created in migration `foods_unique_source_id_idx` (WHERE
    // source_id IS NOT NULL). We declare it here as a regular index so
    // drizzle-kit won't try to recreate it.
    uniqueIndex("idx_foods_source_source_id_unique").on(
      table.source,
      table.sourceId
    ),
  ]
);

// ── Food Portions (alt units: "1 cup sliced", "1 medium", etc.) ───
//
// Sourced from USDA's foodPortions array for Foundation/SR Legacy
// whole foods, and from branded serving labels. Each row is one
// concrete portion with a known gram weight so conversions are
// always accurate (no density guessing).
//
// Logging flow: user picks a portion → app multiplies by amount →
// converts to grams → uses grams / food.servingSizeG to scale
// the per-serving nutrition snapshot.

export const foodPortions = pgTable(
  "food_portions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    // Portion amount, e.g. 1.0, 0.5, 2.0
    amount: numeric("amount", { precision: 8, scale: 3 }).notNull(),
    // Portion unit, e.g. "cup", "medium", "slice", "tbsp", "piece"
    unit: text("unit").notNull(),
    // Optional modifier, e.g. "cubed", "cooked", "raw", "chopped"
    modifier: text("modifier"),
    // Display string, e.g. "1 cup cubed", "1 medium (182g)"
    description: text("description").notNull(),
    // The actual gram weight of (amount × unit + modifier)
    gramWeight: numeric("gram_weight", {
      precision: 10,
      scale: 2,
    }).notNull(),
    // Sort order from USDA (lower = more common first)
    sequenceNumber: integer("sequence_number").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_food_portions_food").on(table.foodId),
    // Prevent duplicate portions per food (keyed by display string)
    uniqueIndex("idx_food_portions_unique").on(
      table.foodId,
      table.description
    ),
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
    calories: numeric("calories", { precision: 10, scale: 2 }).notNull(),
    proteinG: numeric("protein_g", { precision: 10, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 10, scale: 2 }).notNull(),
    fatG: numeric("fat_g", { precision: 10, scale: 2 }).notNull(),
    fiberG: numeric("fiber_g", { precision: 10, scale: 2 }),
    sugarG: numeric("sugar_g", { precision: 10, scale: 2 }),
    sodiumMg: numeric("sodium_mg", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_custom_foods_user").on(table.userId)]
);
