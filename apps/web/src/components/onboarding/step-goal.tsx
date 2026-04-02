"use client";

import { useOnboarding } from "@/lib/onboarding-store";
import type { Goal, HealthFocus } from "@snt/shared";

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

const HEALTH_FOCUSES: {
  value: HealthFocus;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: "pregnancy",
    label: "Healthy Pregnancy",
    desc: "Higher folate, iron, calcium — safe macro ranges",
    icon: "🤰",
  },
  {
    value: "diabetic",
    label: "Diabetic Friendly",
    desc: "Low glycemic, controlled carbs, balanced blood sugar",
    icon: "🩸",
  },
  {
    value: "celiac",
    label: "Celiac / Gluten-Free",
    desc: "Strict gluten avoidance with nutrient monitoring",
    icon: "🌾",
  },
  {
    value: "low_sodium",
    label: "Low Sodium",
    desc: "Under 1,500mg sodium daily for blood pressure",
    icon: "🧂",
  },
  {
    value: "heart_healthy",
    label: "Heart Healthy",
    desc: "Low saturated fat, high omega-3, fiber focus",
    icon: "❤️",
  },
  {
    value: "kidney_friendly",
    label: "Kidney Friendly",
    desc: "Controlled potassium, phosphorus, and protein",
    icon: "💧",
  },
  {
    value: "ibs_fodmap",
    label: "IBS / Low FODMAP",
    desc: "Avoid high-FODMAP foods that trigger symptoms",
    icon: "🫃",
  },
  {
    value: "anti_inflammatory",
    label: "Anti-Inflammatory",
    desc: "Focus on omega-3, antioxidants, whole foods",
    icon: "🛡️",
  },
  {
    value: "pcos",
    label: "PCOS Support",
    desc: "Balanced insulin response, anti-inflammatory focus",
    icon: "🔬",
  },
];

export function StepGoal() {
  const { data, updateData, nextStep } = useOnboarding();

  function toggleHealthFocus(focus: HealthFocus) {
    const current = data.healthFocus || [];

    if (focus === "none") {
      updateData({ healthFocus: [] });
      return;
    }

    const wasSelected = current.includes(focus);
    if (wasSelected) {
      updateData({ healthFocus: current.filter((f) => f !== focus) });
    } else {
      updateData({ healthFocus: [...current.filter((f) => f !== "none"), focus] });
    }
  }

  const isFocusSelected = (focus: HealthFocus) =>
    (data.healthFocus || []).includes(focus);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">What's your goal?</h2>
      <p className="text-neutral-500 text-sm mb-6">
        This determines your calorie and macro targets.
      </p>

      {/* Weight Goal */}
      <div className="space-y-3 mb-8">
        {GOALS.map((g) => (
          <button
            key={g.value}
            onClick={() => updateData({ goal: g.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
              data.goal === g.value
                ? "bg-emerald-50 border-2 border-emerald-600"
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

      {/* Health Focus — optional multi-select */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-1">
          Any health considerations?
        </h3>
        <p className="text-neutral-500 text-xs mb-4">
          Optional — select any that apply. We'll tailor nutrients and food suggestions.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {HEALTH_FOCUSES.map((hf) => (
            <button
              key={hf.value}
              onClick={() => toggleHealthFocus(hf.value)}
              className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all ${
                isFocusSelected(hf.value)
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-white border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{hf.icon}</span>
              <div className="min-w-0">
                <div className="font-medium text-sm leading-tight">{hf.label}</div>
                <div className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                  {hf.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pregnancy warning */}
      {isFocusSelected("pregnancy") && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-lg mb-4">
          Pregnancy mode increases calorie and nutrient targets based on trimester.
          Always follow your doctor's guidance for your specific needs.
        </div>
      )}

      {/* Diabetic info */}
      {isFocusSelected("diabetic") && (
        <div className="bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-lg mb-4">
          Diabetic mode focuses on controlled carb intake, low glycemic foods, and
          balanced meals. Consult your healthcare provider for personalized targets.
        </div>
      )}

      <button
        onClick={nextStep}
        disabled={!data.goal}
        className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
