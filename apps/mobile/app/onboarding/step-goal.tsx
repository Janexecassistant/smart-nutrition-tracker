import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";

const GOALS = [
  {
    key: "lose" as const,
    emoji: "🔥",
    title: "Lose Weight",
    desc: "Reduce body fat while preserving muscle",
  },
  {
    key: "maintain" as const,
    emoji: "⚖️",
    title: "Maintain Weight",
    desc: "Stay at your current weight",
  },
  {
    key: "gain" as const,
    emoji: "💪",
    title: "Gain Weight",
    desc: "Build muscle and increase mass",
  },
];

const HEALTH_FOCUSES = [
  { key: "pregnancy", emoji: "🤰", title: "Healthy Pregnancy", desc: "Higher folate, iron, calcium" },
  { key: "diabetic", emoji: "🩸", title: "Diabetic Friendly", desc: "Controlled carbs, balanced blood sugar" },
  { key: "celiac", emoji: "🌾", title: "Celiac / Gluten-Free", desc: "Strict gluten avoidance" },
  { key: "low_sodium", emoji: "🧂", title: "Low Sodium", desc: "Under 1,500mg sodium daily" },
  { key: "heart_healthy", emoji: "❤️", title: "Heart Healthy", desc: "Low saturated fat, high omega-3" },
  { key: "kidney_friendly", emoji: "💧", title: "Kidney Friendly", desc: "Controlled potassium & phosphorus" },
  { key: "ibs_fodmap", emoji: "🫃", title: "IBS / Low FODMAP", desc: "Avoid high-FODMAP triggers" },
  { key: "anti_inflammatory", emoji: "🛡️", title: "Anti-Inflammatory", desc: "Omega-3, antioxidants, whole foods" },
  { key: "pcos", emoji: "🔬", title: "PCOS Support", desc: "Balanced insulin, anti-inflammatory" },
];

export default function StepGoal() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const handleSelect = (goal: "lose" | "gain" | "maintain") => {
    updateData({
      goal,
      targetPaceKgPerWeek: goal === "maintain" ? 0 : data.targetPaceKgPerWeek || 0.5,
    });
  };

  const toggleHealthFocus = (focus: string) => {
    const current = data.healthFocus || [];
    const wasSelected = current.includes(focus);
    if (wasSelected) {
      updateData({ healthFocus: current.filter((f: string) => f !== focus) });
    } else {
      updateData({ healthFocus: [...current, focus] });
    }
  };

  const isFocusSelected = (focus: string) => (data.healthFocus || []).includes(focus);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.step}>Step 2 of 7</Text>
      <Text style={s.title}>What's your goal?</Text>
      <Text style={s.sub}>
        This helps us set the right calorie and macro targets for you.
      </Text>

      {/* Weight Goals */}
      <View style={s.options}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[s.card, data.goal === g.key && s.cardActive]}
            onPress={() => handleSelect(g.key)}
          >
            <Text style={s.emoji}>{g.emoji}</Text>
            <View style={s.cardContent}>
              <Text style={[s.cardTitle, data.goal === g.key && s.cardTitleActive]}>
                {g.title}
              </Text>
              <Text style={s.cardDesc}>{g.desc}</Text>
            </View>
            {data.goal === g.key && (
              <View style={s.check}>
                <Text style={s.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Focus */}
      <Text style={s.sectionTitle}>Any health considerations?</Text>
      <Text style={s.sectionSub}>
        Optional — select any that apply to tailor your nutrients.
      </Text>

      <View style={s.focusGrid}>
        {HEALTH_FOCUSES.map((hf) => (
          <TouchableOpacity
            key={hf.key}
            style={[s.focusCard, isFocusSelected(hf.key) && s.focusCardActive]}
            onPress={() => toggleHealthFocus(hf.key)}
          >
            <Text style={s.focusEmoji}>{hf.emoji}</Text>
            <Text style={[s.focusTitle, isFocusSelected(hf.key) && s.focusTitleActive]}>
              {hf.title}
            </Text>
            <Text style={s.focusDesc}>{hf.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Warnings */}
      {isFocusSelected("pregnancy") && (
        <View style={s.warning}>
          <Text style={s.warningText}>
            Pregnancy mode adjusts nutrient targets. Always follow your doctor's guidance.
          </Text>
        </View>
      )}
      {isFocusSelected("diabetic") && (
        <View style={[s.warning, { backgroundColor: "#eff6ff" }]}>
          <Text style={[s.warningText, { color: "#1d4ed8" }]}>
            Diabetic mode focuses on controlled carbs and balanced meals. Consult your healthcare provider.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.nextBtn, !data.goal && s.nextBtnDisabled]}
        onPress={() => router.push("/onboarding/step-activity")}
        disabled={!data.goal}
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
  sub: { fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 24 },
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
  emoji: { fontSize: 32, marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a", marginBottom: 4 },
  cardTitleActive: { color: "#047857" },
  cardDesc: { fontSize: 13, color: "#475569" },
  check: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#059669", alignItems: "center", justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  sectionSub: { fontSize: 13, color: "#475569", marginBottom: 16 },
  focusGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20,
  },
  focusCard: {
    width: "48%" as any,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  focusCardActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  focusEmoji: { fontSize: 24, marginBottom: 6 },
  focusTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 3 },
  focusTitleActive: { color: "#2563eb" },
  focusDesc: { fontSize: 11, color: "#94a3b8", lineHeight: 15 },
  warning: {
    backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, marginBottom: 16,
  },
  warningText: { fontSize: 12, color: "#b45309", lineHeight: 18 },
  nextBtn: {
    backgroundColor: "#059669", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
