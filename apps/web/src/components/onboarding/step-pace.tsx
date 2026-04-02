"use client";

import { useOnboarding } from "@/lib/onboarding-store";

const PACES = [
  { value: 0.25, label: "~0.5 lb/week", desc: "Slow and sustainable (~275 cal/day)", tag: "Recommended" },
  { value: 0.5, label: "~1 lb/week", desc: "Standard pace (~550 cal/day)", tag: "Popular" },
  { value: 0.75, label: "~1.5 lb/week", desc: "Aggressive (~825 cal/day)", tag: null },
  { value: 1.0, label: "~2 lb/week", desc: "Maximum safe rate (~1100 cal/day)", tag: null },
];

export function StepPace() {
  const { data, updateData, nextStep } = useOnboarding();

  // Only show pace options for lose/gain (maintain doesn't need one)
  if (data.goal === "maintain") {
    return (
      <div>
        <h2 className="text-xl font-bold mb-1">Maintenance mode</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Since your goal is to maintain, we'll set your calories to match your
          daily energy expenditure. No deficit or surplus needed.
        </p>

        <div className="bg-emerald-50 rounded-xl p-6 text-center mb-6">
          <span className="text-4xl">⚖️</span>
          <p className="text-sm text-emerald-800 mt-2 font-medium">
            Your target will be set to your TDEE
          </p>
        </div>

        <button
          onClick={() => {
            updateData({ targetPaceKgPerWeek: 0 });
            nextStep();
          }}
          className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  const directionWord = data.goal === "lose" ? "lose" : "gain";

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">How fast do you want to {directionWord}?</h2>
      <p className="text-neutral-500 text-sm mb-6">
        Slower paces are easier to stick with and preserve more muscle.
      </p>

      <div className="space-y-2 mb-6">
        {PACES.map((pace) => (
          <button
            key={pace.value}
            onClick={() => updateData({ targetPaceKgPerWeek: pace.value })}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
              data.targetPaceKgPerWeek === pace.value
                ? "bg-emerald-50 border-2 border-emerald-600"
                : "bg-white border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{pace.label}</span>
                {pace.tag && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {pace.tag}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">{pace.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {data.targetPaceKgPerWeek >= 0.75 && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-lg mb-4">
          Aggressive paces can be harder to maintain. Consider starting slower
          and adjusting after 2-3 weeks.
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
