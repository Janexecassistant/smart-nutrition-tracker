import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../src/lib/api";

interface Suggestion {
  foodId: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fitScore: number;
  reason: string;
}

interface SuggestionsResponse {
  remaining: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  suggestions: Suggestion[];
}

const MEAL_OPTIONS = [
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

export default function SuggestionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [mealSlot, setMealSlot] = useState("lunch");

  const { data, isLoading, error } = useQuery({
    queryKey: ["suggestions", mealSlot],
    queryFn: () =>
      api.get<SuggestionsResponse>("/suggestions", { mealSlot }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    setRefreshing(false);
  }, []);

  const remaining = data?.remaining || {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
  const suggestions = data?.suggestions || [];

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={s.title}>What should I eat?</Text>
      <Text style={s.sub}>Based on your remaining targets today.</Text>

      {/* Meal slot picker */}
      <View style={s.pillRow}>
        {MEAL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[s.pill, mealSlot === opt.key && s.pillActive]}
            onPress={() => setMealSlot(opt.key)}
          >
            <Text
              style={[
                s.pillText,
                mealSlot === opt.key && s.pillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Remaining targets */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Still needed today</Text>
        <View style={s.row}>
          <View style={s.item}>
            <Text style={s.val}>
              {remaining.calories.toLocaleString()}
            </Text>
            <Text style={s.lbl}>cal</Text>
          </View>
          <View style={s.item}>
            <Text style={[s.val, { color: "#3b82f6" }]}>
              {Math.round(remaining.proteinG)}g
            </Text>
            <Text style={s.lbl}>protein</Text>
          </View>
          <View style={s.item}>
            <Text style={[s.val, { color: "#f59e0b" }]}>
              {Math.round(remaining.carbsG)}g
            </Text>
            <Text style={s.lbl}>carbs</Text>
          </View>
          <View style={s.item}>
            <Text style={[s.val, { color: "#ef4444" }]}>
              {Math.round(remaining.fatG)}g
            </Text>
            <Text style={s.lbl}>fat</Text>
          </View>
        </View>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={s.loadingBox}>
          <ActivityIndicator color="#059669" />
          <Text style={s.loadingText}>Finding suggestions...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>
            Couldn't load suggestions right now.
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={s.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions list */}
      {!isLoading && suggestions.length === 0 && !error && (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>
            No suggestions yet. Log some food first so we can see what you
            still need!
          </Text>
        </View>
      )}

      {suggestions.map((sg, i) => (
        <TouchableOpacity
          key={sg.foodId || i}
          style={s.sgCard}
          onPress={() =>
            router.push({
              pathname: "/add-food",
              params: { slot: mealSlot, prefillFoodId: sg.foodId },
            })
          }
        >
          <View style={s.sgHeader}>
            <Text style={s.sgName} numberOfLines={1}>
              {sg.foodName}
            </Text>
            <View style={s.fitBadge}>
              <Text style={s.fitText}>
                {Math.round(sg.fitScore)}% fit
              </Text>
            </View>
          </View>
          <Text style={s.sgReason}>{sg.reason}</Text>
          <View style={s.sgMacros}>
            <Text style={s.sgCal}>{sg.calories} cal</Text>
            <Text style={s.sgMacro}>P {Math.round(sg.proteinG)}g</Text>
            <Text style={s.sgMacro}>C {Math.round(sg.carbsG)}g</Text>
            <Text style={s.sgMacro}>F {Math.round(sg.fatG)}g</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8faf9" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    paddingTop: 8,
  },
  sub: { fontSize: 14, color: "#475569", marginTop: 4, marginBottom: 16 },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pillActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  pillText: { fontSize: 14, fontWeight: "500", color: "#475569" },
  pillTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#064e3b",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center" },
  val: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  lbl: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#475569",
    marginTop: 8,
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  retryText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 12,
  },
  sgCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#064e3b",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sgName: { fontSize: 16, fontWeight: "600", color: "#0f172a", flex: 1 },
  fitBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  fitText: { fontSize: 12, fontWeight: "600", color: "#059669" },
  sgReason: { fontSize: 13, color: "#475569", marginBottom: 8 },
  sgMacros: { flexDirection: "row", gap: 12 },
  sgCal: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  sgMacro: { fontSize: 12, color: "#94a3b8" },
});
