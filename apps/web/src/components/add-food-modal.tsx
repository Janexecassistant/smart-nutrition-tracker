"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { BarcodeScanner } from "./barcode-scanner";
import type { MealSlot } from "@snt/shared";

interface AddFoodModalProps {
  slot: MealSlot;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

type Tab = "search" | "scan" | "quick";

interface FoodResult {
  id: string;
  name: string;
  brand?: string | null;
  calories: string | number;
  proteinG: string | number;
  carbsG: string | number;
  fatG: string | number;
  servingSizeG: string | number;
  servingLabel?: string | null;
}

const SLOT_COLORS: Record<string, { gradient: string; accent: string; bg: string }> = {
  breakfast: { gradient: "from-amber-400 to-orange-500", accent: "#f59e0b", bg: "#fffbeb" },
  lunch:     { gradient: "from-green-400 to-emerald-500", accent: "#22c55e", bg: "#f0fdf4" },
  dinner:    { gradient: "from-indigo-400 to-purple-500", accent: "#6366f1", bg: "#eef2ff" },
  snack:     { gradient: "from-rose-400 to-pink-500",    accent: "#f43f5e", bg: "#fff1f2" },
};

export function AddFoodModal({ slot, isOpen, onClose, onAdded }: AddFoodModalProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [servings, setServings] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Scan tab state
  const [scanResult, setScanResult] = useState<FoodResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  // Quick add state
  const [quickName, setQuickName] = useState("");
  const [quickCal, setQuickCal] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");

  const colors = SLOT_COLORS[slot] || SLOT_COLORS.snack;

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery(""); setResults([]); setSelected(null); setServings("1");
      setError(""); setTab("search");
      setQuickName(""); setQuickCal(""); setQuickProtein(""); setQuickCarbs(""); setQuickFat("");
      setScanResult(null); setScanLoading(false); setScanError("");
    }
  }, [isOpen]);

  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await api.get("/foods/search", { query: q, limit: "15" });
      setResults(data.foods || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoods(val), 300);
  }

  async function logFood() {
    if (!selected) return;
    setSaving(true); setError("");
    const mult = parseFloat(servings) || 1;
    const isOffFood = selected.id.startsWith("off_");
    try {
      await api.post("/logs", {
        mealSlot: slot,
        ...(isOffFood ? {} : { foodId: selected.id }),
        foodType: "global",
        foodName: selected.name,
        quantityG: Number(selected.servingSizeG) * mult,
        servingLabel: selected.servingLabel || `${Math.round(Number(selected.servingSizeG) * mult)}g`,
        calories: Math.round(Number(selected.calories) * mult),
        proteinG: Math.round(Number(selected.proteinG) * mult * 10) / 10,
        carbsG: Math.round(Number(selected.carbsG) * mult * 10) / 10,
        fatG: Math.round(Number(selected.fatG) * mult * 10) / 10,
      });
      onAdded(); onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log food");
    } finally { setSaving(false); }
  }

  async function logQuickAdd() {
    if (!quickName || !quickCal) return;
    setSaving(true); setError("");
    try {
      await api.post("/logs", {
        mealSlot: slot, foodType: "quick_add", foodName: quickName,
        quantityG: 100, servingLabel: "1 serving",
        calories: Math.round(parseFloat(quickCal) || 0),
        proteinG: Math.round((parseFloat(quickProtein) || 0) * 10) / 10,
        carbsG: Math.round((parseFloat(quickCarbs) || 0) * 10) / 10,
        fatG: Math.round((parseFloat(quickFat) || 0) * 10) / 10,
      });
      onAdded(); onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log food");
    } finally { setSaving(false); }
  }

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    setScanResult(null); setScanError(""); setScanLoading(true);
    try {
      const data = await api.get(`/foods/barcode/${barcode}`);
      if (data.food) {
        setScanResult({
          id: data.food.id, name: data.food.name, brand: data.food.brand,
          calories: data.food.calories, proteinG: data.food.proteinG,
          carbsG: data.food.carbsG, fatG: data.food.fatG,
          servingSizeG: data.food.servingSizeG, servingLabel: data.food.servingLabel,
        });
      } else { setScanError(`No food found for barcode ${barcode}`); }
    } catch { setScanError(`No food found for barcode ${barcode}`); }
    finally { setScanLoading(false); }
  }, []);

  async function logScannedFood() {
    if (!scanResult) return;
    setSaving(true); setError("");
    const mult = parseFloat(servings) || 1;
    const isOffFood = scanResult.id.startsWith("off_");
    try {
      await api.post("/logs", {
        mealSlot: slot,
        ...(isOffFood ? {} : { foodId: scanResult.id }),
        foodType: "global",
        foodName: scanResult.name,
        quantityG: Number(scanResult.servingSizeG) * mult,
        servingLabel: scanResult.servingLabel || `${Math.round(Number(scanResult.servingSizeG) * mult)}g`,
        calories: Math.round(Number(scanResult.calories) * mult),
        proteinG: Math.round(Number(scanResult.proteinG) * mult * 10) / 10,
        carbsG: Math.round(Number(scanResult.carbsG) * mult * 10) / 10,
        fatG: Math.round(Number(scanResult.fatG) * mult * 10) / 10,
      });
      onAdded(); onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log food");
    } finally { setSaving(false); }
  }

  if (!isOpen) return null;

  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  // Shared component for food detail + servings + macros
  function FoodDetailView({ food }: { food: FoodResult }) {
    const mult = parseFloat(servings) || 1;
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: colors.bg, borderColor: `${colors.accent}30` }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm text-neutral-800">{food.name}</p>
              {food.brand && <p className="text-xs text-neutral-500">{food.brand}</p>}
              <p className="text-xs text-neutral-400 mt-1">
                Per serving ({Number(food.servingSizeG)}g): {Number(food.calories)} cal
              </p>
            </div>
            {tab === "scan" && (
              <button
                onClick={() => { setScanResult(null); setScanError(""); }}
                className="text-xs font-medium whitespace-nowrap ml-2"
                style={{ color: colors.accent }}
              >
                Scan another
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 block mb-1">Number of servings</label>
          <input
            type="number" value={servings}
            onChange={(e) => setServings(e.target.value)}
            min="0.25" step="0.25"
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ "--tw-ring-color": `${colors.accent}40` } as any}
          />
        </div>

        {/* Macro preview pills */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: "cal", value: Math.round(Number(food.calories) * mult), color: "#22c55e", bg: "#f0fdf4" },
            { label: "protein", value: `${Math.round(Number(food.proteinG) * mult)}g`, color: "#6366f1", bg: "#eef2ff" },
            { label: "carbs", value: `${Math.round(Number(food.carbsG) * mult)}g`, color: "#f59e0b", bg: "#fffbeb" },
            { label: "fat", value: `${Math.round(Number(food.fatG) * mult)}g`, color: "#f43f5e", bg: "#fff1f2" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-2.5" style={{ backgroundColor: m.bg }}>
              <p className="font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-neutral-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">

        {/* Colored header bar */}
        <div className={`bg-gradient-to-r ${colors.gradient} px-4 pt-4 pb-3`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Add to {slotLabel}</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs - glass style */}
          <div className="flex gap-1 bg-black/20 rounded-lg p-0.5">
            {([
              { key: "search" as Tab, label: "Search", icon: "🔍" },
              { key: "scan" as Tab, label: "Scan", icon: "📷" },
              { key: "quick" as Tab, label: "Quick Add", icon: "⚡" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  tab === t.key
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "search" ? (
            <>
              {/* Search input */}
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={searchRef}
                  type="text" value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search for a food..."
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ "--tw-ring-color": `${colors.accent}40` } as any}
                />
              </div>

              {selected ? (
                <FoodDetailView food={selected} />
              ) : (
                <>
                  {searching && (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.accent} transparent transparent transparent` }} />
                      <p className="text-sm text-neutral-400">Searching...</p>
                    </div>
                  )}

                  {!searching && query.length >= 2 && results.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🤷</span>
                      </div>
                      <p className="text-sm text-neutral-500 mb-1">No foods found for &ldquo;{query}&rdquo;</p>
                      <button
                        onClick={() => { setTab("quick"); setQuickName(query); }}
                        className="text-sm font-medium mt-2"
                        style={{ color: colors.accent }}
                      >
                        Quick add &ldquo;{query}&rdquo; instead →
                      </button>
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <ul className="space-y-0.5">
                      {results.map((food) => (
                        <li key={food.id}>
                          <button
                            onClick={() => { setSelected(food); setServings("1"); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate text-neutral-800">{food.name}</p>
                                <p className="text-xs text-neutral-400">
                                  {food.brand && `${food.brand} · `}
                                  {Number(food.servingSizeG)}g serving
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <p className="text-sm font-semibold" style={{ color: colors.accent }}>
                                  {Number(food.calories)}
                                </p>
                                <p className="text-xs text-neutral-400">cal</p>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!searching && query.length < 2 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🔍</span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Type at least 2 characters to search
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : tab === "scan" ? (
            /* Scan Tab */
            <div className="space-y-3">
              {!scanResult ? (
                <>
                  <BarcodeScanner
                    onDetected={handleBarcodeDetected}
                    onError={(err) => setScanError(err)}
                  />
                  {scanLoading && (
                    <div className="flex items-center justify-center py-3 gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.accent} transparent transparent transparent` }} />
                      <span className="text-sm text-neutral-500">Looking up barcode...</span>
                    </div>
                  )}
                  {scanError && (
                    <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg text-center">
                      {scanError}
                      <button onClick={() => setScanError("")} className="block mx-auto mt-1 text-red-500 underline">
                        Try again
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <FoodDetailView food={scanResult} />
              )}
            </div>
          ) : (
            /* Quick Add Tab */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Food name *</label>
                <input type="text" value={quickName} onChange={(e) => setQuickName(e.target.value)}
                  placeholder="e.g. Chicken breast"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ "--tw-ring-color": `${colors.accent}40` } as any}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Calories *</label>
                <input type="number" value={quickCal} onChange={(e) => setQuickCal(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:bg-white transition-all"
                  style={{ "--tw-ring-color": `${colors.accent}40` } as any}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Protein (g)", value: quickProtein, set: setQuickProtein, color: "#6366f1" },
                  { label: "Carbs (g)", value: quickCarbs, set: setQuickCarbs, color: "#f59e0b" },
                  { label: "Fat (g)", value: quickFat, set: setQuickFat, color: "#f43f5e" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs block mb-1" style={{ color: f.color }}>{f.label}</label>
                    <input type="number" value={f.value} onChange={(e) => f.set(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:bg-white transition-all"
                      style={{ "--tw-ring-color": `${f.color}40` } as any}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-xs">{error}</div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-100">
          {tab === "search" ? (
            <button onClick={logFood} disabled={!selected || saving}
              className={`w-full py-2.5 text-white font-semibold rounded-xl bg-gradient-to-r ${colors.gradient} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm shadow-sm`}>
              {saving ? "Logging..." : "Log Food"}
            </button>
          ) : tab === "scan" ? (
            <button onClick={logScannedFood} disabled={!scanResult || saving}
              className={`w-full py-2.5 text-white font-semibold rounded-xl bg-gradient-to-r ${colors.gradient} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm shadow-sm`}>
              {saving ? "Logging..." : "Log Scanned Food"}
            </button>
          ) : (
            <button onClick={logQuickAdd} disabled={!quickName || !quickCal || saving}
              className={`w-full py-2.5 text-white font-semibold rounded-xl bg-gradient-to-r ${colors.gradient} hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm shadow-sm`}>
              {saving ? "Logging..." : "Quick Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
