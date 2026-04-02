import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function ProgressScreen() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const adherence = [92, 88, 95, 78, 100, 85, 0];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Your Progress</Text>

      <View style={s.card}>
        <Text style={s.section}>Weight Trend</Text>
        <View style={s.weightRow}>
          <Text style={s.weightNum}>185.2</Text>
          <Text style={s.weightUnit}>lbs</Text>
          <View style={s.delta}><Text style={s.deltaText}>-2.3 lbs</Text></View>
        </View>
        <Text style={s.weightSub}>Since March 1</Text>
      </View>

      <View style={s.card}>
        <Text style={s.section}>Weekly Adherence</Text>
        <View style={s.adherenceRow}>
          {days.map((day, i) => (
            <View key={day} style={s.adherenceDay}>
              <View style={s.adherenceBarBg}>
                <View style={[s.adherenceBarFill, {
                  height: adherence[i] + "%",
                  backgroundColor: adherence[i] >= 90 ? "#22c55e" : adherence[i] >= 70 ? "#f59e0b" : "#e5e5e5",
                }]} />
              </View>
              <Text style={s.dayLabel}>{day}</Text>
              {adherence[i] > 0 && <Text style={s.pctLabel}>{adherence[i]}%</Text>}
            </View>
          ))}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.section}>Streaks</Text>
        <View style={s.streakRow}>
          <View style={s.streakItem}>
            <Text style={s.streakNum}>6</Text>
            <Text style={s.streakLabel}>Day logging streak</Text>
          </View>
          <View style={s.streakItem}>
            <Text style={s.streakNum}>4</Text>
            <Text style={s.streakLabel}>Days hitting protein</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  title: { fontSize: 24, fontWeight: "bold", color: "#171717", paddingTop: 8, marginBottom: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  section: { fontSize: 15, fontWeight: "600", color: "#171717", marginBottom: 12 },
  weightRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  weightNum: { fontSize: 36, fontWeight: "bold", color: "#171717" },
  weightUnit: { fontSize: 16, color: "#737373", marginLeft: 4 },
  delta: { backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 12 },
  deltaText: { fontSize: 13, fontWeight: "600", color: "#22c55e" },
  weightSub: { fontSize: 12, color: "#a3a3a3" },
  adherenceRow: { flexDirection: "row", justifyContent: "space-between", height: 120 },
  adherenceDay: { alignItems: "center", flex: 1 },
  adherenceBarBg: { flex: 1, width: 20, backgroundColor: "#f5f5f5", borderRadius: 10, overflow: "hidden", justifyContent: "flex-end", marginBottom: 6 },
  adherenceBarFill: { width: "100%", borderRadius: 10 },
  dayLabel: { fontSize: 11, color: "#737373" },
  pctLabel: { fontSize: 9, color: "#a3a3a3", marginTop: 2 },
  streakRow: { flexDirection: "row", gap: 12 },
  streakItem: { flex: 1, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, alignItems: "center" },
  streakNum: { fontSize: 28, fontWeight: "bold", color: "#22c55e" },
  streakLabel: { fontSize: 11, color: "#525252", textAlign: "center", marginTop: 4 },
});
