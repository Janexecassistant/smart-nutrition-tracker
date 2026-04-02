import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../src/lib/api";

type Tab = "search" | "scan" | "quick";

interface FoodResult {
  id: string;
  name: string;
  brand?: string | null;
  servingSizeG: string | number;
  servingLabel?: string | null;
  calories: string | number;
  proteinG: string | number;
  carbsG: string | number;
  fatG: string | number;
  imageUrl?: string | null;
  source?: string;
}

export default function AddFoodScreen() {
  const { slot = "snack" } = useLocalSearchParams<{ slot: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("search");

  return (
    <>
      <Stack.Screen
        options={{
          title: `Add to ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
          headerStyle: { backgroundColor: "#fff" },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tab Switcher */}
        <View style={styles.tabs}>
          {(["search", "scan", "quick"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "search" ? "🔍 Search" : t === "scan" ? "📷 Scan" : "⚡ Quick"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "search" && <SearchTab slot={slot} router={router} queryClient={queryClient} />}
        {tab === "scan" && <ScanTab slot={slot} router={router} queryClient={queryClient} />}
        {tab === "quick" && <QuickAddTab slot={slot} router={router} queryClient={queryClient} />}
      </KeyboardAvoidingView>
    </>
  );
}

/* ── Search Tab ────────────────────────────────────────── */
function SearchTab({ slot, router, queryClient }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [servings, setServings] = useState("1");
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<{ foods: FoodResult[] }>("/foods/search", { query, limit: "15" });
        setResults(data.foods || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
  }, [query]);

  const logFood = async (food: FoodResult) => {
    const mult = parseFloat(servings) || 1;
    const isOffFood = String(food.id).startsWith("off_");
    try {
      await api.post("/logs", {
        mealSlot: slot,
        ...(isOffFood ? {} : { foodId: food.id }),
        foodType: "global",
        foodName: food.name,
        quantityG: Number(food.servingSizeG) * mult,
        servingLabel: food.servingLabel || `${Math.round(Number(food.servingSizeG) * mult)}g`,
        calories: Math.round(Number(food.calories) * mult),
        proteinG: Math.round(Number(food.proteinG) * mult * 10) / 10,
        carbsG: Math.round(Number(food.carbsG) * mult * 10) / 10,
        fatG: Math.round(Number(food.fatG) * mult * 10) / 10,
      });
      queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log food.");
    }
  };

  if (selected) {
    const mult = parseFloat(servings) || 1;
    return (
      <ScrollView style={styles.detail}>
        <Text style={styles.detailName}>{selected.name}</Text>
        {selected.brand && <Text style={styles.detailBrand}>{selected.brand}</Text>}
        <View style={styles.servingRow}>
          <Text style={styles.servingLabel}>Servings:</Text>
          <TextInput
            style={styles.servingInput}
            keyboardType="decimal-pad"
            value={servings}
            onChangeText={setServings}
          />
        </View>
        <View style={styles.macroPills}>
          <MacroPill label="Cal" value={Math.round(Number(selected.calories) * mult)} color="#0f172a" />
          <MacroPill label="P" value={Math.round(Number(selected.proteinG) * mult)} color="#3b82f6" unit="g" />
          <MacroPill label="C" value={Math.round(Number(selected.carbsG) * mult)} color="#f59e0b" unit="g" />
          <MacroPill label="F" value={Math.round(Number(selected.fatG) * mult)} color="#ef4444" unit="g" />
        </View>
        <TouchableOpacity style={styles.logButton} onPress={() => logFood(selected)}>
          <Text style={styles.logButtonText}>Log Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setSelected(null)}>
          <Text style={styles.backLinkText}>← Back to results</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search foods..."
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} color="#059669" />}
      <ScrollView>
        {results.map((food) => (
          <TouchableOpacity key={food.id} style={styles.resultItem} onPress={() => { setSelected(food); setServings("1"); }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{food.name}</Text>
              {food.brand && <Text style={styles.resultBrand}>{food.brand}</Text>}
            </View>
            <Text style={styles.resultCals}>{Number(food.calories)} cal</Text>
          </TouchableOpacity>
        ))}
        {query.length >= 2 && !loading && results.length === 0 && (
          <Text style={styles.noResults}>No results found. Try Quick Add instead.</Text>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Scan Tab ──────────────────────────────────────────── */
function ScanTab({ slot, router, queryClient }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [food, setFood] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const handleBarcode = async (code: string) => {
    if (scanned || !code) return;
    setScanned(true);
    setLoading(true);
    try {
      const data = await api.get<{ food: FoodResult; source: string }>(`/foods/barcode/${code}`);
      if (data.food) {
        setFood(data.food);
      } else {
        Alert.alert("Not Found", `No food found for barcode ${code}. Try searching instead.`, [
          { text: "OK", onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert("Not Found", `No food found for barcode ${code}. Try searching instead.`, [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
    setLoading(false);
  };

  const logFood = async () => {
    if (!food) return;
    const isOffFood = String(food.id).startsWith("off_");
    try {
      await api.post("/logs", {
        mealSlot: slot,
        ...(isOffFood ? {} : { foodId: food.id }),
        foodType: "global",
        foodName: food.name,
        quantityG: Number(food.servingSizeG),
        servingLabel: food.servingLabel || `${food.servingSizeG}g`,
        calories: Math.round(Number(food.calories)),
        proteinG: Math.round(Number(food.proteinG) * 10) / 10,
        carbsG: Math.round(Number(food.carbsG) * 10) / 10,
        fatG: Math.round(Number(food.fatG) * 10) / 10,
      });
      queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log food.");
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan barcodes.</Text>
        <TouchableOpacity style={styles.logButton} onPress={requestPermission}>
          <Text style={styles.logButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (food) {
    return (
      <ScrollView style={styles.detail}>
        <Text style={styles.detailName}>{food.name}</Text>
        {food.brand && <Text style={styles.detailBrand}>{food.brand}</Text>}
        <View style={styles.macroPills}>
          <MacroPill label="Cal" value={Math.round(Number(food.calories))} color="#0f172a" />
          <MacroPill label="P" value={Math.round(Number(food.proteinG))} color="#3b82f6" unit="g" />
          <MacroPill label="C" value={Math.round(Number(food.carbsG))} color="#f59e0b" unit="g" />
          <MacroPill label="F" value={Math.round(Number(food.fatG))} color="#ef4444" unit="g" />
        </View>
        <TouchableOpacity style={styles.logButton} onPress={logFood}>
          <Text style={styles.logButtonText}>Log Scanned Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => { setFood(null); setScanned(false); }}>
          <Text style={styles.backLinkText}>← Scan another</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>
      ) : (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
          onBarcodeScanned={({ data }) => handleBarcode(data)}
        />
      )}
      <View style={styles.manualRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1, marginRight: 8 }]}
          placeholder="Or enter barcode manually..."
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          value={manualCode}
          onChangeText={setManualCode}
        />
        <TouchableOpacity
          style={[styles.logButton, { paddingHorizontal: 20, paddingVertical: 14 }]}
          onPress={() => handleBarcode(manualCode)}
        >
          <Text style={styles.logButtonText}>Look Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Quick Add Tab ─────────────────────────────────────── */
function QuickAddTab({ slot, router, queryClient }: any) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickAdd = async () => {
    if (!name || !calories) {
      Alert.alert("Error", "Name and calories are required.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/logs", {
        mealSlot: slot,
        foodType: "quick_add",
        foodName: name,
        quantityG: 100,
        servingLabel: "1 serving",
        calories: parseInt(calories),
        proteinG: parseFloat(protein) || 0,
        carbsG: parseFloat(carbs) || 0,
        fatG: parseFloat(fat) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["logs", "today"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log food.");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.quickForm}>
      <Text style={styles.quickLabel}>Food name *</Text>
      <TextInput style={styles.searchInput} placeholder="e.g. Chicken breast" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />

      <Text style={styles.quickLabel}>Calories *</Text>
      <TextInput style={styles.searchInput} placeholder="e.g. 250" placeholderTextColor="#94a3b8" keyboardType="number-pad" value={calories} onChangeText={setCalories} />

      <Text style={styles.quickLabel}>Protein (g)</Text>
      <TextInput style={styles.searchInput} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" value={protein} onChangeText={setProtein} />

      <Text style={styles.quickLabel}>Carbs (g)</Text>
      <TextInput style={styles.searchInput} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" value={carbs} onChangeText={setCarbs} />

      <Text style={styles.quickLabel}>Fat (g)</Text>
      <TextInput style={styles.searchInput} placeholder="0" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" value={fat} onChangeText={setFat} />

      <TouchableOpacity style={[styles.logButton, { marginTop: 20 }]} onPress={handleQuickAdd} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.logButtonText}>Quick Add</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ── Shared Components ─────────────────────────────────── */
function MacroPill({ label, value, color, unit }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}{unit || ""}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf9" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  tabActive: { backgroundColor: "#059669" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  tabTextActive: { color: "#fff" },
  searchInput: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#0f172a", margin: 16, marginBottom: 0,
  },
  resultItem: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: "#f1f5f9",
  },
  resultName: { fontSize: 15, fontWeight: "500", color: "#0f172a" },
  resultBrand: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  resultCals: { fontSize: 14, color: "#475569", fontWeight: "600" },
  noResults: { textAlign: "center", color: "#94a3b8", marginTop: 24, fontSize: 15 },
  detail: { padding: 20 },
  detailName: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  detailBrand: { fontSize: 15, color: "#475569", marginTop: 4 },
  servingRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  servingLabel: { fontSize: 16, color: "#404040", marginRight: 12 },
  servingInput: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, width: 80, textAlign: "center",
  },
  macroPills: { flexDirection: "row", gap: 10, marginTop: 20 },
  pill: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" },
  pillValue: { fontSize: 18, fontWeight: "700" },
  pillLabel: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  logButton: { backgroundColor: "#059669", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  logButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  backLink: { marginTop: 16, alignItems: "center" },
  backLinkText: { color: "#059669", fontSize: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  permText: { fontSize: 16, color: "#475569", textAlign: "center", marginBottom: 20 },
  camera: { flex: 1, minHeight: 300 },
  manualRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16 },
  quickForm: { padding: 16 },
  quickLabel: { fontSize: 14, fontWeight: "600", color: "#404040", marginTop: 12, marginLeft: 16 },
});
