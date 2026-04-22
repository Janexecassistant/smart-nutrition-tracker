import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";

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
}

export interface Ingredient {
  key: string;
  foodId: string;
  foodType: "global" | "custom";
  foodName: string;
  quantityG: number;
  label?: string;
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

const UUID_RE = /^[0-9a-f-]{36}$/i;

export function RecipeBuilder({ initial, mode }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [servings, setServings] = useState(String(initial?.servings ?? "1"));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? []
  );

  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {}
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.get<{ foods: FoodResult[] }>("/foods/search", {
        query: q,
        limit: "10",
      });
      setResults(data.foods || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(query), 300);
  }, [query, searchFoods]);

  function addIngredient(food: FoodResult) {
    if (!UUID_RE.test(food.id)) {
      setError(
        `"${food.name}" isn't in our database yet — try another food or save it as a custom food first.`
      );
      return;
    }
    setError("");
    const servingSizeG = Number(food.servingSizeG) || 100;
    const key = `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setIngredients((list) => [
      ...list,
      {
        key,
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
    setQuantityDrafts((d) => ({ ...d, [key]: val }));
    const g = parseFloat(val);
    setIngredients((list) =>
      list.map((it) =>
        it.key === key
          ? { ...it, quantityG: Number.isFinite(g) && g > 0 ? g : 0 }
          : it
      )
    );
  }

  function removeIngredient(key: string) {
    setIngredients((list) => list.filter((it) => it.key !== key));
    setQuantityDrafts((d) => {
      const { [key]: _, ...rest } = d;
      return rest;
    });
  }

  async function save() {
    setError("");
    if (!name.trim()) {
      setError("Give the recipe a name.");
      return;
    }
    if (ingredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
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
      router.replace("/recipes");
    } catch (err: any) {
      setError(err.message || "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "New Recipe" : "Edit Recipe"}
          </Text>
          <Text style={styles.headerSub}>
            Add ingredients and servings — we&rsquo;ll calculate the rest.
          </Text>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {/* Name + servings + notes */}
          <View style={styles.card}>
            <Text style={styles.label}>Recipe name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Turkey chili"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.row}>
              <View style={{ width: 90 }}>
                <Text style={styles.label}>Servings</Text>
                <TextInput
                  style={[styles.input, { textAlign: "center" }]}
                  keyboardType="number-pad"
                  value={servings}
                  onChangeText={setServings}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. freezes well"
                  placeholderTextColor="#94a3b8"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          </View>

          {/* Nutrition preview */}
          <View style={styles.card}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Nutrition preview</Text>
              <Text style={styles.previewSub}>
                Per serving · {srv} serving{srv === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.macroGrid}>
              <MacroCell
                value={Math.round(perServing.calories)}
                label="cal"
                color="#059669"
                bg="#f0fdf4"
              />
              <MacroCell
                value={`${Math.round(perServing.proteinG)}g`}
                label="protein"
                color="#6366f1"
                bg="#eef2ff"
              />
              <MacroCell
                value={`${Math.round(perServing.carbsG)}g`}
                label="carbs"
                color="#f59e0b"
                bg="#fffbeb"
              />
              <MacroCell
                value={`${Math.round(perServing.fatG)}g`}
                label="fat"
                color="#f43f5e"
                bg="#fff1f2"
              />
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.card}>
            <Text style={styles.previewTitle}>
              Ingredients ({ingredients.length})
            </Text>

            {ingredients.length === 0 ? (
              <Text style={styles.emptyHint}>
                No ingredients yet. Search below to add one.
              </Text>
            ) : (
              <View style={{ marginTop: 8, gap: 6 }}>
                {ingredients.map((it) => {
                  const draft = quantityDrafts[it.key] ?? String(it.quantityG);
                  const size = it.servingSizeG || 1;
                  const scale = it.quantityG / size;
                  return (
                    <View key={it.key} style={styles.ingredientRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingredientName} numberOfLines={1}>
                          {it.foodName}
                        </Text>
                        <Text style={styles.ingredientSub}>
                          {Math.round(it.calories * scale)} cal ·{" "}
                          {Math.round(it.proteinG * scale)}g P
                        </Text>
                      </View>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="decimal-pad"
                        value={draft}
                        onChangeText={(v) => updateQuantity(it.key, v)}
                      />
                      <Text style={styles.qtyUnit}>g</Text>
                      <TouchableOpacity
                        onPress={() => removeIngredient(it.key)}
                        style={styles.removeBtn}
                      >
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Search to add */}
            <View style={styles.searchBlock}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for an ingredient..."
                placeholderTextColor="#94a3b8"
                value={query}
                onChangeText={setQuery}
              />

              {searching && (
                <View style={{ paddingVertical: 10, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#059669" />
                </View>
              )}

              {!searching && results.length > 0 && (
                <View style={styles.resultsList}>
                  {results.map((food, idx) => (
                    <TouchableOpacity
                      key={food.id}
                      style={[
                        styles.resultItem,
                        idx > 0 && styles.resultItemBorder,
                      ]}
                      onPress={() => addIngredient(food)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName} numberOfLines={1}>
                          {food.name}
                        </Text>
                        <Text style={styles.resultMeta} numberOfLines={1}>
                          {food.brand ? `${food.brand} · ` : ""}
                          {Number(food.servingSizeG)}g serving
                        </Text>
                      </View>
                      <Text style={styles.resultPlus}>+</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!searching && query.length >= 2 && results.length === 0 && (
                <Text style={styles.emptyHint}>
                  No foods found for &ldquo;{query}&rdquo;
                </Text>
              )}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.replace("/recipes")}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || !name.trim() || ingredients.length === 0) &&
              styles.saveBtnDisabled,
          ]}
          onPress={save}
          disabled={saving || !name.trim() || ingredients.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {mode === "create" ? "Create Recipe" : "Save Changes"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MacroCell({
  value,
  label,
  color,
  bg,
}: {
  value: string | number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.macroCell, { backgroundColor: bg }]}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8faf9" },

  header: {
    backgroundColor: "#064e3b",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "#a7f3d0", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },

  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  previewSub: { fontSize: 11, color: "#94a3b8" },
  macroGrid: { flexDirection: "row", gap: 6 },
  macroCell: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  macroValue: { fontSize: 15, fontWeight: "800" },
  macroLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },

  emptyHint: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 14,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 6,
  },
  ingredientName: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  ingredientSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  qtyInput: {
    width: 64,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 14,
    color: "#0f172a",
    textAlign: "right",
    backgroundColor: "#f8fafc",
  },
  qtyUnit: { fontSize: 11, color: "#94a3b8" },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 14, color: "#cbd5e1", fontWeight: "700" },

  searchBlock: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  searchInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  resultsList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 10,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultItemBorder: { borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  resultName: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  resultMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  resultPlus: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 8,
  },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#b91c1c", fontSize: 13 },

  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#475569", fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
