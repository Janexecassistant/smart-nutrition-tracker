import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/stores/auth";

interface ProfileData {
  displayName?: string;
  email?: string;
  goal?: string;
  heightCm?: number;
  currentWeightKg?: number;
  activityLevel?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  unitSystem?: string;
  targets: {
    caloriesTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extra_active: "Extra Active",
};

const GOAL_LABELS: Record<string, string> = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
};

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = useAuth((s) => s.signOut);
  const user = useAuth((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<ProfileData>("/profile"),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    setRefreshing(false);
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const isImperial = profile?.unitSystem !== "metric";
  const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
  const cmToFeetInches = (cm: number) => {
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  const displayName =
    profile?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <Text style={s.name}>{displayName}</Text>
        {user?.email && <Text style={s.email}>{user.email}</Text>}
        {profile?.goal && (
          <Text style={s.goal}>
            {GOAL_LABELS[profile.goal] || profile.goal}
          </Text>
        )}
      </View>

      {/* Daily Targets */}
      {profile?.targets && (
        <View style={s.card}>
          <Text style={s.section}>Daily Targets</Text>
          <Row
            label="Calories"
            value={`${profile.targets.caloriesTarget.toLocaleString()} cal`}
          />
          <Row label="Protein" value={`${profile.targets.proteinG}g`} />
          <Row label="Carbs" value={`${profile.targets.carbsG}g`} />
          <Row label="Fat" value={`${profile.targets.fatG}g`} />
        </View>
      )}

      {/* Body Stats */}
      <View style={s.card}>
        <Text style={s.section}>Body Stats</Text>
        {profile?.heightCm && (
          <Row
            label="Height"
            value={
              isImperial
                ? cmToFeetInches(profile.heightCm)
                : `${Math.round(profile.heightCm)} cm`
            }
          />
        )}
        {profile?.currentWeightKg && (
          <Row
            label="Weight"
            value={
              isImperial
                ? `${kgToLbs(profile.currentWeightKg)} lbs`
                : `${Math.round(profile.currentWeightKg * 10) / 10} kg`
            }
          />
        )}
        {profile?.activityLevel && (
          <Row
            label="Activity"
            value={
              ACTIVITY_LABELS[profile.activityLevel] ||
              profile.activityLevel
            }
          />
        )}
      </View>

      {/* Preferences */}
      <View style={s.card}>
        <Text style={s.section}>Preferences</Text>
        <Row
          label="Diet"
          value={
            profile?.dietaryPreferences?.length
              ? profile.dietaryPreferences.join(", ")
              : "None set"
          }
        />
        <Row
          label="Allergies"
          value={
            profile?.allergies?.length
              ? profile.allergies.join(", ")
              : "None"
          }
        />
        <Row label="Units" value={isImperial ? "Imperial" : "Metric"} />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>Smart Nutrition Tracker v1.0.0</Text>
      <View style={{ height: 32 }} />
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
  container: { flex: 1, padding: 16, backgroundColor: "#f8faf9" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf9",
  },
  header: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  email: { fontSize: 14, color: "#94a3b8", marginTop: 2 },
  goal: { fontSize: 14, color: "#475569", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: { fontSize: 14, color: "#475569" },
  rowValue: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  signOutBtn: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  signOutText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#d4d4d4",
    marginTop: 16,
  },
});
