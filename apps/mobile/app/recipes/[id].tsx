import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import {
  RecipeBuilder,
  type RecipeBuilderInitial,
} from "../../src/components/recipe-builder";

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
    nutrition?: {
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    } | null;
  }>;
  total: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get<RecipeDetail>(`/recipes/${id}`);
        setData(d);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Recipe" }} />
        <View style={styles.center}>
          <ActivityIndicator color="#059669" />
        </View>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Recipe" }} />
        <View style={styles.center}>
          <Text style={styles.errTitle}>Couldn&rsquo;t load that recipe.</Text>
          <TouchableOpacity onPress={() => router.replace("/recipes")}>
            <Text style={styles.errLink}>← Back to recipes</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Back-derive each ingredient's per-100g nutrition so the builder's
  // (cal / servingSizeG) × quantityG math reproduces the saved totals exactly.
  const initial: RecipeBuilderInitial = {
    id: data.id,
    name: data.name,
    servings: data.servings,
    notes: data.notes ?? undefined,
    ingredients: data.ingredients
      .filter((i) => i.foodId)
      .map((i) => {
        const q = Number(i.quantityG) || 1;
        const n =
          i.nutrition ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
        const per100 = {
          calories: (Number(n.calories) / q) * 100,
          proteinG: (Number(n.proteinG) / q) * 100,
          carbsG: (Number(n.carbsG) / q) * 100,
          fatG: (Number(n.fatG) / q) * 100,
        };
        return {
          key: `${i.id}`,
          foodId: i.foodId!,
          foodType: (i.foodType === "custom" ? "custom" : "global") as
            | "global"
            | "custom",
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

  return (
    <>
      <Stack.Screen options={{ title: "Edit Recipe" }} />
      <RecipeBuilder mode="edit" initial={initial} />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8faf9",
  },
  errTitle: { fontSize: 15, color: "#475569", marginBottom: 12 },
  errLink: { fontSize: 14, color: "#059669", fontWeight: "600" },
});
