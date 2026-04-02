import { create } from "zustand";

export interface OnboardingData {
  // Step 1: Basics
  dateOfBirth: string; // YYYY-MM-DD
  sex: "male" | "female" | "other" | "";
  heightCm: number;
  currentWeightKg: number;
  unitSystem: "imperial" | "metric";

  // Step 2: Goal
  goal: "lose" | "gain" | "maintain" | "";
  healthFocus: string[];

  // Step 3: Activity
  activityLevel:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active"
    | "";

  // Step 4: Pace
  targetPaceKgPerWeek: number;

  // Step 5: Preferences
  dietaryPreferences: string[];

  // Step 6: Allergies
  allergies: string[];
}

interface OnboardingState {
  step: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const INITIAL_DATA: OnboardingData = {
  dateOfBirth: "",
  sex: "",
  heightCm: 0,
  currentWeightKg: 0,
  unitSystem: "imperial",
  goal: "",
  healthFocus: [],
  activityLevel: "",
  targetPaceKgPerWeek: 0.5,
  dietaryPreferences: [],
  allergies: [],
};

export const useOnboarding = create<OnboardingState>((set) => ({
  step: 1,
  data: { ...INITIAL_DATA },

  setStep: (step) => set({ step }),

  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 7) })),

  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),

  updateData: (partial) =>
    set((s) => ({ data: { ...s.data, ...partial } })),

  reset: () => set({ step: 1, data: { ...INITIAL_DATA } }),
}));
