import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function SuggestionsScreen() {
  const suggestions = [
    { name: "Grilled Chicken + Rice", cal: 450, fit: 94, reason: "Hits your protein target" },
    { name: "Salmon + Sweet Potato", cal: 380, fit: 89, reason: "Great omega-3 source" },
    { name: "Turkey Wrap + Apple", cal: 420, fit: 86, reason: "Balanced macros" },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>What should I eat?</Text>
      <Text style={s.sub}>Based on your remaining targets today.</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Still needed today</Text>
        <View style={s.row}>
          <View style={s.item}><Text style={s.val}>1,280</Text><Text style={s.lbl}>cal</Text></View>
          <View style={s.item}><Text style={[s.val, { color: "#3b82f6" }]}>88g</Text><Text style={s.lbl}>protein</Text></View>
          <View style={s.item}><Text style={[s.val, { color: "#f59e0b" }]}>115g</Text><Text style={s.lbl}>carbs</Text></View>
          <View style={s.item}><Text style={[s.val, { color: "#ef4444" }]}>42g</Text><Text style={s.lbl}>fat</Text></View>
        </View>
      </View>

      {suggestions.map((sg, i) => (
        <View key={i} style={s.sgCard}>
          <View style={s.sgHeader}>
            <Text style={s.sgName}>{sg.name}</Text>
            <View style={s.fitBadge}><Text style={s.fitText}>{sg.fit}% fit</Text></View>
          </View>
          <Text style={s.sgReason}>{sg.reason}</Text>
          <Text style={s.sgCal}>{sg.cal} calories</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  title: { fontSize: 24, fontWeight: "bold", color: "#171717", paddingTop: 8 },
  sub: { fontSize: 14, color: "#737373", marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#737373", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center" },
  val: { fontSize: 20, fontWeight: "bold", color: "#171717" },
  lbl: { fontSize: 11, color: "#a3a3a3", marginTop: 2 },
  sgCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  sgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sgName: { fontSize: 16, fontWeight: "600", color: "#171717" },
  fitBadge: { backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  fitText: { fontSize: 12, fontWeight: "600", color: "#22c55e" },
  sgReason: { fontSize: 13, color: "#737373", marginBottom: 4 },
  sgCal: { fontSize: 12, color: "#a3a3a3" },
});
