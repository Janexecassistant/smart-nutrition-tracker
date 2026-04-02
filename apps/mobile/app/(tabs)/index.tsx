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

interface MealItem {
  id: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface DailyLog {
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
    snack: MealItem[];
  };
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

interface Profile {
  targets: {
    caloriesTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  displayName?: string;
}

const MEAL_SLOTS = [
  { key: "breakfast" as const, label: "Breakfast", emoji: "🌅" },
  { key: "lunch" as const, label: "Lunch", emoji: "☀️" },
  { key: "dinner" as const, label: "Dinner", emoji: "🌙" },
  { key: "snack" as const, label: "Snack", emoji: "🍎" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profile"),
  });

  const { data: dailyLog, isLoading: logLoading } = useQuery({
    queryKey: ["logs", "today"],
    queryFn: () => api.get<DailyLog>("/logs/today"),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    setRefreshing(false);
  }, []);

  const targets = profile?.targets;
  const totals = dailyLog?.totals || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const calorieGoal = targets?.caloriesTarget || 2000;
  const calorieProgress = Math.min(totals.calories / calorieGoal, 1);
  const caloriesRemaining = Math.max(calorieGoal - totals.calories, 0);

  if (profileLoading && logLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Gradient Header ────────────────────────────── */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>{greeting()}</Text>
            <Text style={styles.heroName}>
              {profile?.displayName?.split(" ")[0] || "Dashboard"}
            </Text>
          </View>
          <View style={styles.heroDateBox}>
            <Text style={styles.heroDay}>
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </Text>
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Calorie ring in header */}
        <View style={styles.heroCalories}>
          <Text style={styles.heroCalCount}>{totals.calories}</Text>
          <Text style={styles.heroCalLabel}>of {calorieGoal} kcal</Text>
          <View style={styles.heroBar}>
            <View
              style={[
                styles.heroBarFill,
                {
                  width: `${calorieProgress * 100}%`,
                  backgroundColor: calorieProgress > 1 ? "#fca5a5" : "#6ee7b7",
                },
              ]}
            />
          </View>
          <Text style={styles.heroRemaining}>
            {caloriesRemaining} kcal remaining
          </Text>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.macroRow}>
        <MacroChip label="Protein" current={totals.proteinG} target={targets?.proteinG || 150} color="#3b82f6" />
        <MacroChip label="Carbs" current={totals.carbsG} target={targets?.carbsG || 200} color="#f59e0b" />
        <MacroChip label="Fat" current={totals.fatG} target={targets?.fatG || 65} color="#ef4444" />
      </View>

      {/* Meal Slots */}
      {MEAL_SLOTS.map(({ key, label, emoji }) => {
        const items = dailyLog?.meals?.[key] || [];
        const slotCals = items.reduce((s, i) => s + i.calories, 0);
        return (
          <View key={key} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealEmoji}>{emoji}</Text>
              <Text style={styles.mealTitle}>{label}</Text>
              {slotCals > 0 && <Text style={styles.mealCals}>{slotCals} kcal</Text>}
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.foodItem}>
                <Text style={styles.foodName}>{item.foodName}</Text>
                <Text style={styles.foodCals}>{item.calories}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push({ pathname: "/add-food", params: { slot: key } })}
            >
              <Text style={styles.addButtonText}>+ Add Food</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function MacroChip({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={styles.macroChip}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{Math.round(current)}g</Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroTarget}>/ {target}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8faf9" },

  // ── Hero header (dark emerald) ──────────────────────
  heroHeader: {
    backgroundColor: "#064e3b",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroGreeting: { fontSize: 14, fontWeight: "500", color: "#6ee7b7" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#ffffff", marginTop: 2 },
  heroDateBox: { alignItems: "flex-end" },
  heroDay: { fontSize: 12, color: "#6ee7b7", opacity: 0.7 },
  heroDate: { fontSize: 14, fontWeight: "600", color: "#d1fae5", marginTop: 1 },
  heroCalories: { alignItems: "center" },
  heroCalCount: { fontSize: 44, fontWeight: "800", color: "#ffffff" },
  heroCalLabel: { fontSize: 14, color: "#a7f3d0", marginTop: -2 },
  heroBar: {
    width: "80%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 12,
  },
  heroBarFill: { height: 6, borderRadius: 3 },
  heroRemaining: { fontSize: 13, color: "#a7f3d0", marginTop: 8 },
  macroRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 16, gap: 10 },
  macroChip: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center",
    shadowColor: "#064e3b", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  macroLabel: { fontSize: 12, color: "#475569", marginBottom: 4 },
  macroValue: { fontSize: 18, fontWeight: "700" },
  macroBar: { width: "100%", height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, marginTop: 6, overflow: "hidden" },
  macroBarFill: { height: 4, borderRadius: 2 },
  macroTarget: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  mealCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: "#fff", borderRadius: 14,
    padding: 16, shadowColor: "#064e3b", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  mealEmoji: { fontSize: 20, marginRight: 8 },
  mealTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a", flex: 1 },
  mealCals: { fontSize: 14, color: "#475569" },
  foodItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#f1f5f9" },
  foodName: { fontSize: 15, color: "#404040", flex: 1 },
  foodCals: { fontSize: 15, color: "#475569" },
  addButton: { paddingVertical: 10, alignItems: "center", marginTop: 4 },
  addButtonText: { color: "#059669", fontSize: 15, fontWeight: "600" },
});
