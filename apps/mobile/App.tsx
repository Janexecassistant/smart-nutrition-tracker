import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
} from "react-native";

// ── Main App ────────────────────────────────────────────────────
type Screen = "dashboard" | "log" | "suggestions" | "progress" | "profile";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {screen === "dashboard" && <DashboardScreen onLog={() => setScreen("log")} />}
      {screen === "log" && <LogFoodScreen onClose={() => setScreen("dashboard")} />}
      {screen === "suggestions" && <SuggestionsScreen />}
      {screen === "progress" && <ProgressScreen />}
      {screen === "profile" && <ProfileScreen />}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton label="Home" icon="🏠" active={screen === "dashboard"} onPress={() => setScreen("dashboard")} />
        <TabButton label="Suggest" icon="💡" active={screen === "suggestions"} onPress={() => setScreen("suggestions")} />
        <TabButton label="Progress" icon="📊" active={screen === "progress"} onPress={() => setScreen("progress")} />
        <TabButton label="Profile" icon="👤" active={screen === "profile"} onPress={() => setScreen("profile")} />
      </View>
    </SafeAreaView>
  );
}

// ── Tab Button ──────────────────────────────────────────────────
function TabButton({ label, icon, active, onPress }: {
  label: string; icon: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// ── Dashboard ───────────────────────────────────────────────────
function DashboardScreen({ onLog }: { onLog: () => void }) {
  const calories = { consumed: 820, target: 2100 };
  const macros = {
    protein: { consumed: 62, target: 150 },
    carbs: { consumed: 95, target: 210 },
    fat: { consumed: 28, target: 70 },
  };

  const pct = Math.round((calories.consumed / calories.target) * 100);
  const remaining = calories.target - calories.consumed;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.dateText}>Tuesday, April 1</Text>
        </View>
      </View>

      {/* Calorie Ring Card */}
      <View style={styles.calorieCard}>
        <View style={styles.ringContainer}>
          <View style={[styles.ringOuter, { borderColor: "rgba(34,197,94," + Math.max(0.15, pct/100) + ")" }]}>
            <Text style={styles.calorieNumber}>{calories.consumed}</Text>
            <Text style={styles.calorieUnit}>cal consumed</Text>
          </View>
        </View>
        <View style={styles.calorieStats}>
          <View style={styles.calorieStat}>
            <Text style={styles.statValue}>{calories.target}</Text>
            <Text style={styles.statLabel}>Target</Text>
          </View>
          <View style={[styles.calorieStat, styles.statBorder]}>
            <Text style={[styles.statValue, { color: "#059669" }]}>{remaining}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Macro Bars */}
      <View style={styles.macroCard}>
        <Text style={styles.sectionTitle}>Macros</Text>
        <View style={styles.macroRow}>
          <MacroBar label="Protein" consumed={macros.protein.consumed} target={macros.protein.target} color="#3b82f6" />
          <MacroBar label="Carbs" consumed={macros.carbs.consumed} target={macros.carbs.target} color="#f59e0b" />
          <MacroBar label="Fat" consumed={macros.fat.consumed} target={macros.fat.target} color="#ef4444" />
        </View>
      </View>

      {/* Meal Slots */}
      <MealSlot name="Breakfast" calories={320} items={["Oatmeal with banana", "Greek yogurt"]} />
      <MealSlot name="Lunch" calories={500} items={["Chicken breast", "Brown rice", "Mixed greens"]} />
      <MealSlot name="Dinner" calories={0} items={[]} onAdd={onLog} />
      <MealSlot name="Snack" calories={0} items={[]} onAdd={onLog} />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Macro Bar ───────────────────────────────────────────────────
function MacroBar({ label, consumed, target, color }: {
  label: string; consumed: number; target: number; color: string;
}) {
  const pct = Math.min(100, target > 0 ? (consumed / target) * 100 : 0);
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroLabelRow}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: pct + "%", backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{consumed}g / {target}g</Text>
    </View>
  );
}

// ── Meal Slot ───────────────────────────────────────────────────
function MealSlot({ name, calories, items, onAdd }: {
  name: string; calories: number; items: string[]; onAdd?: () => void;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealTitle}>{name}</Text>
          {calories > 0 && <Text style={styles.mealCal}>{calories} cal</Text>}
        </View>
        <Pressable style={styles.addBtn} onPress={onAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>
      {items.length > 0 ? (
        items.map((item, i) => (
          <Text key={i} style={styles.mealItem}>• {item}</Text>
        ))
      ) : (
        <Text style={styles.emptyText}>Tap + to log food</Text>
      )}
    </View>
  );
}

// ── Log Food Screen ─────────────────────────────────────────────
function LogFoodScreen({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");

  const results = [
    { name: "Chicken Breast (grilled)", cal: 165, protein: 31, brand: "Generic" },
    { name: "Salmon Fillet", cal: 208, protein: 20, brand: "Generic" },
    { name: "Brown Rice (1 cup)", cal: 216, protein: 5, brand: "Generic" },
    { name: "Greek Yogurt", cal: 100, protein: 17, brand: "Fage" },
    { name: "Banana (medium)", cal: 105, protein: 1.3, brand: "Fresh" },
    { name: "Eggs (2 large)", cal: 143, protein: 13, brand: "Generic" },
    { name: "Avocado (half)", cal: 120, protein: 1.5, brand: "Fresh" },
    { name: "Sweet Potato (medium)", cal: 103, protein: 2.3, brand: "Fresh" },
  ].filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.logHeader}>
        <Pressable onPress={onClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </Pressable>
        <Text style={styles.logTitle}>Log Food</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn}>
          <Text style={styles.quickIcon}>📷</Text>
          <Text style={styles.quickLabel}>Scan</Text>
        </Pressable>
        <Pressable style={styles.quickBtn}>
          <Text style={styles.quickIcon}>⭐</Text>
          <Text style={styles.quickLabel}>Favorites</Text>
        </Pressable>
        <Pressable style={styles.quickBtn}>
          <Text style={styles.quickIcon}>🕐</Text>
          <Text style={styles.quickLabel}>Recent</Text>
        </Pressable>
        <Pressable style={styles.quickBtn}>
          <Text style={styles.quickIcon}>📝</Text>
          <Text style={styles.quickLabel}>Custom</Text>
        </Pressable>
      </View>

      {/* Results */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {results.map((food, i) => (
          <Pressable key={i} style={styles.foodResult}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodBrand}>{food.brand}</Text>
            </View>
            <View style={styles.foodMacros}>
              <Text style={styles.foodCal}>{food.cal} cal</Text>
              <Text style={styles.foodProtein}>{food.protein}g protein</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Suggestions Screen ──────────────────────────────────────────
function SuggestionsScreen() {
  const suggestions = [
    { name: "Grilled Chicken + Rice", cal: 450, fit: 94, reason: "Hits your protein target" },
    { name: "Salmon + Sweet Potato", cal: 380, fit: 89, reason: "Great omega-3 source" },
    { name: "Turkey Wrap + Apple", cal: 420, fit: 86, reason: "Balanced macros" },
  ];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>What should I eat?</Text>
      <Text style={styles.screenSub}>Based on what you've eaten today and your remaining targets.</Text>

      <View style={styles.remainingCard}>
        <Text style={styles.remainingTitle}>Still needed today</Text>
        <View style={styles.remainingRow}>
          <View style={styles.remainingItem}>
            <Text style={styles.remainingValue}>1,280</Text>
            <Text style={styles.remainingLabel}>cal</Text>
          </View>
          <View style={styles.remainingItem}>
            <Text style={[styles.remainingValue, { color: "#3b82f6" }]}>88g</Text>
            <Text style={styles.remainingLabel}>protein</Text>
          </View>
          <View style={styles.remainingItem}>
            <Text style={[styles.remainingValue, { color: "#f59e0b" }]}>115g</Text>
            <Text style={styles.remainingLabel}>carbs</Text>
          </View>
          <View style={styles.remainingItem}>
            <Text style={[styles.remainingValue, { color: "#ef4444" }]}>42g</Text>
            <Text style={styles.remainingLabel}>fat</Text>
          </View>
        </View>
      </View>

      {suggestions.map((s, i) => (
        <View key={i} style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionName}>{s.name}</Text>
            <View style={styles.fitBadge}>
              <Text style={styles.fitText}>{s.fit}% fit</Text>
            </View>
          </View>
          <Text style={styles.suggestionReason}>{s.reason}</Text>
          <Text style={styles.suggestionCal}>{s.cal} calories</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Progress Screen ─────────────────────────────────────────────
function ProgressScreen() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const adherence = [92, 88, 95, 78, 100, 85, 0]; // 0 = today incomplete

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Your Progress</Text>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Weight Trend</Text>
        <View style={styles.weightRow}>
          <Text style={styles.weightCurrent}>185.2</Text>
          <Text style={styles.weightUnit}>lbs</Text>
          <View style={styles.weightDelta}>
            <Text style={styles.weightDeltaText}>↓ 2.3 lbs</Text>
          </View>
        </View>
        <Text style={styles.weightSub}>Since March 1</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Weekly Adherence</Text>
        <View style={styles.adherenceRow}>
          {days.map((day, i) => (
            <View key={day} style={styles.adherenceDay}>
              <View style={styles.adherenceBarBg}>
                <View style={[
                  styles.adherenceBarFill,
                  {
                    height: adherence[i] + "%",
                    backgroundColor: adherence[i] >= 90 ? "#059669" : adherence[i] >= 70 ? "#f59e0b" : "#e5e5e5",
                  },
                ]} />
              </View>
              <Text style={styles.adherenceDayLabel}>{day}</Text>
              {adherence[i] > 0 && (
                <Text style={styles.adherencePct}>{adherence[i]}%</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>6</Text>
            <Text style={styles.streakLabel}>Day logging streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>4</Text>
            <Text style={styles.streakLabel}>Days hitting protein</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Profile Screen ──────────────────────────────────────────────
function ProfileScreen() {
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>J</Text>
        </View>
        <Text style={styles.profileName}>Jay</Text>
        <Text style={styles.profileGoal}>Goal: Lose weight</Text>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        <ProfileRow label="Calories" value="2,100 cal" />
        <ProfileRow label="Protein" value="150g" />
        <ProfileRow label="Carbs" value="210g" />
        <ProfileRow label="Fat" value="70g" />
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Body Stats</Text>
        <ProfileRow label="Height" value={'5\'10"'} />
        <ProfileRow label="Weight" value="185.2 lbs" />
        <ProfileRow label="Activity" value="Moderately Active" />
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <ProfileRow label="Diet" value="High Protein" />
        <ProfileRow label="Allergies" value="None" />
        <ProfileRow label="Units" value="Imperial" />
      </View>
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8faf9" },
  screen: { flex: 1, padding: 16, backgroundColor: "#f8faf9" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 8 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  dateText: { fontSize: 13, color: "#475569", marginTop: 2 },

  // Calorie Card
  calorieCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  ringContainer: { alignItems: "center", marginBottom: 20 },
  ringOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: "center", justifyContent: "center" },
  calorieNumber: { fontSize: 36, fontWeight: "bold", color: "#059669" },
  calorieUnit: { fontSize: 12, color: "#475569" },
  calorieStats: { flexDirection: "row", justifyContent: "center" },
  calorieStat: { alignItems: "center", paddingHorizontal: 24 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },

  // Macros
  macroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginBottom: 12 },
  macroRow: { flexDirection: "row", gap: 12 },
  macroItem: { flex: 1 },
  macroLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  macroLabel: { fontSize: 12, color: "#525252" },
  macroBarBg: { height: 8, backgroundColor: "#f5f5f5", borderRadius: 4, overflow: "hidden" },
  macroBarFill: { height: "100%", borderRadius: 4 },
  macroValue: { fontSize: 11, color: "#475569", marginTop: 4 },

  // Meal Cards
  mealCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  mealCal: { fontSize: 12, color: "#475569", marginTop: 2 },
  mealItem: { fontSize: 14, color: "#525252", marginBottom: 4, paddingLeft: 4 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  addBtnText: { fontSize: 18, color: "#059669", fontWeight: "600" },
  emptyText: { fontSize: 13, color: "#d4d4d4" },

  // Tab Bar
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingBottom: 20, paddingTop: 8 },
  tab: { flex: 1, alignItems: "center" },
  tabLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  tabLabelActive: { color: "#059669", fontWeight: "600" },

  // Log Food
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, marginBottom: 16 },
  closeBtn: { fontSize: 22, color: "#475569", padding: 4 },
  logTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  searchContainer: { marginBottom: 16 },
  searchInput: { backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#0f172a" },
  quickActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, color: "#475569", marginTop: 4 },
  foodResult: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: "500", color: "#0f172a" },
  foodBrand: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  foodMacros: { alignItems: "flex-end" },
  foodCal: { fontSize: 14, fontWeight: "600", color: "#059669" },
  foodProtein: { fontSize: 11, color: "#3b82f6", marginTop: 2 },

  // Suggestions
  screenTitle: { fontSize: 24, fontWeight: "bold", color: "#0f172a", paddingTop: 8 },
  screenSub: { fontSize: 14, color: "#475569", marginTop: 4, marginBottom: 20 },
  remainingCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  remainingTitle: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 12 },
  remainingRow: { flexDirection: "row", justifyContent: "space-between" },
  remainingItem: { alignItems: "center" },
  remainingValue: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  remainingLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  suggestionCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  suggestionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  suggestionName: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  fitBadge: { backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  fitText: { fontSize: 12, fontWeight: "600", color: "#059669" },
  suggestionReason: { fontSize: 13, color: "#475569", marginBottom: 4 },
  suggestionCal: { fontSize: 12, color: "#94a3b8" },

  // Progress
  progressCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  weightRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  weightCurrent: { fontSize: 36, fontWeight: "bold", color: "#0f172a" },
  weightUnit: { fontSize: 16, color: "#475569", marginLeft: 4 },
  weightDelta: { backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 12 },
  weightDeltaText: { fontSize: 13, fontWeight: "600", color: "#059669" },
  weightSub: { fontSize: 12, color: "#94a3b8" },
  adherenceRow: { flexDirection: "row", justifyContent: "space-between", height: 120 },
  adherenceDay: { alignItems: "center", flex: 1 },
  adherenceBarBg: { flex: 1, width: 20, backgroundColor: "#f5f5f5", borderRadius: 10, overflow: "hidden", justifyContent: "flex-end", marginBottom: 6 },
  adherenceBarFill: { width: "100%", borderRadius: 10 },
  adherenceDayLabel: { fontSize: 11, color: "#475569" },
  adherencePct: { fontSize: 9, color: "#94a3b8", marginTop: 2 },
  streakRow: { flexDirection: "row", gap: 12 },
  streakItem: { flex: 1, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, alignItems: "center" },
  streakNumber: { fontSize: 28, fontWeight: "bold", color: "#059669" },
  streakLabel: { fontSize: 11, color: "#525252", textAlign: "center", marginTop: 4 },

  // Profile
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  profileName: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  profileGoal: { fontSize: 14, color: "#475569", marginTop: 4 },
  profileCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  profileRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  profileLabel: { fontSize: 14, color: "#475569" },
  profileValue: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
});
