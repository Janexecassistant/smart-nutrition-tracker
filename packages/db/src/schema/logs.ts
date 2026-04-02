import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Daily Food Log ────────────────────────────────────────────────

export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    logDate: date("log_date").notNull(),
    totalCalories: numeric("total_calories", {
      precision: 8,
      scale: 1,
    }).default("0"),
    totalProteinG: numeric("total_protein_g", {
      precision: 7,
      scale: 2,
    }).default("0"),
    totalCarbsG: numeric("total_carbs_g", {
      precision: 7,
      scale: 2,
    }).default("0"),
    totalFatG: numeric("total_fat_g", { precision: 7, scale: 2 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_food_logs_user_date").on(table.userId, table.logDate),
  ]
);

// ── Individual Food Log Items ─────────────────────────────────────

export const foodLogItems = pgTable(
  "food_log_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    logId: uuid("log_id")
      .notNull()
      .references(() => foodLogs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    mealSlot: text("meal_slot", {
      enum: ["breakfast", "lunch", "dinner", "snack"],
    }).notNull(),
    foodId: uuid("food_id"),
    foodType: text("food_type", {
      enum: ["global", "custom", "recipe", "quick_add"],
    }).notNull(),
    foodName: text("food_name").notNull(),
    quantityG: numeric("quantity_g", { precision: 7, scale: 1 }).notNull(),
    servingLabel: text("serving_label"),
    // Snapshot of nutrition at time of logging
    calories: numeric("calories", { precision: 7, scale: 1 }).notNull(),
    proteinG: numeric("protein_g", { precision: 7, scale: 2 }).notNull(),
    carbsG: numeric("carbs_g", { precision: 7, scale: 2 }).notNull(),
    fatG: numeric("fat_g", { precision: 7, scale: 2 }).notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [
    index("idx_food_log_items_user_date").on(table.userId, table.loggedAt),
    index("idx_food_log_items_log").on(table.logId),
  ]
);

// ── Favorite Foods ────────────────────────────────────────────────

export const favoriteFoods = pgTable(
  "favorite_foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    foodId: uuid("food_id"),
    foodType: text("food_type", {
      enum: ["global", "custom", "recipe"],
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_favorites_unique").on(
      table.userId,
      table.foodId,
      table.foodType
    ),
  ]
);
