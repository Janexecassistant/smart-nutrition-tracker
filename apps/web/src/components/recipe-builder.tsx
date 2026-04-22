"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface FoodResult {
  id: string;
  name: string;
  brand?: string | null;
  calories: string | number;
  proteinG: string | number;
  carbsG: string | number;
  fatG: string | number;
  servingSizeG: string | number;
  servingLabel?: string | null;
  imageUrl?: string | null;
  source?: string | null;
}

interface Ingredient {
  // Local UI key only
  key: string;
  foodId: string;
  foodType: "global" | "custom";
  foodName: string;
  quantityG: number;
  label?: string;
  // Cached per-serving nutrition so we can live-compute without a round-trip
  servingSizeG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RecipeBuilderInitial {
  id?: string;
  name: string;
  servings: number;
  notes?: string;
  ingredients: Ingredient[];
}

interface Props {
  initial?: RecipeBuilderInitial;
  mode: "create" | "edit";
}

export function RecipeBuilder({ initial, mode }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [servings, setServings] = useState(String(initial?.servings ?? "1"));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? []
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Live totals — computed from each ingredient's (per-serving / servingSizeG) × quantityG
  const totals = ingredients.reduce(
    (acc, it) => {
      const size = it.servingSizeG || 1;
      const scale = it.quantityG / size;
      return {
        calories: acc.calories + it.calories * scale,
        proteinG: acc.proteinG + it.proteinG * scale,
        carbsG: acc.carbsG + it.carbsG * scale,
        fatG: acc.fatG + it.fatG * scale,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const srv = Math.max(1, parseInt(servings) || 1);
  const perServing = {
    calories: totals.calories / srv,
    proteinG: totals.proteinG / srv,
    carbsG: totals.carbsG / srv,
    fatG: totals.fatG / srv,
  };

  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await api.get("/foods/search", { query: q, limit: "10" });
      setResults(data.foods || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  }

  function addIngredient(food: FoodResult) {
    // Only persistable DB foods can become recipe ingredients. External
    // search hits (usda_*, off_*) aren't in our foods table yet — the API
    // expects a real UUID foodId + foodType "global" | "custom".
    if (!/^[0-9a-f-]{36}$/i.test(food.id)) {
      setError(`"${food.name}" isn't in our database yet — try a different food or save it as a custom food first.`);
      return;
    }
    setError("");
    const servingSizeG = Number(food.servingSizeG) || 100;
    setIngredients((list) => [
      ...list,
      {
        key: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        foodId: food.id,
        foodType: "global",
        foodName: food.name,
        quantityG: servingSizeG,
        servingSizeG,
        calories: Number(food.calories) || 0,
        proteinG: Number(food.proteinG) || 0,
        carbsG: Number(food.carbsG) || 0,
        fatG: Number(food.fatG) || 0,
      },
    ]);
    setQuery("");
    setResults([]);
  }

  function updateQuantity(key: string, val: string) {
    const g = parseFloat(val);
    setIngredients((list) =>
      list.map((it) =>
        it.key === key ? { ...it, quantityG: Number.isFinite(g) && g > 0 ? g : 0 } : it
      )
    );
  }

  function removeIngredient(key: string) {
    setIngredients((list) => list.filter((it) => it.key !== key));
  }

  async function save() {
    setError("");
    if (!name.trim()) { setError("Give the recipe a name."); return; }
    if (ingredients.length === 0) { setError("Add at least one ingredient."); return; }
    if (ingredients.some((it) => it.quantityG <= 0)) {
      setError("Every ingredient needs a quantity greater than 0g.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        servings: srv,
        notes: notes.trim() || undefined,
        ingredients: ingredients.map((it) => ({
          foodId: it.foodId,
          foodType: it.foodType,
          quantityG: it.quantityG,
          label: it.label,
        })),
      };
      if (mode === "create") {
        await api.post("/recipes", body);
      } else if (initial?.id) {
        await api.patch(`/recipes/${initial.id}`, body);
      }
      router.push("/recipes");
    } catch (err: any) {
      setError(err.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white px-6 pt-8 pb-8 rounded-b-3xl shadow-xl">
        <div className="max-w-2xl mx-auto">
          <Link href="/recipes" className="text-emerald-300 text-sm hover:text-emerald-200 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Recipes
          </Link>
          <h1 className="text-2xl font-bold mt-2">
            {mode === "create" ? "New Recipe" : "Edit Recipe"}
          </h1>
          <p className="text-emerald-200/80 text-sm mt-1">
            Add ingredients and servings — we&rsquo;ll calculate the rest.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">
        {/* Name + servings */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1">
              Recipe name
            </label>
            <input
              type="text" value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g. Turkey chili"
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1">
                Servings
              </label>
              <input
                type="number" min="1" step="1" value={servings}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServings(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1">
                Notes (optional)
              </label>
              <input
                type="text" value={notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                placeholder="e.g. Makes ~4 cups, freezes well"
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Live nutrition preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider">
              Nutrition preview
            </h3>
            <p className="text-xs text-neutral-400">Per serving · {srv} serving{srv === 1 ? "" : "s"} total</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { label: "cal", value: Math.round(perServing.calories), color: "#059669", bg: "#f0fdf4" },
              { label: "protein", value: `${Math.round(perServing.proteinG)}g`, color: "#6366f1", bg: "#eef2ff" },
              { label: "carbs", value: `${Math.round(perServing.carbsG)}g`, color: "#f59e0b", bg: "#fffbeb" },
              { label: "fat", value: `${Math.round(perServing.fatG)}g`, color: "#f43f5e", bg: "#fff1f2" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-2.5" style={{ backgroundColor: m.bg }}>
                <p className="font-bold text-base" style={{ color: m.color }}>{m.value}</p>
                <p className="text-neutral-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients list */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-4">
          <h3 className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-3">
            Ingredients ({ingredients.length})
          </h3>

          {ingredients.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              No ingredients yet. Search below to add one.
            </p>
          ) : (
            <ul className="space-y-2 mb-3">
              {ingredients.map((it) => (
                <li key={it.key} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-neutral-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{it.foodName}</p>
                    <p className="text-xs text-neutral-400">
                      {Math.round((it.calories / (it.servingSizeG || 1)) * it.quantityG)} cal ·{" "}
                      {Math.round((it.proteinG / (it.servingSizeG || 1)) * it.quantityG)}g P
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min="0" step="1"
                      value={it.quantityG}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(it.key, e.target.value)}
                      className="w-20 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <span className="text-xs text-neutral-400">g</span>
                  </div>
                  <button
                    onClick={() => removeIngredient(it.key)}
                    className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Search to add */}
          <div className="border-t border-neutral-100 pt-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text" value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value)}
                placeholder="Search for an ingredient..."
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white"
              />
            </div>

            {searching && (
              <p className="text-xs text-neutral-400 text-center py-3">Searching...</p>
            )}

            {!searching && results.length > 0 && (
              <ul className="mt-2 border border-neutral-100 rounded-xl overflow-hidden">
                {results.map((food, idx) => (
                  <li key={food.id} className={idx > 0 ? "border-t border-neutral-100" : ""}>
                    <button
                      onClick={() => addIngredient(food)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800 truncate">{food.name}</p>
                          <p className="text-xs text-neutral-400 truncate">
                            {food.brand && `${food.brand} · `}
                            {Number(food.servingSizeG)}g serving
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                          +
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-3">
                No foods found for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Link
            href="/recipes"
            className="flex-1 py-2.5 text-center font-semibold rounded-xl text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving || !name.trim() || ingredients.length === 0}
            className="flex-[2] py-2.5 text-white font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm shadow-sm"
          >
            {saving ? "Saving..." : mode === "create" ? "Create Recipe" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
