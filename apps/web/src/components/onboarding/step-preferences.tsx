"use client";

import { useOnboarding } from "@/lib/onboarding-store";
import type { DietaryPreference } from "@snt/shared";

const PREFERENCES: {
  value: DietaryPreference;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { value: "none", label: "No Preference", desc: "Standard balanced diet", icon: "🍽️" },
  { value: "high_protein", label: "High Protein", desc: "Prioritize protein for muscle & satiety", icon: "🥩" },
  { value: "low_carb", label: "Low Carb", desc: "Reduce carbohydrates, higher fat", icon: "🥑" },
  { value: "keto", label: "Keto", desc: "Very low carb, high fat (under 30g carbs)", icon: "🧈" },
  { value: "vegetarian", label: "Vegetarian", desc: "No meat, includes dairy & eggs", icon: "🥚" },
  { value: "vegan", label: "Vegan", desc: "No animal products at all", icon: "🌱" },
  { value: "paleo", label: "Paleo", desc: "Whole foods, no grains or processed food", icon: "🦴" },
  { value: "gluten_free", label: "Gluten Free", desc: "Avoid wheat, barley, and rye", icon: "🌾" },
  { value: "dairy_free", label: "Dairy Free", desc: "No milk, cheese, or dairy products", icon: "🥛" },
];

export function StepPreferences() {
  const { data, updateData, nextStep } = useOnboarding();

  function toggle(pref: DietaryPreference) {
    const current = data.dietaryPreferences;

    // "none" is exclusive — selecting it clears others
    if (pref === "none") {
      updateData({ dietaryPreferences: ["none"] });
      return;
    }

    // Selecting anything else removes "none"
    const without = current.filter((p) => p !== "none" && p !== pref);
    const wasSelected = current.includes(pref);

    if (wasSelected) {
      // Deselecting — if nothing left, default back to "none"
      updateData({
        dietaryPreferences: without.length === 0 ? ["none"] : without,
      });
    } else {
      // Keto and low_carb are mutually exclusive
      let next = [...without, pref];
      if (pref === "keto") next = next.filter((p) => p !== "low_carb");
      if (pref === "low_carb") next = next.filter((p) => p !== "keto");
      // Vegan implies vegetarian restrictions (but we keep both for clarity)
      updateData({ dietaryPreferences: next });
    }
  }

  const isSelected = (pref: DietaryPreference) =>
    data.dietaryPreferences.includes(pref);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Dietary preferences</h2>
      <p className="text-neutral-500 text-sm mb-6">
        Select any that apply. This adjusts your macro split and food
        suggestions.
      </p>

      <div className="space-y-2 mb-6">
        {PREFERENCES.map((pref) => (
          <button
            key={pref.value}
            onClick={() => toggle(pref.value)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
              isSelected(pref.value)
                ? "bg-emerald-50 border-2 border-emerald-600"
                : "bg-white border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <span className="text-2xl shrink-0">{pref.icon}</span>
            <div className="min-w-0">
              <div className="font-medium text-sm">{pref.label}</div>
              <div className="text-xs text-neutral-500">{pref.desc}</div>
            </div>
            {isSelected(pref.value) && (
              <span className="ml-auto text-emerald-600 shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      {data.dietaryPreferences.includes("keto") && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-lg mb-4">
          Keto mode sets carbs to under 30g/day and increases fat. Make sure
          this aligns with any medical advice you've received.
        </div>
      )}

      <button
        onClick={nextStep}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
