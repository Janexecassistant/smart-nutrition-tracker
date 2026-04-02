import { db } from "../client";
import { foods } from "../schema";
import { sampleFoods } from "./sample-foods";

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert sample foods
  console.log(`  Inserting ${sampleFoods.length} sample foods...`);
  for (const food of sampleFoods) {
    await db
      .insert(foods)
      .values(food)
      .onConflictDoNothing();
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
