import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
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
  date?: string;
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

// ── Circular Progress Ring (pure Views, no SVG needed) ──────────
function CircularProgress({
  size,
  strokeWidth,
  progress,
  trackColor,
  fillColor,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number; // 0–1
  trackColor: string;
  fillColor: string;
  children?: React.ReactNode;
}) {
  const radius = size / 2;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const angle = clampedProgress * 360;

  return (
    <View style={{ width: size, height: size }}>
      {/* Track (background ring) */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />

      {/* Fill — right half (0–180°) */}
      {angle > 0 && (
        <View
          style={{
            position: "absolute",
            width: size / 2,
            height: size,
            left: size / 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              borderLeftColor: "transparent",
              borderBottomColor: "transparent",
              left: -(size / 2),
              transform: [
                { rotate: `${Math.min(angle, 180) + 45}deg` },
              ],
            }}
          />
        </View>
      )}

      {/* Fill — left half (180–360°) */}
      {angle > 180 && (
        <View
          style={{
            position: "absolute",
            width: size / 2,
            height: size,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              borderRightColor: "transparent",
              borderTopColor: "transparent",
              transform: [
                { rotate: `${angle - 180 + 45}deg` },
              ],
            }}
          />
        </View>
      )}

      {/* Center content */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ── Mini circular ring for macros ───────────────────────────────
function MacroRing({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={styles.macroChip}>
      <CircularProgress
        size={64}
        strokeWidth={5}
        progress={pct}
        trackColor="#f1f5f9"
        fillColor={color}
      >
        <Text style={[styles.macroRingValue, { color }]}>
          {Math.round(current)}
        </Text>
      </CircularProgress>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroTarget}>
        {Math.round(current)}g / {target}g
      </Text>
    </View>
  );
}

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
  const totals = dailyLog?.totals || {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── Textured Gradient Header ─────────────────────── */}
      <View style={styles.heroHeader}>
        {/* Subtle texture overlay dots */}
        <View style={styles.heroTexture} />

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
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* ── Calorie Ring ─────────────────────────────── */}
        <View style={styles.heroCalories}>
          <CircularProgress
            size={160}
            strokeWidth={10}
            progress={calorieProgress}
            trackColor="rgba(255,255,255,0.12)"
            fillColor={calorieProgress > 1 ? "#fca5a5" : "#6ee7b7"}
          >
            <Text style={styles.heroCalCount}>{totals.calories}</Text>
            <Text style={styles.heroCalLabel}>kcal</Text>
          </CircularProgress>
          <Text style={styles.heroRemaining}>
            {caloriesRemaining} of {calorieGoal} remaining
          </Text>
        </View>
      </View>

      {/* ── Macro Rings ──────────────────────────────────── */}
      <View style={styles.macroRow}>
        <MacroRing
          label="Protein"
          current={totals.proteinG}
          target={targets?.proteinG || 150}
          color="#3b82f6"
        />
        <MacroRing
          label="Carbs"
          current={totals.carbsG}
          target={targets?.carbsG || 200}
          color="#f59e0b"
        />
        <MacroRing
          label="Fat"
          current={totals.fatG}
          target={targets?.fatG || 65}
          color="#ef4444"
        />
      </View>

      {/* ── Meal Slots ───────────────────────────────────── */}
      {MEAL_SLOTS.map(({ key, label, emoji }) => {
        const items = dailyLog?.meals?.[key] || [];
        const slotCals = items.reduce((s, i) => s + i.calories, 0);
        const hasItems = items.length > 0;

        const handleSaveAsMeal = () => {
          const logDate: string =
            dailyLog?.date || new Date().toISOString().slice(0, 10);

          const doSave = async (name: string) => {
            const trimmed = (name || "").trim();
            if (!trimmed) return;
            try {
              await api.post("/meals/from-log", {
                name: trimmed,
                logDate,
                mealSlot: key,
              });
              Alert.alert("Saved", `"${trimmed}" is now in My Meals.`);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to save meal.");
            }
          };

          if (Platform.OS === "ios") {
            // @ts-ignore — Alert.prompt is iOS only
            Alert.prompt(
              "Save as Meal",
              `Name this ${label.toLowerCase()} so you can re-log it later.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Save", onPress: (text?: string) => doSave(text || "") },
              ],
              "plain-text",
              `${label} ${new Date(logDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`
            );
          } else {
            // Android fallback — auto-name with slot + date
            const auto = `${label} ${new Date(logDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`;
            Alert.alert(
              "Save as Meal",
              `Save this ${label.toLowerCase()} as "${auto}"?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Save", onPress: () => doSave(auto) },
              ]
            );
          }
        };

        return (
          <View key={key} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealEmoji}>{emoji}</Text>
              <Text style={styles.mealTitle}>{label}</Text>
              {slotCals > 0 && (
                <Text style={styles.mealCals}>{slotCals} kcal</Text>
              )}
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.foodItem}>
                <Text style={styles.foodName}>{item.foodName}</Text>
                <Text style={styles.foodCals}>{item.calories}</Text>
              </View>
            ))}
            <View style={styles.mealActionsRow}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  router.push({ pathname: "/add-food", params: { slot: key } })
                }
              >
                <Text style={styles.addButtonText}>+ Add Food</Text>
              </TouchableOpacity>
              {hasItems && (
                <TouchableOpacity
                  style={styles.saveAsMealButton}
                  onPress={handleSaveAsMeal}
                >
                  <Text style={styles.saveAsMealText}>Save as meal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* ── Recipes Quick Link ───────────────────────────── */}
      <View style={styles.recipesRow}>
        <TouchableOpacity
          style={styles.recipesLink}
          onPress={() => router.push("/recipes")}
        >
          <Text style={styles.recipesLinkIcon}>📖</Text>
          <Text style={styles.recipesLinkText}>My Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.recipesLinkAlt}
          onPress={() => router.push("/recipes/new")}
        >
          <Text style={styles.recipesLinkAltText}>+ New Recipe</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf9",
  },

  // ── Hero header (textured emerald) ─────────────────────
  heroHeader: {
    backgroundColor: "#064e3b",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Layered shadows create a subtle depth/texture effect
    backgroundColor: "transparent",
    borderWidth: 0,
    // Inner glow from top-left
    shadowColor: "#10b981",
    shadowOffset: { width: -40, height: -30 },
    shadowOpacity: 0.15,
    shadowRadius: 60,
    // Additional visual interest with border
    borderTopWidth: 100,
    borderTopColor: "rgba(16, 185, 129, 0.06)",
    borderRightWidth: 200,
    borderRightColor: "rgba(6, 78, 59, 0.3)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    zIndex: 1,
  },
  heroGreeting: { fontSize: 14, fontWeight: "500", color: "#6ee7b7" },
  heroName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 2,
  },
  heroDateBox: { alignItems: "flex-end" },
  heroDay: { fontSize: 12, color: "#6ee7b7", opacity: 0.7 },
  heroDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d1fae5",
    marginTop: 1,
  },
  heroCalories: { alignItems: "center", zIndex: 1 },
  heroCalCount: { fontSize: 36, fontWeight: "800", color: "#ffffff" },
  heroCalLabel: { fontSize: 13, color: "#a7f3d0", marginTop: -4 },
  heroRemaining: { fontSize: 13, color: "#a7f3d0", marginTop: 12 },

  // ── Macro rings ────────────────────────────────────────
  macroRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  macroChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#064e3b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  macroRingValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 8,
  },
  macroTarget: { fontSize: 10, color: "#94a3b8", marginTop: 2 },

  // ── Meal cards ─────────────────────────────────────────
  mealCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#064e3b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mealEmoji: { fontSize: 20, marginRight: 8 },
  mealTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  mealCals: { fontSize: 14, color: "#475569" },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  foodName: { fontSize: 15, color: "#404040", flex: 1 },
  foodCals: { fontSize: 15, color: "#475569" },
  addButton: { paddingVertical: 10, alignItems: "center", marginTop: 4, flex: 1 },
  addButtonText: { color: "#059669", fontSize: 15, fontWeight: "600" },
  mealActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  saveAsMealButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  saveAsMealText: { color: "#475569", fontSize: 13, fontWeight: "600" },

  // ── Recipes quick link row ─────────────────────────────
  recipesRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  recipesLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: "#064e3b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recipesLinkIcon: { fontSize: 18 },
  recipesLinkText: { color: "#0f172a", fontSize: 15, fontWeight: "600" },
  recipesLinkAlt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    borderRadius: 16,
    paddingVertical: 14,
  },
  recipesLinkAltText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
