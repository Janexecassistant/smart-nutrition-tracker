/**
 * Typesense client and food search index management.
 *
 * Typesense gives us:
 * - Typo-tolerant fuzzy search ("chiken" → "chicken")
 * - Sub-50ms search latency
 * - Autocomplete with weighted fields
 * - Faceted filtering (by category, tags, verified status)
 *
 * The foods collection mirrors the Postgres `foods` table but is optimized
 * for search. Postgres remains the source of truth.
 */

import Typesense from "typesense";

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || "localhost",
      port: Number(process.env.TYPESENSE_PORT) || 8108,
      protocol: "http",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || "snt-dev-key",
  connectionTimeoutSeconds: 5,
});

export const FOODS_COLLECTION = "foods";

// ── Collection Schema ─────────────────────────────────────────────

const foodsSchema = {
  name: FOODS_COLLECTION,
  fields: [
    { name: "id", type: "string" as const },
    { name: "name", type: "string" as const, sort: true },
    { name: "brand", type: "string" as const, optional: true },
    { name: "barcode", type: "string" as const, optional: true },
    { name: "source", type: "string" as const, facet: true },
    { name: "serving_size_g", type: "float" as const },
    { name: "serving_label", type: "string" as const, optional: true },
    { name: "calories", type: "float" as const, sort: true },
    { name: "protein_g", type: "float" as const, sort: true },
    { name: "carbs_g", type: "float" as const },
    { name: "fat_g", type: "float" as const },
    { name: "category", type: "string" as const, facet: true, optional: true },
    { name: "tags", type: "string[]" as const, facet: true },
    { name: "is_verified", type: "bool" as const, facet: true },
  ],
  default_sorting_field: "calories",
  token_separators: ["-", "'"],
};

// ── Collection Management ─────────────────────────────────────────

export async function ensureFoodsCollection(): Promise<void> {
  try {
    await client.collections(FOODS_COLLECTION).retrieve();
    console.log("  Typesense: foods collection exists");
  } catch {
    console.log("  Typesense: creating foods collection...");
    await client.collections().create(foodsSchema);
    console.log("  Typesense: foods collection created");
  }
}

export async function dropFoodsCollection(): Promise<void> {
  try {
    await client.collections(FOODS_COLLECTION).delete();
  } catch {
    // Collection doesn't exist, that's fine
  }
}

// ── Document Operations ───────────────────────────────────────────

export interface TypesenseFoodDoc {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: string;
  serving_size_g: number;
  serving_label?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  category?: string;
  tags: string[];
  is_verified: boolean;
}

export async function upsertFoodDoc(doc: TypesenseFoodDoc): Promise<void> {
  await client
    .collections(FOODS_COLLECTION)
    .documents()
    .upsert(doc);
}

export async function upsertFoodDocsBatch(
  docs: TypesenseFoodDoc[]
): Promise<void> {
  if (docs.length === 0) return;

  await client
    .collections(FOODS_COLLECTION)
    .documents()
    .import(docs, { action: "upsert" });
}

export async function deleteFoodDoc(id: string): Promise<void> {
  try {
    await client.collections(FOODS_COLLECTION).documents(id).delete();
  } catch {
    // Document doesn't exist
  }
}

// ── Search ────────────────────────────────────────────────────────

export interface FoodSearchParams {
  query: string;
  limit?: number;
  offset?: number;
  filterBy?: string;
  sortBy?: string;
}

export interface FoodSearchResult {
  hits: TypesenseFoodDoc[];
  found: number;
  page: number;
}

export async function searchFoods(
  params: FoodSearchParams
): Promise<FoodSearchResult> {
  const { query, limit = 20, offset = 0, filterBy, sortBy } = params;

  const page = Math.floor(offset / limit) + 1;

  const result = await client
    .collections(FOODS_COLLECTION)
    .documents()
    .search({
      q: query,
      query_by: "name,brand",
      query_by_weights: "3,1", // name is 3x more important than brand
      per_page: limit,
      page,
      filter_by: filterBy,
      sort_by: sortBy || "_text_match:desc,is_verified:desc",
      typo_tokens_threshold: 3,
      num_typos: 2,
      prefix: true, // enable prefix matching for autocomplete
    });

  const hits = (result.hits || []).map(
    (hit: any) => hit.document as TypesenseFoodDoc
  );

  return {
    hits,
    found: result.found,
    page,
  };
}

export { client as typesenseClient };
