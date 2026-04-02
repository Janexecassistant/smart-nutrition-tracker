"use client";

import { useRouter } from "next/navigation";
import { useOnboarding, TOTAL_ONBOARDING_STEPS } from "@/lib/onboarding-store";
import { useAuth } from "@/lib/auth";

import { StepBasics } from "@/components/onboarding/step-basics";
import { StepGoal } from "@/components/onboarding/step-goal";
import { StepActivity } from "@/components/onboarding/step-activity";
import { StepPace } from "@/components/onboarding/step-pace";
import { StepPreferences } from "@/components/onboarding/step-preferences";
import { StepAllergies } from "@/components/onboarding/step-allergies";
import { StepReview } from "@/components/onboarding/step-review";

export default function OnboardingPage() {
  const router = useRouter();
  const { step, prevStep, data, reset } = useOnboarding();
  const { session, supabase } = useAuth();

  async function handleSubmit() {
    if (!session?.access_token) {
      router.push("/auth/signin");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            dateOfBirth: data.dateOfBirth,
            sex: data.sex,
            heightCm: data.heightCm,
            currentWeightKg: data.currentWeightKg,
            goal: data.goal,
            activityLevel: data.activityLevel,
            targetPaceKgPerWeek: data.targetPaceKgPerWeek,
            dietaryPreferences: data.dietaryPreferences.filter(
              (p) => p !== "none"
            ),
            allergies: data.allergies,
            unitSystem: data.unitSystem,
            timezone: data.timezone,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Surface Zod validation errors or general API errors
        const msg =
          err.message ||
          (err.error?.issues
            ? err.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ")
            : null) ||
          (err.success === false && err.error
            ? JSON.stringify(err.error)
            : null) ||
          `Failed to save profile (${res.status})`;
        throw new Error(msg);
      }

      reset();
      router.push("/");
    } catch (err) {
      console.error("Onboarding submit error:", err);
      // TODO: show toast
      alert(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    }
  }

  const stepComponent = (() => {
    switch (step) {
      case 1:
        return <StepBasics />;
      case 2:
        return <StepGoal />;
      case 3:
        return <StepActivity />;
      case 4:
        return <StepPace />;
      case 5:
        return <StepPreferences />;
      case 6:
        return <StepAllergies />;
      case 7:
        return <StepReview onSubmit={handleSubmit} />;
      default:
        return <StepBasics />;
    }
  })();

  const progressPct = ((step - 1) / (TOTAL_ONBOARDING_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <span className="text-sm font-semibold text-neutral-800">
              Smart<span className="text-green-500">Nutrition</span>
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            Step {step} of {TOTAL_ONBOARDING_STEPS}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-neutral-200 h-1">
        <div
          className="bg-green-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">{stepComponent}</div>
      </main>
    </div>
  );
}
