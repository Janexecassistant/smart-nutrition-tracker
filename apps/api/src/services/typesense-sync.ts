/**
 * Sync Postgres foods table → Typesense search index.
 *
 * Usage:
 *   bun run apps/api/src/services/typesense-sync.ts
 *
 * Run this after:
 *   - Initial database seed
 *   - USDA import
 *   - Any bulk food data update
 *
 * For incremental updates (single food added/edited), the API routes
 * call upsertFoodDoc() directly.
 */

import { db, foods } from "@snt/db";
import {
  ensureFoodsCollection,
  upsertFoodDocsBatch,
  type TypesenseFoodDoc,
} from "./typesense";

const BATCH_SIZE = 500;

async function sync() {
  console.log("🔍 Syncing foods → Typesense...");

  // Ensure collection exists
  await ensureFoodsCollection();

  // Stream all foods from Postgres
  const allFoods = await db.select().from(foods);

  console.log(`  Found ${allFoods.length} foods in Postgres`);

  // Convert to Typesense documents and batch upsert
  let synced = 0;
  let batch: TypesenseFoodDoc[] = [];

  for (const food of allFoods) {
    batch.push({
      id: food.id,
      name: food.name,
      brand: food.brand ?? undefined,
      barcode: food.barcode ?? undefined,
      source: food.source,
      serving_size_g: Number(food.servingSizeG),
      serving_label: food.servingLabel ?? undefined,
      calories: Number(food.calories),
      protein_g: Number(food.proteinG),
      carbs_g: Number(food.carbsG),
      fat_g: Number(food.fatG),
      category: food.category ?? undefined,
      tags: food.tags ?? [],
      is_verified: food.isVerified ?? false,
    });

    if (batch.length >= BATCH_SIZE) {
      await upsertFoodDocsBatch(batch);
      synced += batch.length;
      console.log(`  Synced ${synced}/${allFoods.length}...`);
      batch = [];
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await upsertFoodDocsBatch(batch);
    synced += batch.length;
  }

  console.log(`✅ Sync complete! ${synced} foods indexed in Typesense.`);
  process.exit(0);
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
