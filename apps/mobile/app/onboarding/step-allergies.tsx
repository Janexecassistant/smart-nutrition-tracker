import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../src/stores/onboarding";

const COMMON = [
  "peanuts",
  "tree_nuts",
  "dairy",
  "eggs",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "sesame",
];

const LABELS: Record<string, string> = {
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

export default function StepAllergies() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [custom, setCustom] = useState("");

  const selected = data.allergies;

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      updateData({ allergies: selected.filter((a) => a !== key) });
    } else {
      updateData({ allergies: [...selected, key] });
    }
  };

  const addCustom = () => {
    const trimmed = custom.trim().toLowerCase();
    if (trimmed && !selected.includes(trimmed)) {
      updateData({ allergies: [...selected, trimmed] });
    }
    setCustom("");
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.step}>Step 6 of 7</Text>
      <Text style={s.title}>Any food allergies?</Text>
      <Text style={s.sub}>
        We'll flag these in food suggestions. Skip if none apply.
      </Text>

      <View style={s.grid}>
        {COMMON.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[s.chip, isSelected && s.chipActive]}
              onPress={() => toggle(key)}
            >
              <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                {LABELS[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom allergen input */}
      <Text style={s.customLabel}>Add a custom allergen</Text>
      <View style={s.customRow}>
        <TextInput
          style={s.customInput}
          placeholder="e.g. corn, gluten"
          placeholderTextColor="#94a3b8"
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s.addBtn, !custom.trim() && s.addBtnDisabled]}
          onPress={addCustom}
          disabled={!custom.trim()}
        >
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Show custom (non-common) allergens */}
      {selected.filter((a) => !COMMON.includes(a)).length > 0 && (
        <View style={s.customTags}>
          {selected
            .filter((a) => !COMMON.includes(a))
            .map((a) => (
              <TouchableOpacity
                key={a}
                style={s.customTag}
                onPress={() => toggle(a)}
              >
                <Text style={s.customTagText}>
                  {a} ✕
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      <TouchableOpacity
        style={s.nextBtn}
        onPress={() => router.push("/onboarding/step-review")}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.skipBtn}
        onPress={() => {
          updateData({ allergies: [] });
          router.push("/onboarding/step-review");
        }}
      >
        <Text style={s.skipText}>Skip — I have no allergies</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  chipActive: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  chipText: { fontSize: 15, fontWeight: "500", color: "#475569" },
  chipTextActive: { color: "#ef4444" },
  customLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 8 },
  customRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  customInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  customTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  customTag: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customTagText: { fontSize: 13, color: "#ef4444", fontWeight: "500" },
  nextBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { fontSize: 15, color: "#475569" },
});
