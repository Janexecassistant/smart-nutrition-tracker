import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";

const PACES = [
  { kg: 0.25, label: "Slow & steady", detail: "~0.5 lb / 0.25 kg per week", rec: false },
  { kg: 0.5, label: "Moderate", detail: "~1 lb / 0.5 kg per week", rec: true },
  { kg: 0.75, label: "Aggressive", detail: "~1.5 lb / 0.75 kg per week", rec: false },
  { kg: 1.0, label: "Maximum", detail: "~2 lb / 1 kg per week", rec: false },
];

export default function StepPace() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  // If maintaining, skip this step
  if (data.goal === "maintain") {
    updateData({ targetPaceKgPerWeek: 0 });
    router.replace("/onboarding/step-preferences");
    return null;
  }

  const verb = data.goal === "lose" ? "lose" : "gain";

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.step}>Step 4 of 7</Text>
      <Text style={s.title}>How fast do you want to {verb}?</Text>
      <Text style={s.sub}>
        A moderate pace is sustainable and easier to stick with long-term.
      </Text>

      <View style={s.options}>
        {PACES.map((p) => (
          <TouchableOpacity
            key={p.kg}
            style={[
              s.card,
              data.targetPaceKgPerWeek === p.kg && s.cardActive,
            ]}
            onPress={() => updateData({ targetPaceKgPerWeek: p.kg })}
          >
            <View style={s.cardContent}>
              <View style={s.titleRow}>
                <Text
                  style={[
                    s.cardTitle,
                    data.targetPaceKgPerWeek === p.kg && s.cardTitleActive,
                  ]}
                >
                  {p.label}
                </Text>
                {p.rec && <Text style={s.recBadge}>Recommended</Text>}
              </View>
              <Text style={s.cardDesc}>{p.detail}</Text>
            </View>
            {data.targetPaceKgPerWeek === p.kg && (
              <View style={s.check}>
                <Text style={s.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={s.nextBtn}
        onPress={() => router.push("/onboarding/step-preferences")}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9", padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: "#059669", fontWeight: "500" },
  step: { fontSize: 13, color: "#059669", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 32 },
  options: { gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  recBadge: { fontSize: 11, color: "#059669", fontWeight: "600", backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  cardActive: { borderColor: "#059669", backgroundColor: "#f0fdf4" },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  cardTitleActive: { color: "#047857" },
  cardDesc: { fontSize: 13, color: "#475569" },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  nextBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
