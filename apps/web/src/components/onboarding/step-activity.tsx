"use client";

import { useOnboarding } from "@/lib/onboarding-store";
import type { ActivityLevel } from "@snt/shared";
import { ACTIVITY_MULTIPLIERS } from "@snt/shared";

const LEVELS: {
  value: ActivityLevel;
  label: string;
  desc: string;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    desc: "Desk job, little to no exercise",
  },
  {
    value: "lightly_active",
    label: "Lightly Active",
    desc: "Light exercise 1-3 days per week",
  },
  {
    value: "moderately_active",
    label: "Moderately Active",
    desc: "Moderate exercise 3-5 days per week",
  },
  {
    value: "very_active",
    label: "Very Active",
    desc: "Hard exercise 6-7 days per week",
  },
  {
    value: "extremely_active",
    label: "Extremely Active",
    desc: "Athlete or physically demanding job + training",
  },
];

export function StepActivity() {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">How active are you?</h2>
      <p className="text-neutral-500 text-sm mb-6">
        Be honest — overestimating leads to slower progress.
      </p>

      <div className="space-y-2 mb-6">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => updateData({ activityLevel: level.value })}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
              data.activityLevel === level.value
                ? "bg-green-50 border-2 border-green-500"
                : "bg-white border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div>
              <div className="font-medium text-sm">{level.label}</div>
              <div className="text-xs text-neutral-500">{level.desc}</div>
            </div>
            <span className="text-xs text-neutral-400 ml-2 shrink-0">
              {ACTIVITY_MULTIPLIERS[level.value]}×
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={nextStep}
        disabled={!data.activityLevel}
        className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
