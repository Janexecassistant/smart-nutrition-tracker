"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/auth-guard";

interface RecipeSummary {
  id: string;
  name: string;
  servings: number;
  notes?: string | null;
  perServing: { calories: number; proteinG: number; carbsG: number; fatG: number };
  total: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export default function RecipesPage() {
  return (
    <AuthGuard>
      <RecipesList />
    </AuthGuard>
  );
}

function RecipesList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => api.get<{ recipes: RecipeSummary[] }>("/recipes"),
  });

  async function deleteRecipe(id: string, name: string) {
    if (!window.confirm(`Delete recipe "${name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/recipes/${id}`);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    } catch (err: any) {
      alert(err.message || "Failed to delete recipe");
    }
  }

  const recipes = data?.recipes ?? [];

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white px-6 pt-8 pb-10 rounded-b-3xl shadow-xl">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-emerald-300 text-sm hover:text-emerald-200 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <div className="flex items-end justify-between mt-3">
            <div>
              <h1 className="text-2xl font-bold">📖 Recipes</h1>
              <p className="text-emerald-200/80 text-sm mt-1">
                Build combos once, log them in one tap.
              </p>
            </div>
            <Link
              href="/recipes/new"
              className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-xl text-sm shadow-sm hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              + New Recipe
            </Link>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-emerald-50">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <span className="text-3xl">📖</span>
            </div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">No recipes yet</h2>
            <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto">
              Create a recipe with its ingredients and servings. We&rsquo;ll
              roll up the nutrition so logging a whole bowl takes one tap.
            </p>
            <Link
              href="/recipes/new"
              className="inline-block bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors"
            >
              Build your first recipe
            </Link>
          </div>
        ) : (
          recipes.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-sm border border-emerald-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-800">{r.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {r.servings} serving{r.servings === 1 ? "" : "s"} ·{" "}
                    {Math.round(r.total.calories)} cal total
                  </p>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                    {[
                      { label: "cal", value: Math.round(r.perServing.calories), color: "#059669", bg: "#f0fdf4" },
                      { label: "protein", value: `${Math.round(r.perServing.proteinG)}g`, color: "#6366f1", bg: "#eef2ff" },
                      { label: "carbs", value: `${Math.round(r.perServing.carbsG)}g`, color: "#f59e0b", bg: "#fffbeb" },
                      { label: "fat", value: `${Math.round(r.perServing.fatG)}g`, color: "#f43f5e", bg: "#fff1f2" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg py-1.5" style={{ backgroundColor: m.bg }}>
                        <p className="font-bold" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-neutral-400 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2">Per serving</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={`/recipes/${r.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteRecipe(r.id, r.name)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
