import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";

export default function DashboardScreen() {
  const calories = { consumed: 820, target: 2100 };
  const macros = {
    protein: { consumed: 62, target: 150 },
    carbs: { consumed: 95, target: 210 },
    fat: { consumed: 28, target: 70 },
  };
  const remaining = calories.target - calories.consumed;
  const pct = Math.round((calories.consumed / calories.target) * 100);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.greeting}>Good morning! 👋</Text>
        <Text style={s.date}>Tuesday, April 1</Text>
      </View>

      {/* Calorie Ring */}
      <View style={s.calorieCard}>
        <View style={s.ringContainer}>
          <View style={[s.ring, { borderColor: "rgba(34,197,94," + Math.max(0.15, pct / 100) + ")" }]}>
            <Text style={s.calNum}>{calories.consumed}</Text>
            <Text style={s.calUnit}>cal consumed</Text>
          </View>
        </View>
        <View style={s.calStats}>
          <View style={s.calStat}>
            <Text style={s.statVal}>{calories.target}</Text>
            <Text style={s.statLbl}>Target</Text>
          </View>
          <View style={[s.calStat, s.statBorder]}>
            <Text style={[s.statVal, { color: "#22c55e" }]}>{remaining}</Text>
            <Text style={s.statLbl}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Macros */}
      <View style={s.card}>
        <Text style={s.section}>Macros</Text>
        <View style={s.macroRow}>
          <MacroBar label="Protein" consumed={macros.protein.consumed} target={macros.protein.target} color="#3b82f6" />
          <MacroBar label="Carbs" consumed={macros.carbs.consumed} target={macros.carbs.target} color="#f59e0b" />
          <MacroBar label="Fat" consumed={macros.fat.consumed} target={macros.fat.target} color="#ef4444" />
        </View>
      </View>

      {/* Meals */}
      <MealSlot name="Breakfast" calories={320} items={["Oatmeal with banana", "Greek yogurt"]} />
      <MealSlot name="Lunch" calories={500} items={["Chicken breast", "Brown rice", "Mixed greens"]} />
      <MealSlot name="Dinner" calories={0} items={[]} />
      <MealSlot name="Snack" calories={0} items={[]} />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (consumed / target) * 100 : 0);
  return (
    <View style={s.macroItem}>
      <View style={s.macroLabelRow}>
        <View style={[s.dot, { backgroundColor: color }]} />
        <Text style={s.macroLabel}>{label}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: pct + "%", backgroundColor: color }]} />
      </View>
      <Text style={s.macroVal}>{consumed}g / {target}g</Text>
    </View>
  );
}

function MealSlot({ name, calories, items }: { name: string; calories: number; items: string[] }) {
  return (
    <View style={s.mealCard}>
      <View style={s.mealHeader}>
        <View>
          <Text style={s.mealTitle}>{name}</Text>
          {calories > 0 && <Text style={s.mealCal}>{calories} cal</Text>}
        </View>
        <View style={s.addBtn}>
          <Text style={s.addBtnText}>+</Text>
        </View>
      </View>
      {items.length > 0 ? items.map((item, i) => (
        <Text key={i} style={s.mealItem}>• {item}</Text>
      )) : (
        <Text style={s.empty}>Tap + to log food</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  header: { marginBottom: 20, paddingTop: 8 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#171717" },
  date: { fontSize: 13, color: "#737373", marginTop: 2 },
  calorieCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  ringContainer: { alignItems: "center", marginBottom: 20 },
  ring: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: "center", justifyContent: "center" },
  calNum: { fontSize: 36, fontWeight: "bold", color: "#22c55e" },
  calUnit: { fontSize: 12, color: "#737373" },
  calStats: { flexDirection: "row", justifyContent: "center" },
  calStat: { alignItems: "center", paddingHorizontal: 24 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  statVal: { fontSize: 20, fontWeight: "bold", color: "#171717" },
  statLbl: { fontSize: 11, color: "#a3a3a3", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  section: { fontSize: 15, fontWeight: "600", color: "#171717", marginBottom: 12 },
  macroRow: { flexDirection: "row", gap: 12 },
  macroItem: { flex: 1 },
  macroLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  macroLabel: { fontSize: 12, color: "#525252" },
  barBg: { height: 8, backgroundColor: "#f5f5f5", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  macroVal: { fontSize: 11, color: "#737373", marginTop: 4 },
  mealCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTitle: { fontSize: 16, fontWeight: "600", color: "#171717" },
  mealCal: { fontSize: 12, color: "#737373", marginTop: 2 },
  mealItem: { fontSize: 14, color: "#525252", marginBottom: 4, paddingLeft: 4 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  addBtnText: { fontSize: 18, color: "#22c55e", fontWeight: "600" },
  empty: { fontSize: 13, color: "#d4d4d4" },
});
