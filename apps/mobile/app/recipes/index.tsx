import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { api } from "../../src/lib/api";

interface RecipeSummary {
  id: string;
  name: string;
  servings: number;
  perServing: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export default function RecipesListScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ recipes: RecipeSummary[] }>("/recipes");
      setRecipes(data.recipes || []);
    } catch {
      setRecipes([]);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (r: RecipeSummary) => {
    Alert.alert(
      "Delete recipe?",
      `"${r.name}" will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/recipes/${r.id}`);
              setRecipes((prev) => prev.filter((x) => x.id !== r.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete.");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "My Recipes",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/recipes/new")}
              style={styles.headerAddBtn}
            >
              <Text style={styles.headerAddBtnText}>+ New</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#059669" />
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📖</Text>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySub}>
              Build your favorite homemade meals and log them with a single tap.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/recipes/new")}
            >
              <Text style={styles.primaryBtnText}>Build your first recipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recipes.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              onPress={() => router.push(`/recipes/${r.id}`)}
              onLongPress={() => handleDelete(r)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{r.name}</Text>
                <Text style={styles.cardSub}>
                  {r.servings} serving{r.servings === 1 ? "" : "s"} ·{" "}
                  {Math.round(r.perServing.calories)} cal /serving ·{" "}
                  {Math.round(r.perServing.proteinG)}g P
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}

        {!loading && recipes.length > 0 && (
          <Text style={styles.hint}>Tip: long-press a recipe to delete it.</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9" },
  center: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  emptySub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  cardSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  chevron: { fontSize: 22, color: "#cbd5e1", marginLeft: 8 },
  hint: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 16 },
  headerAddBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerAddBtnText: { color: "#059669", fontWeight: "700", fontSize: 15 },
});
