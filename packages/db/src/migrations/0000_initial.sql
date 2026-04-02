-- Migration: 0000_initial
-- Smart Nutrition Tracker — Initial schema
-- Generated from Drizzle schema definitions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════
-- USER TABLES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                 UUID NOT NULL UNIQUE,
  "display_name"            TEXT,
  "date_of_birth"           DATE,
  "sex"                     TEXT CHECK ("sex" IN ('male', 'female', 'other')),
  "height_cm"               NUMERIC(5,1),
  "current_weight_kg"       NUMERIC(5,1),
  "activity_level"          TEXT CHECK ("activity_level" IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  "goal"                    TEXT CHECK ("goal" IN ('lose', 'gain', 'maintain')),
  "target_pace_kg_per_week" NUMERIC(3,2),
  "dietary_preferences"     TEXT[] DEFAULT '{}',
  "allergies"               TEXT[] DEFAULT '{}',
  "disliked_foods"          TEXT[] DEFAULT '{}',
  "unit_system"             TEXT DEFAULT 'metric' CHECK ("unit_system" IN ('metric', 'imperial')),
  "timezone"                TEXT DEFAULT 'UTC',
  "onboarding_completed"    BOOLEAN DEFAULT FALSE,
  "created_at"              TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_targets" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL UNIQUE,
  "calories"    NUMERIC(6,0) NOT NULL,
  "protein_g"   NUMERIC(5,1) NOT NULL,
  "carbs_g"     NUMERIC(5,1) NOT NULL,
  "fat_g"       NUMERIC(5,1) NOT NULL,
  "source"      TEXT DEFAULT 'auto' CHECK ("source" IN ('auto', 'manual', 'hybrid')),
  "created_at"  TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- FOOD DATABASE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "foods" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "brand"           TEXT,
  "barcode"         TEXT,
  "source"          TEXT NOT NULL CHECK ("source" IN ('usda', 'off', 'admin', 'community')),
  "source_id"       TEXT,
  "serving_size_g"  NUMERIC(7,1) NOT NULL,
  "serving_label"   TEXT,
  "calories"        NUMERIC(7,1) NOT NULL,
  "protein_g"       NUMERIC(7,2) NOT NULL,
  "carbs_g"         NUMERIC(7,2) NOT NULL,
  "fat_g"           NUMERIC(7,2) NOT NULL,
  "fiber_g"         NUMERIC(7,2),
  "sugar_g"         NUMERIC(7,2),
  "sodium_mg"       NUMERIC(7,1),
  "category"        TEXT,
  "tags"            TEXT[] DEFAULT '{}',
  "is_verified"     BOOLEAN DEFAULT FALSE,
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_foods_barcode" ON "foods"("barcode") WHERE "barcode" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_foods_name_trgm" ON "foods" USING gin("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_foods_category" ON "foods"("category");
CREATE INDEX IF NOT EXISTS "idx_foods_source" ON "foods"("source");

CREATE TABLE IF NOT EXISTS "food_nutrients" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "food_id"         UUID NOT NULL REFERENCES "foods"("id") ON DELETE CASCADE,
  "nutrient_code"   TEXT NOT NULL,
  "amount"          NUMERIC(10,3) NOT NULL,
  "unit"            TEXT NOT NULL,
  UNIQUE("food_id", "nutrient_code")
);

CREATE TABLE IF NOT EXISTS "custom_foods" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"         UUID NOT NULL,
  "name"            TEXT NOT NULL,
  "brand"           TEXT,
  "barcode"         TEXT,
  "serving_size_g"  NUMERIC(7,1) NOT NULL,
  "serving_label"   TEXT,
  "calories"        NUMERIC(7,1) NOT NULL,
  "protein_g"       NUMERIC(7,2) NOT NULL,
  "carbs_g"         NUMERIC(7,2) NOT NULL,
  "fat_g"           NUMERIC(7,2) NOT NULL,
  "fiber_g"         NUMERIC(7,2),
  "sugar_g"         NUMERIC(7,2),
  "sodium_mg"       NUMERIC(7,1),
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_custom_foods_user" ON "custom_foods"("user_id");

-- ═══════════════════════════════════════════════════════════════════
-- FOOD LOGGING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "food_logs" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"         UUID NOT NULL,
  "log_date"        DATE NOT NULL,
  "total_calories"  NUMERIC(8,1) DEFAULT 0,
  "total_protein_g" NUMERIC(7,2) DEFAULT 0,
  "total_carbs_g"   NUMERIC(7,2) DEFAULT 0,
  "total_fat_g"     NUMERIC(7,2) DEFAULT 0,
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "log_date")
);

CREATE TABLE IF NOT EXISTS "food_log_items" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "log_id"          UUID NOT NULL REFERENCES "food_logs"("id") ON DELETE CASCADE,
  "user_id"         UUID NOT NULL,
  "meal_slot"       TEXT NOT NULL CHECK ("meal_slot" IN ('breakfast', 'lunch', 'dinner', 'snack')),
  "food_id"         UUID,
  "food_type"       TEXT NOT NULL CHECK ("food_type" IN ('global', 'custom', 'recipe', 'quick_add')),
  "food_name"       TEXT NOT NULL,
  "quantity_g"      NUMERIC(7,1) NOT NULL,
  "serving_label"   TEXT,
  "calories"        NUMERIC(7,1) NOT NULL,
  "protein_g"       NUMERIC(7,2) NOT NULL,
  "carbs_g"         NUMERIC(7,2) NOT NULL,
  "fat_g"           NUMERIC(7,2) NOT NULL,
  "logged_at"       TIMESTAMPTZ DEFAULT NOW(),
  "sort_order"      INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_food_log_items_user_date" ON "food_log_items"("user_id", "logged_at");
CREATE INDEX IF NOT EXISTS "idx_food_log_items_log" ON "food_log_items"("log_id");

CREATE TABLE IF NOT EXISTS "favorite_foods" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL,
  "food_id"     UUID,
  "food_type"   TEXT NOT NULL CHECK ("food_type" IN ('global', 'custom', 'recipe')),
  "created_at"  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "food_id", "food_type")
);

-- ═══════════════════════════════════════════════════════════════════
-- RECIPES & SAVED MEALS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "custom_recipes" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"         UUID NOT NULL,
  "name"            TEXT NOT NULL,
  "servings"        INTEGER NOT NULL DEFAULT 1,
  "notes"           TEXT,
  "total_calories"  NUMERIC(8,1),
  "total_protein_g" NUMERIC(7,2),
  "total_carbs_g"   NUMERIC(7,2),
  "total_fat_g"     NUMERIC(7,2),
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_recipes_user" ON "custom_recipes"("user_id");

CREATE TABLE IF NOT EXISTS "recipe_ingredients" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipe_id"   UUID NOT NULL REFERENCES "custom_recipes"("id") ON DELETE CASCADE,
  "food_id"     UUID,
  "food_type"   TEXT NOT NULL CHECK ("food_type" IN ('global', 'custom')),
  "quantity_g"  NUMERIC(7,1) NOT NULL,
  "label"       TEXT,
  "sort_order"  INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_ingredients_recipe" ON "recipe_ingredients"("recipe_id");

CREATE TABLE IF NOT EXISTS "saved_meals" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL,
  "name"        TEXT NOT NULL,
  "created_at"  TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_saved_meals_user" ON "saved_meals"("user_id");

CREATE TABLE IF NOT EXISTS "saved_meal_items" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "meal_id"         UUID NOT NULL REFERENCES "saved_meals"("id") ON DELETE CASCADE,
  "food_id"         UUID,
  "food_type"       TEXT NOT NULL CHECK ("food_type" IN ('global', 'custom', 'recipe')),
  "quantity_g"      NUMERIC(7,1) NOT NULL,
  "serving_label"   TEXT,
  "sort_order"      INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_meal_items_meal" ON "saved_meal_items"("meal_id");

-- ═══════════════════════════════════════════════════════════════════
-- BODY TRACKING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "weight_logs" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL,
  "log_date"    DATE NOT NULL,
  "weight_kg"   NUMERIC(5,1) NOT NULL,
  "notes"       TEXT,
  "created_at"  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "log_date")
);

CREATE TABLE IF NOT EXISTS "measurement_logs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID NOT NULL,
  "log_date"          DATE NOT NULL,
  "measurement_type"  TEXT NOT NULL CHECK ("measurement_type" IN ('waist', 'hips', 'chest', 'bicep_left', 'bicep_right', 'thigh_left', 'thigh_right', 'neck')),
  "value_cm"          NUMERIC(5,1) NOT NULL,
  "created_at"        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id", "log_date", "measurement_type")
);

-- ═══════════════════════════════════════════════════════════════════
-- SHARING & PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "shares" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id"        UUID NOT NULL,
  "recipient_email" TEXT,
  "recipient_id"    UUID,
  "invite_token"    TEXT NOT NULL UNIQUE,
  "status"          TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'revoked')),
  "created_at"      TIMESTAMPTZ DEFAULT NOW(),
  "expires_at"      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_shares_owner" ON "shares"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_shares_recipient" ON "shares"("recipient_id");

CREATE TABLE IF NOT EXISTS "share_grants" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "share_id"          UUID NOT NULL REFERENCES "shares"("id") ON DELETE CASCADE,
  "data_type"         TEXT NOT NULL CHECK ("data_type" IN ('diary', 'weight', 'measurements', 'targets', 'summary')),
  "permission"        TEXT DEFAULT 'view' CHECK ("permission" IN ('view')),
  "date_range_start"  DATE,
  "date_range_end"    DATE,
  "is_ongoing"        BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS "idx_grants_share" ON "share_grants"("share_id");

-- ═══════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all user-data tables
ALTER TABLE "user_profiles"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_targets"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_foods"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_logs"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_log_items"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorite_foods"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_recipes"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipe_ingredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_meals"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_meal_items"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weight_logs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "measurement_logs"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shares"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "share_grants"      ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own rows
CREATE POLICY "users_own_profiles"    ON "user_profiles"    FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_targets"     ON "user_targets"     FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_custom_foods" ON "custom_foods"    FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_food_logs"   ON "food_logs"        FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_log_items"   ON "food_log_items"   FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_favorites"   ON "favorite_foods"   FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_recipes"     ON "custom_recipes"   FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_saved_meals" ON "saved_meals"      FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_weight"      ON "weight_logs"      FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "users_own_measurements" ON "measurement_logs" FOR ALL USING ("user_id" = auth.uid());
CREATE POLICY "owners_own_shares"     ON "shares"           FOR ALL USING ("owner_id" = auth.uid());

-- Recipe ingredients: accessible if user owns the parent recipe
CREATE POLICY "users_own_recipe_ingredients" ON "recipe_ingredients" FOR ALL
  USING ("recipe_id" IN (SELECT "id" FROM "custom_recipes" WHERE "user_id" = auth.uid()));

-- Saved meal items: accessible if user owns the parent meal
CREATE POLICY "users_own_meal_items" ON "saved_meal_items" FOR ALL
  USING ("meal_id" IN (SELECT "id" FROM "saved_meals" WHERE "user_id" = auth.uid()));

-- Share grants: accessible if user owns the parent share
CREATE POLICY "owners_own_grants" ON "share_grants" FOR ALL
  USING ("share_id" IN (SELECT "id" FROM "shares" WHERE "owner_id" = auth.uid()));

-- Foods table: readable by everyone (global database)
ALTER TABLE "foods" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_public_read" ON "foods" FOR SELECT USING (true);

-- Food nutrients: readable by everyone
ALTER TABLE "food_nutrients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrients_public_read" ON "food_nutrients" FOR SELECT USING (true);

-- Share viewer access: recipients can read shares they're invited to
CREATE POLICY "recipients_view_shares" ON "shares" FOR SELECT
  USING ("recipient_id" = auth.uid() AND "status" = 'active');
