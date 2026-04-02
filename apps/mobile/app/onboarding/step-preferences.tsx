import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";

const PREFS = [
  { key: "none", label: "No Preference" },
  { key: "high_protein", label: "High Protein" },
  { key: "low_carb", label: "Low Carb" },
  { key: "keto", label: "Keto" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "paleo", label: "Paleo" },
  { key: "gluten_free", label: "Gluten Free" },
  { key: "dairy_free", label: "Dairy Free" },
];

export default function StepPreferences() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const selected = data.dietaryPreferences;

  const toggle = (key: string) => {
    if (key === "none") {
      updateData({ dietaryPreferences: ["none"] });
      return;
    }

    let next = selected.filter((s) => s !== "none");
    if (next.includes(key)) {
      next = next.filter((s) => s !== key);
    } else {
      next.push(key);
    }
    if (next.length === 0) next = ["none"];
    updateData({ dietaryPreferences: next });
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.step}>Step 5 of 7</Text>
      <Text style={s.title}>Dietary preferences</Text>
      <Text style={s.sub}>
        Select any that apply. This helps us suggest better foods for you.
      </Text>

      <View style={s.grid}>
        {PREFS.map((p) => {
          const isSelected = selected.includes(p.key);
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.chip, isSelected && s.chipActive]}
              onPress={() => toggle(p.key)}
            >
              <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={s.nextBtn}
        onPress={() => router.push("/onboarding/step-allergies")}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9" },
  content: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: "#059669", fontWeight: "500" },
  step: { fontSize: 13, color: "#059669", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 32 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 40 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  chipActive: { borderColor: "#059669", backgroundColor: "#f0fdf4" },
  chipText: { fontSize: 15, fontWeight: "500", color: "#475569" },
  chipTextActive: { color: "#047857" },
  nextBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
