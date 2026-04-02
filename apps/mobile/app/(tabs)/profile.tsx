import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>J</Text></View>
        <Text style={s.name}>Jay</Text>
        <Text style={s.goal}>Goal: Lose weight</Text>
      </View>

      <View style={s.card}>
        <Text style={s.section}>Daily Targets</Text>
        <Row label="Calories" value="2,100 cal" />
        <Row label="Protein" value="150g" />
        <Row label="Carbs" value="210g" />
        <Row label="Fat" value="70g" />
      </View>

      <View style={s.card}>
        <Text style={s.section}>Body Stats</Text>
        <Row label="Height" value={'5\'10"'} />
        <Row label="Weight" value="185.2 lbs" />
        <Row label="Activity" value="Moderately Active" />
      </View>

      <View style={s.card}>
        <Text style={s.section}>Preferences</Text>
        <Row label="Diet" value="High Protein" />
        <Row label="Allergies" value="None" />
        <Row label="Units" value="Imperial" />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  header: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#171717" },
  goal: { fontSize: 14, color: "#737373", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  section: { fontSize: 15, fontWeight: "600", color: "#171717", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  rowLabel: { fontSize: 14, color: "#737373" },
  rowValue: { fontSize: 14, fontWeight: "500", color: "#171717" },
});
