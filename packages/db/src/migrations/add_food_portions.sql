-- Migration: add_food_portions
--
-- Adds the food_portions table. Each row is one concrete serving option
-- for a food (e.g., "1 medium apple (182g)", "1 cup sliced (109g)") with
-- a known gram weight, so unit conversions are always accurate.
--
-- Backfill: the USDA importer (packages/db/src/seed/usda/import.ts) now
-- captures foodPortions from the USDA response and inserts them here.
-- Re-running the importer against an existing foods table will populate
-- this table without duplicating foods.

CREATE TABLE IF NOT EXISTS "food_portions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "food_id" uuid NOT NULL REFERENCES "foods"("id") ON DELETE CASCADE,
  "amount" numeric(8, 3) NOT NULL,
  "unit" text NOT NULL,
  "modifier" text,
  "description" text NOT NULL,
  "gram_weight" numeric(10, 2) NOT NULL,
  "sequence_number" integer DEFAULT 0,
  "created_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_food_portions_food"
  ON "food_portions" ("food_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_food_portions_unique"
  ON "food_portions" ("food_id", "description");
