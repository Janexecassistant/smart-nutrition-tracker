import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";

const LEVELS = [
  {
    key: "sedentary" as const,
    title: "Sedentary",
    desc: "Little or no exercise, desk job",
  },
  {
    key: "lightly_active" as const,
    title: "Lightly Active",
    desc: "Light exercise 1–3 days/week",
  },
  {
    key: "moderately_active" as const,
    title: "Moderately Active",
    desc: "Moderate exercise 3–5 days/week",
  },
  {
    key: "very_active" as const,
    title: "Very Active",
    desc: "Hard exercise 6–7 days/week",
  },
  {
    key: "extremely_active" as const,
    title: "Extra Active",
    desc: "Very hard exercise, physical job, or training twice/day",
  },
];

export default function StepActivity() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.step}>Step 3 of 7</Text>
      <Text style={s.title}>How active are you?</Text>
      <Text style={s.sub}>
        This affects how many calories you burn each day.
      </Text>

      <View style={s.options}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.key}
            style={[s.card, data.activityLevel === lvl.key && s.cardActive]}
            onPress={() => updateData({ activityLevel: lvl.key })}
          >
            <View style={s.cardContent}>
              <Text
                style={[
                  s.cardTitle,
                  data.activityLevel === lvl.key && s.cardTitleActive,
                ]}
              >
                {lvl.title}
              </Text>
              <Text style={s.cardDesc}>{lvl.desc}</Text>
            </View>
            {data.activityLevel === lvl.key && (
              <View style={s.check}>
                <Text style={s.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.nextBtn, !data.activityLevel && s.nextBtnDisabled]}
        onPress={() => router.push("/onboarding/step-pace")}
        disabled={!data.activityLevel}
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
  options: { gap: 12, marginBottom: 32 },
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
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a", marginBottom: 4 },
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
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
