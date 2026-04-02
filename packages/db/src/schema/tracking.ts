import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Weight Tracking ───────────────────────────────────────────────

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    logDate: date("log_date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_weight_user_date").on(table.userId, table.logDate),
  ]
);

// ── Body Measurements ─────────────────────────────────────────────

export const measurementLogs = pgTable(
  "measurement_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    logDate: date("log_date").notNull(),
    measurementType: text("measurement_type", {
      enum: [
        "waist",
        "hips",
        "chest",
        "bicep_left",
        "bicep_right",
        "thigh_left",
        "thigh_right",
        "neck",
      ],
    }).notNull(),
    valueCm: numeric("value_cm", { precision: 5, scale: 1 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_measurements_unique").on(
      table.userId,
      table.logDate,
      table.measurementType
    ),
  ]
);
