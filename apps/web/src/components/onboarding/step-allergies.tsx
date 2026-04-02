"use client";

import { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-store";

const COMMON_ALLERGENS = [
  { value: "peanuts", label: "Peanuts", icon: "🥜" },
  { value: "tree_nuts", label: "Tree Nuts", icon: "🌰" },
  { value: "dairy", label: "Dairy", icon: "🧀" },
  { value: "eggs", label: "Eggs", icon: "🥚" },
  { value: "soy", label: "Soy", icon: "🫘" },
  { value: "wheat", label: "Wheat / Gluten", icon: "🌾" },
  { value: "fish", label: "Fish", icon: "🐟" },
  { value: "shellfish", label: "Shellfish", icon: "🦐" },
  { value: "sesame", label: "Sesame", icon: "⚪" },
];

export function StepAllergies() {
  const { data, updateData, nextStep } = useOnboarding();
  const [customInput, setCustomInput] = useState("");

  function toggleAllergen(allergen: string) {
    const current = data.allergies;
    if (current.includes(allergen)) {
      updateData({ allergies: current.filter((a) => a !== allergen) });
    } else {
      updateData({ allergies: [...current, allergen] });
    }
  }

  function addCustom() {
    const trimmed = customInput.trim().toLowerCase();
    if (!trimmed || data.allergies.includes(trimmed)) return;
    updateData({ allergies: [...data.allergies, trimmed] });
    setCustomInput("");
  }

  function removeCustom(allergen: string) {
    updateData({ allergies: data.allergies.filter((a) => a !== allergen) });
  }

  // Custom allergies are ones not in the common list
  const commonValues = COMMON_ALLERGENS.map((a) => a.value);
  const customAllergies = data.allergies.filter(
    (a) => !commonValues.includes(a)
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Any food allergies?</h2>
      <p className="text-neutral-500 text-sm mb-6">
        We'll exclude these from food suggestions. You can always update this
        later.
      </p>

      {/* Common allergens grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {COMMON_ALLERGENS.map((allergen) => {
          const selected = data.allergies.includes(allergen.value);
          return (
            <button
              key={allergen.value}
              onClick={() => toggleAllergen(allergen.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all ${
                selected
                  ? "bg-red-50 border-2 border-red-400"
                  : "bg-white border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="text-2xl">{allergen.icon}</span>
              <span
                className={`text-xs font-medium ${
                  selected ? "text-red-600" : "text-neutral-600"
                }`}
              >
                {allergen.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom allergen input */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-600 mb-1">
          Other allergies or intolerances
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g., corn, sulfites..."
            className="flex-1 px-4 py-3 bg-neutral-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-4 py-3 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Custom allergen tags */}
      {customAllergies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {customAllergies.map((allergen) => (
            <span
              key={allergen}
              className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {allergen}
              <button
                onClick={() => removeCustom(allergen)}
                className="ml-0.5 text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {data.allergies.length === 0 && (
        <div className="bg-green-50 text-green-700 text-xs px-4 py-3 rounded-lg mb-4">
          No allergies selected — all foods will be included in suggestions.
        </div>
      )}

      <button
        onClick={nextStep}
        className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
      >
        {data.allergies.length === 0 ? "Skip — No Allergies" : "Continue"}
      </button>
    </div>
  );
}
