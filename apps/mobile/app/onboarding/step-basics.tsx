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

export default function StepBasics() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [dobMonth, setDobMonth] = useState(data.dateOfBirth ? data.dateOfBirth.split("-")[1] : "");
  const [dobDay, setDobDay] = useState(data.dateOfBirth ? data.dateOfBirth.split("-")[2] : "");
  const [dobYear, setDobYear] = useState(data.dateOfBirth ? data.dateOfBirth.split("-")[0] : "");

  // Imperial display values
  const [feet, setFeet] = useState(
    data.heightCm > 0 ? String(Math.floor(data.heightCm / 2.54 / 12)) : ""
  );
  const [inches, setInches] = useState(
    data.heightCm > 0
      ? String(Math.round((data.heightCm / 2.54) % 12))
      : ""
  );
  const [heightCmStr, setHeightCmStr] = useState(
    data.heightCm > 0 ? String(Math.round(data.heightCm)) : ""
  );
  const [weightStr, setWeightStr] = useState(
    data.currentWeightKg > 0
      ? data.unitSystem === "imperial"
        ? String(Math.round(data.currentWeightKg * 2.20462))
        : String(Math.round(data.currentWeightKg * 10) / 10)
      : ""
  );

  const isImperial = data.unitSystem === "imperial";

  const toggleUnits = () => {
    const newSystem = isImperial ? "metric" : "imperial";
    updateData({ unitSystem: newSystem });
  };

  const canContinue = () => {
    if (!dobMonth || !dobDay || !dobYear || dobYear.length < 4) return false;
    if (!data.sex) return false;
    if (isImperial) {
      if (!feet || !weightStr) return false;
    } else {
      if (!heightCmStr || !weightStr) return false;
    }
    return true;
  };

  const handleNext = () => {
    // Build DOB
    const dob = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;

    // Convert height to cm
    let heightCm: number;
    if (isImperial) {
      const ft = parseInt(feet) || 0;
      const inc = parseInt(inches) || 0;
      heightCm = (ft * 12 + inc) * 2.54;
    } else {
      heightCm = parseFloat(heightCmStr) || 0;
    }

    // Convert weight to kg
    let weightKg: number;
    if (isImperial) {
      weightKg = (parseFloat(weightStr) || 0) / 2.20462;
    } else {
      weightKg = parseFloat(weightStr) || 0;
    }

    updateData({ dateOfBirth: dob, heightCm, currentWeightKg: weightKg });
    router.push("/onboarding/step-goal");
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.step}>Step 1 of 7</Text>
      <Text style={s.title}>Let's get your basics</Text>
      <Text style={s.sub}>
        We'll use this to calculate your personalized nutrition targets.
      </Text>

      {/* Unit toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, isImperial && s.toggleActive]}
          onPress={() => updateData({ unitSystem: "imperial" })}
        >
          <Text style={[s.toggleText, isImperial && s.toggleTextActive]}>
            Imperial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, !isImperial && s.toggleActive]}
          onPress={() => updateData({ unitSystem: "metric" })}
        >
          <Text style={[s.toggleText, !isImperial && s.toggleTextActive]}>
            Metric
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date of Birth */}
      <Text style={s.label}>Date of Birth</Text>
      <View style={s.dobRow}>
        <TextInput
          style={[s.input, s.dobInput]}
          placeholder="MM"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          maxLength={2}
          value={dobMonth}
          onChangeText={setDobMonth}
        />
        <TextInput
          style={[s.input, s.dobInput]}
          placeholder="DD"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          maxLength={2}
          value={dobDay}
          onChangeText={setDobDay}
        />
        <TextInput
          style={[s.input, s.dobInputYear]}
          placeholder="YYYY"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          maxLength={4}
          value={dobYear}
          onChangeText={setDobYear}
        />
      </View>

      {/* Biological Sex */}
      <Text style={s.label}>Biological Sex</Text>
      <View style={s.optionRow}>
        {(["male", "female", "other"] as const).map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[s.optionBtn, data.sex === opt && s.optionActive]}
            onPress={() => updateData({ sex: opt })}
          >
            <Text
              style={[
                s.optionText,
                data.sex === opt && s.optionTextActive,
              ]}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Height */}
      <Text style={s.label}>Height</Text>
      {isImperial ? (
        <View style={s.dobRow}>
          <View style={s.inputWithLabel}>
            <TextInput
              style={s.input}
              placeholder="5"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={1}
              value={feet}
              onChangeText={setFeet}
            />
            <Text style={s.inputSuffix}>ft</Text>
          </View>
          <View style={s.inputWithLabel}>
            <TextInput
              style={s.input}
              placeholder="10"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={2}
              value={inches}
              onChangeText={setInches}
            />
            <Text style={s.inputSuffix}>in</Text>
          </View>
        </View>
      ) : (
        <View style={s.inputWithLabel}>
          <TextInput
            style={s.input}
            placeholder="175"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={heightCmStr}
            onChangeText={setHeightCmStr}
          />
          <Text style={s.inputSuffix}>cm</Text>
        </View>
      )}

      {/* Weight */}
      <Text style={s.label}>Current Weight</Text>
      <View style={s.inputWithLabel}>
        <TextInput
          style={s.input}
          placeholder={isImperial ? "185" : "84"}
          placeholderTextColor="#94a3b8"
          keyboardType="decimal-pad"
          value={weightStr}
          onChangeText={setWeightStr}
        />
        <Text style={s.inputSuffix}>{isImperial ? "lbs" : "kg"}</Text>
      </View>

      {/* Next button */}
      <TouchableOpacity
        style={[s.nextBtn, !canContinue() && s.nextBtnDisabled]}
        onPress={handleNext}
        disabled={!canContinue()}
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
  step: { fontSize: 13, color: "#059669", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 24 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleActive: { backgroundColor: "#fff", shadowColor: "#064e3b", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: "500", color: "#475569" },
  toggleTextActive: { color: "#0f172a" },
  label: { fontSize: 14, fontWeight: "600", color: "#0f172a", marginBottom: 8, marginTop: 16 },
  dobRow: { flexDirection: "row", gap: 10 },
  dobInput: { flex: 1 },
  dobInputYear: { flex: 1.5 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputWithLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputSuffix: { fontSize: 15, color: "#475569", fontWeight: "500" },
  optionRow: { flexDirection: "row", gap: 10 },
  optionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionActive: { backgroundColor: "#f0fdf4", borderColor: "#059669" },
  optionText: { fontSize: 15, fontWeight: "500", color: "#475569" },
  optionTextActive: { color: "#059669" },
  nextBtn: {
    marginTop: 32,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
