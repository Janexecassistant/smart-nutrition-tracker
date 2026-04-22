"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/auth-guard";
import { RecipeBuilder, type RecipeBuilderInitial } from "@/components/recipe-builder";

interface RecipeDetail {
  id: string;
  name: string;
  servings: number;
  notes?: string | null;
  ingredients: Array<{
    id: string;
    foodId: string | null;
    foodType: string;
    foodName: string;
    quantityG: number;
    label?: string | null;
    nutrition?: { calories: number; proteinG: number; carbsG: number; fatG: number } | null;
  }>;
  total: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <EditRecipe id={id} />
    </AuthGuard>
  );
}

function EditRecipe({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => api.get<RecipeDetail>(`/recipes/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
        <p className="text-neutral-600">Couldn&rsquo;t load that recipe.</p>
        <Link href="/recipes" className="text-emerald-600 font-medium text-sm">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  // Map API response to builder initial shape. We back-derive each
  // ingredient's per-serving nutrition from the resolved "per quantity"
  // nutrition so the live preview matches the saved totals exactly.
  const initial: RecipeBuilderInitial = {
    id: data.id,
    name: data.name,
    servings: data.servings,
    notes: data.notes ?? undefined,
    ingredients: data.ingredients
      .filter((i) => i.foodId)
      .map((i) => {
        const q = Number(i.quantityG) || 1;
        const n = i.nutrition ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        // Store as per-100g so the builder's (cal / servingSizeG) × quantityG math works
        const per100 = {
          calories: (Number(n.calories) / q) * 100,
          proteinG: (Number(n.proteinG) / q) * 100,
          carbsG: (Number(n.carbsG) / q) * 100,
          fatG: (Number(n.fatG) / q) * 100,
        };
        return {
          key: `${i.id}`,
          foodId: i.foodId!,
          foodType: (i.foodType === "custom" ? "custom" : "global") as "global" | "custom",
          foodName: i.foodName,
          quantityG: q,
          label: i.label ?? undefined,
          servingSizeG: 100,
          calories: per100.calories,
          proteinG: per100.proteinG,
          carbsG: per100.carbsG,
          fatG: per100.fatG,
        };
      }),
  };

  return <RecipeBuilder mode="edit" initial={initial} />;
}
