import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/lib/api";

interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

interface DailyLog {
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

interface Profile {
  targets: {
    caloriesTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  unitSystem?: string;
}

export default function ProgressScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const { data: weightData, isLoading: weightLoading } = useQuery({
    queryKey: ["weight"],
    queryFn: () => api.get<WeightEntry[]>("/weight", { days: "30" }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profile"),
  });

  const { data: todayLog } = useQuery({
    queryKey: ["logs", "today"],
    queryFn: () => api.get<DailyLog>("/logs/today"),
  });

  const logWeightMutation = useMutation({
    mutationFn: (weightKg: number) =>
      api.post("/weight", {
        date: new Date().toISOString().split("T")[0],
        weightKg,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight"] });
      setShowWeightInput(false);
      setNewWeight("");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to log weight");
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["weight"] }),
      queryClient.invalidateQueries({ queryKey: ["logs", "today"] }),
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
    ]);
    setRefreshing(false);
  }, []);

  const isImperial = profile?.unitSystem !== "metric";
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const lbsToKg = (lbs: number) => lbs / 2.20462;

  const entries = weightData || [];
  const latestEntry = entries[0];
  const oldestEntry = entries[entries.length - 1];

  const currentWeight = latestEntry
    ? isImperial
      ? kgToLbs(latestEntry.weightKg)
      : Math.round(latestEntry.weightKg * 10) / 10
    : null;

  const weightDelta =
    latestEntry && oldestEntry && entries.length > 1
      ? isImperial
        ? kgToLbs(latestEntry.weightKg) - kgToLbs(oldestEntry.weightKg)
        : Math.round(
            (latestEntry.weightKg - oldestEntry.weightKg) * 10
          ) / 10
      : null;

  const weightUnit = isImperial ? "lbs" : "kg";

  // Build simple 7-day adherence from logs (calorie % of target)
  const targets = profile?.targets;
  const todayCals = todayLog?.totals?.calories || 0;
  const calTarget = targets?.caloriesTarget || 2000;
  const todayAdherence = Math.min(
    Math.round((todayCals / calTarget) * 100),
    100
  );

  const handleLogWeight = () => {
    const value = parseFloat(newWeight);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid", "Please enter a valid weight.");
      return;
    }
    const kg = isImperial ? lbsToKg(value) : value;
    logWeightMutation.mutate(kg);
  };

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={s.title}>Your Progress</Text>

      {/* Weight Trend Card */}
      <View style={s.card}>
        <Text style={s.section}>Weight Trend</Text>
        {weightLoading ? (
          <ActivityIndicator color="#059669" style={{ paddingVertical: 16 }} />
        ) : currentWeight !== null ? (
          <>
            <View style={s.weightRow}>
              <Text style={s.weightNum}>{currentWeight}</Text>
              <Text style={s.weightUnit}>{weightUnit}</Text>
              {weightDelta !== null && (
                <View
                  style={[
                    s.delta,
                    {
                      backgroundColor:
                        weightDelta <= 0 ? "#ecfdf5" : "#fef2f2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.deltaText,
                      {
                        color:
                          weightDelta <= 0 ? "#059669" : "#ef4444",
                      },
                    ]}
                  >
                    {weightDelta > 0 ? "+" : ""}
                    {weightDelta} {weightUnit}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.weightSub}>
              Last {entries.length} entries over 30 days
            </Text>

            {/* Mini weight chart — simple dot display */}
            {entries.length > 1 && (
              <View style={s.chartRow}>
                {entries
                  .slice()
                  .reverse()
                  .slice(-7)
                  .map((entry, i) => {
                    const w = isImperial
                      ? kgToLbs(entry.weightKg)
                      : entry.weightKg;
                    return (
                      <View key={entry.id || i} style={s.chartDot}>
                        <Text style={s.chartVal}>{w}</Text>
                        <View style={s.dot} />
                        <Text style={s.chartDate}>
                          {new Date(entry.date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        ) : (
          <Text style={s.emptyText}>
            No weight logged yet. Start tracking below!
          </Text>
        )}

        {/* Log weight button / input */}
        {showWeightInput ? (
          <View style={s.weightInputRow}>
            <TextInput
              style={s.weightInput}
              placeholder={`Weight (${weightUnit})`}
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
            />
            <TouchableOpacity
              style={s.logBtn}
              onPress={handleLogWeight}
              disabled={logWeightMutation.isPending}
            >
              {logWeightMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.logBtnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => {
                setShowWeightInput(false);
                setNewWeight("");
              }}
            >
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.addWeightBtn}
            onPress={() => setShowWeightInput(true)}
          >
            <Text style={s.addWeightText}>+ Log Today's Weight</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Today's Adherence */}
      <View style={s.card}>
        <Text style={s.section}>Today's Adherence</Text>
        <View style={s.adherenceSingle}>
          <View style={s.adherenceBarBg}>
            <View
              style={[
                s.adherenceBarFill,
                {
                  width: `${todayAdherence}%`,
                  backgroundColor:
                    todayAdherence >= 90
                      ? "#059669"
                      : todayAdherence >= 70
                      ? "#f59e0b"
                      : "#e2e8f0",
                },
              ]}
            />
          </View>
          <Text style={s.adherencePct}>{todayAdherence}% of calorie goal</Text>
        </View>
        {targets && (
          <View style={s.macroAdherence}>
            <MacroRow
              label="Protein"
              current={todayLog?.totals?.proteinG || 0}
              target={targets.proteinG}
              color="#3b82f6"
            />
            <MacroRow
              label="Carbs"
              current={todayLog?.totals?.carbsG || 0}
              target={targets.carbsG}
              color="#f59e0b"
            />
            <MacroRow
              label="Fat"
              current={todayLog?.totals?.fatG || 0}
              target={targets.fatG}
              color="#ef4444"
            />
          </View>
        )}
      </View>

      {/* Recent Weight Entries */}
      {entries.length > 0 && (
        <View style={s.card}>
          <Text style={s.section}>Recent Weigh-Ins</Text>
          {entries.slice(0, 7).map((entry) => {
            const w = isImperial
              ? kgToLbs(entry.weightKg)
              : Math.round(entry.weightKg * 10) / 10;
            return (
              <View key={entry.id} style={s.entryRow}>
                <Text style={s.entryDate}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={s.entryWeight}>
                  {w} {weightUnit}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function MacroRow({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <View style={s.macroRow}>
      <Text style={s.macroLabel}>{label}</Text>
      <View style={s.macroBarOuter}>
        <View
          style={[
            s.macroBarInner,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={s.macroPct}>
        {Math.round(current)}/{target}g
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8faf9" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    paddingTop: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#064e3b",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  section: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  weightNum: { fontSize: 36, fontWeight: "bold", color: "#0f172a" },
  weightUnit: { fontSize: 16, color: "#475569", marginLeft: 4 },
  delta: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 12,
  },
  deltaText: { fontSize: 13, fontWeight: "600" },
  weightSub: { fontSize: 12, color: "#94a3b8", marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#94a3b8", paddingVertical: 8 },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingTop: 8,
  },
  chartDot: { alignItems: "center", flex: 1 },
  chartVal: { fontSize: 10, color: "#475569", marginBottom: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
    marginBottom: 4,
  },
  chartDate: { fontSize: 9, color: "#94a3b8" },
  addWeightBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  addWeightText: { color: "#059669", fontSize: 15, fontWeight: "600" },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0f172a",
  },
  logBtn: {
    backgroundColor: "#059669",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  cancelBtnText: { color: "#475569", fontSize: 14 },
  adherenceSingle: { marginBottom: 16 },
  adherenceBarBg: {
    height: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  adherenceBarFill: { height: 10, borderRadius: 5 },
  adherencePct: { fontSize: 13, color: "#475569" },
  macroAdherence: { gap: 10 },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroLabel: { fontSize: 13, color: "#475569", width: 55 },
  macroBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBarInner: { height: 6, borderRadius: 3 },
  macroPct: { fontSize: 12, color: "#94a3b8", width: 70, textAlign: "right" },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  entryDate: { fontSize: 14, color: "#475569" },
  entryWeight: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
});
