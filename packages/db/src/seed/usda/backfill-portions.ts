/**
 * USDA Foundation / SR Legacy portion backfill.
 *
 * Why this exists:
 *   USDA's /foods/search endpoint returns a summary view that usually omits
 *   the rich `foodPortions` array for Foundation and SR Legacy foods. The
 *   full portion data is only returned by the detail endpoint GET /food/{fdcId}
 *   (or batched via POST /foods with up to 20 fdcIds per request).
 *
 *   Our initial importer relied on search responses, so only ~20 Foundation/SR
 *   foods ended up with portion rows. This script walks every unbranded USDA
 *   food in the DB, batches their fdcIds to USDA's /foods endpoint, and
 *   inserts the full portion array into food_portions.
 *
 * Usage (from monorepo root):
 *   bun run --filter @snt/db db:backfill-portions
 *
 * Idempotent: onConflictDoNothing on (food_id, description) so re-runs are
 * cheap.  Also DELETEs legacy rows where description = 'None' at the end.
 *
 * Optional env vars:
 *   BATCH_SIZE=20            fdcIds per USDA request (USDA caps at 20)
 *   LIMIT=100                cap the number of foods processed (for testing)
 */

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../schema";
import { foods, foodPortions } from "../../schema";
import { API_BASE_URL, API_RATE_LIMIT_MS } from "./config";

// ── Connection ──────────────────────────────────────────────────────

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error("❌ DIRECT_URL or DATABASE_URL must be set.");
  process.exit(1);
}

const API_KEY = process.env.USDA_API_KEY;
if (!API_KEY) {
  console.error("❌ USDA_API_KEY is required.");
  process.exit(1);
}

const BATCH_SIZE = Math.min(Number(process.env.BATCH_SIZE) || 20, 20);
const LIMIT = Number(process.env.LIMIT) || 0; // 0 = no cap

const usingPooler = connStr.includes(":6543/");
const pgClient = postgres(connStr, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !usingPooler,
});
const db = drizzle(pgClient, { schema });

// ── USDA response shape (detail endpoint) ───────────────────────────

interface USDADetailFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodPortions?: {
    id?: number;
    amount?: number;
    gramWeight: number;
    portionDescription?: string;
    modifier?: string;
    sequenceNumber?: number;
    measureUnit?: {
      id?: number;
      name?: string;
      abbreviation?: string;
    };
  }[];
}

// ── Helpers ─────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isGarbageDescription(desc: string): boolean {
  const lower = desc.toLowerCase().trim();
  return (
    !lower ||
    lower === "none" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "0"
  );
}

async function fetchDetailBatch(
  fdcIds: number[]
): Promise<USDADetailFood[]> {
  // POST /foods — batched detail fetch (up to 20 fdcIds per request).
  const url = `${API_BASE_URL}/foods?api_key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SmartNutritionTracker/1.0",
    },
    body: JSON.stringify({
      fdcIds,
      format: "full",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`USDA ${res.status} ${res.statusText} — not retryable`);
    }
    throw new Error(`USDA ${res.status} ${res.statusText}`);
  }

  return res.json();
}

interface PortionRow {
  foodId: string;
  amount: string;
  unit: string;
  modifier: string | null;
  description: string;
  gramWeight: string;
  sequenceNumber: number;
}

function buildPortionRows(
  foodId: string,
  usdaFood: USDADetailFood
): PortionRow[] {
  const rows: PortionRow[] = [];
  const seen = new Set<string>();

  for (const p of usdaFood.foodPortions ?? []) {
    if (
      !p ||
      p.gramWeight == null ||
      !Number.isFinite(p.gramWeight) ||
      p.gramWeight <= 0 ||
      p.gramWeight > 100_000
    ) {
      continue;
    }

    const amount = Number(p.amount) > 0 ? Number(p.amount) : 1;
    const rawUnit =
      p.measureUnit?.name ||
      p.measureUnit?.abbreviation ||
      "";
    // USDA uses "undetermined" as a placeholder when the real label is in
    // `modifier` (e.g. modifier="large", unit="undetermined" → "1 large").
    const unit =
      rawUnit && rawUnit.toLowerCase() !== "undetermined" ? rawUnit : "";

    const rawDesc =
      p.portionDescription?.trim() ||
      [
        amount !== 1 ? amount : "1",
        unit,
        p.modifier?.trim(),
      ]
        .filter(Boolean)
        .join(" ");

    if (!rawDesc || isGarbageDescription(rawDesc)) continue;

    const key = rawDesc.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      foodId,
      amount: String(Math.round(amount * 1000) / 1000),
      unit,
      modifier: p.modifier?.trim() || null,
      description: rawDesc,
      gramWeight: String(Math.round(Number(p.gramWeight) * 100) / 100),
      sequenceNumber: Number(p.sequenceNumber) || 0,
    });
  }

  return rows;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🔁 USDA Foundation/SR portion backfill");
  console.log("──────────────────────────────────────");
  console.log(`   Batch size: ${BATCH_SIZE} fdcIds/request`);
  console.log(`   Cap:        ${LIMIT > 0 ? LIMIT : "no cap"}`);

  // Find all unbranded USDA foods missing portion data.
  // (Branded = brand IS NOT NULL; they already got a synthesized portion.)
  const candidates = await db
    .select({
      id: foods.id,
      sourceId: foods.sourceId,
      name: foods.name,
    })
    .from(foods)
    .leftJoin(foodPortions, eq(foodPortions.foodId, foods.id))
    .where(
      and(
        eq(foods.source, "usda"),
        isNull(foods.brand),
        isNull(foodPortions.id)
      )
    )
    .groupBy(foods.id, foods.sourceId, foods.name);

  const targets = LIMIT > 0 ? candidates.slice(0, LIMIT) : candidates;
  console.log(`   Targets:    ${targets.length} foods needing portions\n`);

  if (targets.length === 0) {
    console.log("✅ Nothing to do — every Foundation/SR food already has portions.");
    await pgClient.end();
    return;
  }

  const idByFdc = new Map<number, string>();
  for (const t of targets) {
    const fdc = Number(t.sourceId);
    if (Number.isFinite(fdc)) idByFdc.set(fdc, t.id);
  }
  const fdcList = Array.from(idByFdc.keys());

  let totalInserted = 0;
  let totalFoodsWithPortions = 0;
  let totalFoodsReturnedNoPortions = 0;
  let totalBatchErrors = 0;
  const startTime = Date.now();

  const totalBatches = Math.ceil(fdcList.length / BATCH_SIZE);

  for (let i = 0; i < fdcList.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchFdc = fdcList.slice(i, i + BATCH_SIZE);

    let detail: USDADetailFood[] = [];
    try {
      detail = await fetchDetailBatch(batchFdc);
    } catch (err) {
      totalBatchErrors++;
      console.error(
        `  ⚠️  Batch ${batchNum}/${totalBatches} failed:`,
        err instanceof Error ? err.message : err
      );
      if (totalBatchErrors > 10) {
        console.error("  ❌ Too many batch errors, stopping.");
        break;
      }
      await sleep(2000);
      continue;
    }

    // Build portion rows from this batch.
    const portionRows: PortionRow[] = [];
    for (const usdaFood of detail) {
      const foodId = idByFdc.get(usdaFood.fdcId);
      if (!foodId) continue;

      const rows = buildPortionRows(foodId, usdaFood);
      if (rows.length === 0) {
        totalFoodsReturnedNoPortions++;
        continue;
      }
      portionRows.push(...rows);
      totalFoodsWithPortions++;
    }

    // Bulk insert.
    if (portionRows.length > 0) {
      try {
        await db
          .insert(foodPortions)
          .values(portionRows)
          .onConflictDoNothing(); // unique (food_id, description)
        totalInserted += portionRows.length;
      } catch (err) {
        console.error(`  ⚠️  Insert failed for batch ${batchNum}:`, err);
      }
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `  Batch ${batchNum}/${totalBatches} — ${totalFoodsWithPortions} foods enriched, ${totalInserted} portion rows inserted (${elapsed}s elapsed)`
      );
    }

    await sleep(API_RATE_LIMIT_MS);
  }

  // Clean up any 'None'/garbage rows left over from previous imports.
  const cleanup = await db.execute(sql`
    DELETE FROM food_portions
    WHERE LOWER(TRIM(description)) IN ('none', 'null', 'undefined', '0', '')
  `);
  console.log(
    `\n🧹 Cleaned up legacy garbage descriptions (none/null/undefined/0).`
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n🎉 Backfill complete in ${elapsed}s.\n` +
      `   Foods enriched:              ${totalFoodsWithPortions}\n` +
      `   Foods returned w/o portions: ${totalFoodsReturnedNoPortions}\n` +
      `   Portion rows inserted:       ${totalInserted}\n` +
      `   Batch errors:                ${totalBatchErrors}`
  );

  // Final state
  const [{ portionRows, foodsWithPortions }] = (await db.execute(sql`
    select
      (select count(*) from food_portions)::int as "portionRows",
      (select count(distinct food_id) from food_portions)::int as "foodsWithPortions"
  `)) as any;
  console.log(
    `\n   Final: ${portionRows} portion rows across ${foodsWithPortions} distinct foods.`
  );

  await pgClient.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ Backfill failed:", err);
  try {
    await pgClient.end();
  } catch {}
  process.exit(1);
});
