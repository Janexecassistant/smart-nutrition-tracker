import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";
import { useAuth } from "../../src/stores/auth";
import { api } from "../../src/lib/api";

const GOAL_LABELS: Record<string, string> = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extremely_active: "Extra Active",
};

const PREF_LABELS: Record<string, string> = {
  none: "No Preference",
  high_protein: "High Protein",
  low_carb: "Low Carb",
  keto: "Keto",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  paleo: "Paleo",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
};

const HEALTH_FOCUS_LABELS: Record<string, string> = {
  pregnancy: "Healthy Pregnancy",
  diabetic: "Diabetic Friendly",
  celiac: "Celiac / Gluten-Free",
  low_sodium: "Low Sodium",
  heart_healthy: "Heart Healthy",
  kidney_friendly: "Kidney Friendly",
  ibs_fodmap: "IBS / Low FODMAP",
  anti_inflammatory: "Anti-Inflammatory",
  pcos: "PCOS Support",
};

const ALLERGY_LABELS: Record<string, string> = {
  peanuts: "Peanuts",
  tree_nuts: "Tree Nuts",
  dairy: "Dairy",
  eggs: "Eggs",
  soy: "Soy",
  wheat: "Wheat",
  fish: "Fish",
  shellfish: "Shellfish",
  sesame: "Sesame",
};

export default function StepReview() {
  const router = useRouter();
  const { data, reset } = useOnboarding();
  const checkProfile = useAuth((s) => s.checkProfile);
  const [submitting, setSubmitting] = useState(false);

  const isImperial = data.unitSystem === "imperial";
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
  const cmToFeetInches = (cm: number) => {
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/profile/onboarding", {
        dateOfBirth: data.dateOfBirth,
        sex: data.sex,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        activityLevel: data.activityLevel,
        goal: data.goal,
        healthFocus: (data.healthFocus || []).filter((f: string) => f !== "none"),
        targetPaceKgPerWeek: data.targetPaceKgPerWeek,
        dietaryPreferences: data.dietaryPreferences.filter((p) => p !== "none"),
        allergies: data.allergies,
        unitSystem: data.unitSystem,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });

      // Mark profile as complete in auth store
      await checkProfile();
      reset();

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Something went wrong",
        err.message || "Failed to save your profile. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
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

      <Text style={s.step}>Step 7 of 7</Text>
      <Text style={s.title}>Review your profile</Text>
      <Text style={s.sub}>
        Make sure everything looks right. You can always change these later.
      </Text>

      {/* Basics */}
      <View style={s.card}>
        <Text style={s.section}>Basics</Text>
        <Row label="Date of Birth" value={data.dateOfBirth} />
        <Row
          label="Sex"
          value={data.sex.charAt(0).toUpperCase() + data.sex.slice(1)}
        />
        <Row
          label="Height"
          value={
            isImperial
              ? cmToFeetInches(data.heightCm)
              : `${Math.round(data.heightCm)} cm`
          }
        />
        <Row
          label="Weight"
          value={
            isImperial
              ? `${kgToLbs(data.currentWeightKg)} lbs`
              : `${Math.round(data.currentWeightKg * 10) / 10} kg`
          }
        />
      </View>

      {/* Goals */}
      <View style={s.card}>
        <Text style={s.section}>Goals</Text>
        <Row label="Goal" value={GOAL_LABELS[data.goal] || data.goal} />
        <Row
          label="Activity"
          value={ACTIVITY_LABELS[data.activityLevel] || data.activityLevel}
        />
        {data.goal !== "maintain" && (
          <Row
            label="Pace"
            value={`${data.targetPaceKgPerWeek} kg/week (~${Math.round(data.targetPaceKgPerWeek * 2.20462)} lbs/week)`}
          />
        )}
        {(data.healthFocus || []).length > 0 && (
          <Row
            label="Health Focus"
            value={(data.healthFocus || [])
              .map((h: string) => HEALTH_FOCUS_LABELS[h] || h)
              .join(", ")}
          />
        )}
      </View>

      {/* Preferences */}
      <View style={s.card}>
        <Text style={s.section}>Preferences & Allergies</Text>
        <Row
          label="Diet"
          value={
            data.dietaryPreferences.length > 0
              ? data.dietaryPreferences
                  .map((p) => PREF_LABELS[p] || p)
                  .join(", ")
              : "None"
          }
        />
        <Row
          label="Allergies"
          value={
            data.allergies.length > 0
              ? data.allergies
                  .map((a) => ALLERGY_LABELS[a] || a)
                  .join(", ")
              : "None"
          }
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[s.submitBtn, submitting && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitText}>Calculate My Targets</Text>
        )}
      </TouchableOpacity>

      <Text style={s.disclaimer}>
        We'll calculate your personalized calorie and macro targets based on
        your profile. You can adjust them anytime.
      </Text>

      <View style={{ height: 40 }} />
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
  container: { flex: 1, backgroundColor: "#f8faf9" },
  content: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: "#059669", fontWeight: "500" },
  step: { fontSize: 13, color: "#059669", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#064e3b",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  section: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: { fontSize: 14, color: "#475569" },
  rowValue: { fontSize: 14, fontWeight: "500", color: "#0f172a", maxWidth: "55%" as any, textAlign: "right" },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  disclaimer: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
