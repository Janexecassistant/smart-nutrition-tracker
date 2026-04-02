"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/lib/onboarding-store";
import type { Sex, UnitSystem } from "@snt/shared";

export function StepBasics() {
  const { data, updateData, nextStep } = useOnboarding();

  const isImperial = data.unitSystem === "imperial";

  // Convert display values
  const displayWeight = isImperial && data.currentWeightKg
    ? Math.round(data.currentWeightKg * 2.20462 * 10) / 10
    : data.currentWeightKg;

  // Keep feet/inches as local state to avoid circular conversion issues
  const [feet, setFeet] = useState<string>(() => {
    if (!data.heightCm) return "";
    return String(Math.floor(data.heightCm / 2.54 / 12));
  });
  const [inches, setInches] = useState<string>(() => {
    if (!data.heightCm) return "";
    return String(Math.round((data.heightCm / 2.54) % 12));
  });

  // Sync feet/inches to heightCm whenever either changes
  useEffect(() => {
    const f = parseInt(feet) || 0;
    const i = parseInt(inches) || 0;
    if (f === 0 && i === 0) {
      updateData({ heightCm: null });
    } else {
      updateData({ heightCm: (f * 12 + i) * 2.54 });
    }
  }, [feet, inches]);

  function setWeight(val: string) {
    const num = parseFloat(val);
    if (isNaN(num)) { updateData({ currentWeightKg: null }); return; }
    updateData({ currentWeightKg: isImperial ? num / 2.20462 : num });
  }

  function setHeightMetric(cm: string) {
    const num = parseFloat(cm);
    updateData({ heightCm: isNaN(num) ? null : num });
  }

  const canContinue =
    data.dateOfBirth && data.sex && data.heightCm && data.currentWeightKg;

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Tell us about you</h2>
      <p className="text-neutral-500 text-sm mb-6">
        We use this to calculate your calorie and macro targets.
      </p>

      {/* Unit toggle */}
      <div className="flex gap-2 mb-6">
        {(["imperial", "metric"] as UnitSystem[]).map((sys) => (
          <button
            key={sys}
            onClick={() => updateData({ unitSystem: sys })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              data.unitSystem === sys
                ? "bg-green-500 text-white"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {sys === "imperial" ? "Imperial (lbs, ft)" : "Metric (kg, cm)"}
          </button>
        ))}
      </div>

      {/* Date of birth */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-600 mb-1">Date of Birth</label>
        <input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => updateData({ dateOfBirth: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
        />
      </div>

      {/* Sex */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-600 mb-1">Biological Sex</label>
        <p className="text-xs text-neutral-400 mb-2">Used for BMR calculation accuracy</p>
        <div className="flex gap-2">
          {(["male", "female", "other"] as Sex[]).map((s) => (
            <button
              key={s}
              onClick={() => updateData({ sex: s })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                data.sex === s
                  ? "bg-green-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="mb-4">
        <label className="block text-sm text-neutral-600 mb-1">Height</label>
        {isImperial ? (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
                placeholder="5"
                min={3}
                max={8}
                className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all pr-10"
              />
              <span className="absolute right-3 top-3 text-neutral-400 text-sm">ft</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                value={inches}
                onChange={(e) => setInches(e.target.value)}
                placeholder="10"
                min={0}
                max={11}
                className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all pr-10"
              />
              <span className="absolute right-3 top-3 text-neutral-400 text-sm">in</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="number"
              value={data.heightCm ?? ""}
              onChange={(e) => setHeightMetric(e.target.value)}
              placeholder="175"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all pr-12"
            />
            <span className="absolute right-3 top-3 text-neutral-400 text-sm">cm</span>
          </div>
        )}
      </div>

      {/* Weight */}
      <div className="mb-6">
        <label className="block text-sm text-neutral-600 mb-1">Current Weight</label>
        <div className="relative">
          <input
            type="number"
            value={displayWeight ?? ""}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={isImperial ? "185" : "84"}
            step="0.1"
            className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all pr-12"
          />
          <span className="absolute right-3 top-3 text-neutral-400 text-sm">
            {isImperial ? "lbs" : "kg"}
          </span>
        </div>
      </div>

      <button
        onClick={nextStep}
        disabled={!canContinue}
        className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
