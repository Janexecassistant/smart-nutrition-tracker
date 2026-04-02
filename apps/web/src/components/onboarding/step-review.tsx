"use client";

import { useMemo } from "react";
import { useOnboarding } from "@/lib/onboarding-store";
import { calculateTargets } from "@snt/nutrition";
import { ACTIVITY_MULTIPLIERS } from "@snt/shared";
import type { TargetCalculationResult } from "@snt/nutrition";

export function StepReview({ onSubmit }: { onSubmit: () => void }) {
  const { data, prevStep } = useOnboarding();

  const result: TargetCalculationResult | null = useMemo(() => {
    if (
      !data.sex ||
      !data.heightCm ||
      !data.currentWeightKg ||
      !data.activityLevel ||
      !data.goal ||
      !data.dateOfBirth
    )
      return null;

    return calculateTargets({
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      heightCm: data.heightCm,
      weightKg: data.currentWeightKg,
      activityLevel: data.activityLevel,
      goal: data.goal,
      targetPaceKgPerWeek: data.targetPaceKgPerWeek,
      dietaryPreferences: data.dietaryPreferences,
    });
  }, [data]);

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">
          Some required fields are missing. Please go back and fill them in.
        </p>
        <button
          onClick={prevStep}
          className="mt-4 text-emerald-700 font-medium text-sm"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const { bmr, tdee, targets, calorieFloorApplied, proteinFloorApplied } =
    result;

  const goalLabel =
    data.goal === "lose"
      ? "Weight Loss"
      : data.goal === "gain"
      ? "Muscle Gain"
      : "Maintenance";

  const isImperial = data.unitSystem === "imperial";
  const displayWeight = isImperial
    ? `${Math.round(data.currentWeightKg! * 2.20462)} lbs`
    : `${Math.round(data.currentWeightKg!)} kg`;

  const displayHeight = isImperial
    ? `${Math.floor(data.heightCm! / 2.54 / 12)}′${Math.round(
        (data.heightCm! / 2.54) % 12
      )}″`
    : `${Math.round(data.heightCm!)} cm`;

  const macroTotal = targets.proteinG + targets.carbsG + targets.fatG;
  const proteinPct = Math.round((targets.proteinG / macroTotal) * 100);
  const carbsPct = Math.round((targets.carbsG / macroTotal) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Your personalized plan</h2>
      <p className="text-neutral-500 text-sm mb-6">
        Here's what we've calculated based on your profile. You can always
        adjust these later.
      </p>

      {/* Calorie target — hero card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white text-center mb-4">
        <div className="text-sm font-medium opacity-90 mb-1">
          Daily Calorie Target
        </div>
        <div className="text-5xl font-bold tracking-tight">
          {targets.calories.toLocaleString()}
        </div>
        <div className="text-sm opacity-80 mt-1">calories / day</div>
        <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
          {goalLabel}
          {data.goal !== "maintain" &&
            ` · ~${(data.targetPaceKgPerWeek * 2.20462).toFixed(1)} lb/week`}
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-neutral-700 mb-3">
          Macro Targets
        </div>

        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden mb-3">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${proteinPct}%` }}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${carbsPct}%` }}
          />
          <div
            className="bg-rose-400 transition-all"
            style={{ width: `${fatPct}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {Math.round(targets.proteinG)}g
            </div>
            <div className="text-xs text-neutral-500">
              Protein · {proteinPct}%
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-500">
              {Math.round(targets.carbsG)}g
            </div>
            <div className="text-xs text-neutral-500">Carbs · {carbsPct}%</div>
          </div>
          <div>
            <div className="text-lg font-bold text-rose-500">
              {Math.round(targets.fatG)}g
            </div>
            <div className="text-xs text-neutral-500">Fat · {fatPct}%</div>
          </div>
        </div>
      </div>

      {/* Profile summary */}
      <div className="bg-neutral-50 rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-neutral-700 mb-2">
          Profile Summary
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="text-neutral-500">Height</div>
          <div className="font-medium text-right">{displayHeight}</div>
          <div className="text-neutral-500">Weight</div>
          <div className="font-medium text-right">{displayWeight}</div>
          <div className="text-neutral-500">Activity</div>
          <div className="font-medium text-right capitalize">
            {data.activityLevel?.replace("_", " ")}
          </div>
          <div className="text-neutral-500">BMR</div>
          <div className="font-medium text-right">
            {bmr.toLocaleString()} cal
          </div>
          <div className="text-neutral-500">TDEE</div>
          <div className="font-medium text-right">
            {tdee.toLocaleString()} cal
          </div>
          {data.dietaryPreferences.length > 0 &&
            !data.dietaryPreferences.includes("none") && (
              <>
                <div className="text-neutral-500">Diet</div>
                <div className="font-medium text-right capitalize">
                  {data.dietaryPreferences
                    .map((p) => p.replace("_", " "))
                    .join(", ")}
                </div>
              </>
            )}
          {(data.healthFocus || []).length > 0 && (
            <>
              <div className="text-neutral-500">Health Focus</div>
              <div className="font-medium text-right capitalize">
                {(data.healthFocus || [])
                  .map((h) => h.replace("_", " "))
                  .join(", ")}
              </div>
            </>
          )}
          {data.allergies.length > 0 && (
            <>
              <div className="text-neutral-500">Allergies</div>
              <div className="font-medium text-right capitalize">
                {data.allergies.map((a) => a.replace("_", " ")).join(", ")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Warnings */}
      {calorieFloorApplied && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-lg mb-3">
          Your calculated deficit was below the safe minimum. We've raised your
          target to the recommended floor to keep you healthy.
        </div>
      )}
      {proteinFloorApplied && (
        <div className="bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-lg mb-3">
          We've increased your protein target to meet the minimum recommended
          intake for your body weight (0.7g/kg).
        </div>
      )}

      {/* Actions */}
      <button
        onClick={onSubmit}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors mb-2"
      >
        Looks great — let's go!
      </button>
      <button
        onClick={prevStep}
        className="w-full py-2.5 text-neutral-500 text-sm font-medium hover:text-neutral-700 transition-colors"
      >
        ← Go back and adjust
      </button>
    </div>
  );
}
