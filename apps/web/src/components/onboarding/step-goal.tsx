"use client";

import { useOnboarding } from "@/lib/onboarding-store";
import type { Goal } from "@snt/shared";

const GOALS: { value: Goal; label: string; desc: string; icon: string }[] = [
  {
    value: "lose",
    label: "Lose Weight",
    desc: "Calorie deficit for sustainable fat loss",
    icon: "📉",
  },
  {
    value: "gain",
    label: "Gain Muscle",
    desc: "Calorie surplus to support muscle growth",
    icon: "💪",
  },
  {
    value: "maintain",
    label: "Maintain Weight",
    desc: "Stay where you are, optimize nutrition",
    icon: "⚖️",
  },
];

export function StepGoal() {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">What's your goal?</h2>
      <p className="text-neutral-500 text-sm mb-6">
        This determines whether we set a calorie deficit, surplus, or maintenance target.
      </p>

      <div className="space-y-3 mb-6">
        {GOALS.map((g) => (
          <button
            key={g.value}
            onClick={() => updateData({ goal: g.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
              data.goal === g.value
                ? "bg-green-50 border-2 border-green-500"
                : "bg-white border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <span className="text-3xl">{g.icon}</span>
            <div>
              <div className="font-semibold text-base">{g.label}</div>
              <div className="text-sm text-neutral-500">{g.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={nextStep}
        disabled={!data.goal}
        className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
