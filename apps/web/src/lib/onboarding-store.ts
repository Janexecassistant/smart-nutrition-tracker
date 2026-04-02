"use client";

import { create } from "zustand";
import type {
  Sex,
  Goal,
  ActivityLevel,
  DietaryPreference,
  UnitSystem,
} from "@snt/shared";

export interface OnboardingData {
  // Step 1: Basics
  dateOfBirth: string;
  sex: Sex | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  // Step 2: Goal
  goal: Goal | null;
  // Step 3: Activity
  activityLevel: ActivityLevel | null;
  // Step 4: Pace
  targetPaceKgPerWeek: number;
  // Step 5: Preferences
  dietaryPreferences: DietaryPreference[];
  allergies: string[];
  // Settings
  unitSystem: UnitSystem;
  timezone: string;
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

const TOTAL_STEPS = 7; // basics, goal, activity, pace, preferences, allergies, review

const initialData: OnboardingData = {
  dateOfBirth: "",
  sex: null,
  heightCm: null,
  currentWeightKg: null,
  goal: null,
  activityLevel: null,
  targetPaceKgPerWeek: 0.5,
  dietaryPreferences: [],
  allergies: [],
  unitSystem: "imperial",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const useOnboarding = create<OnboardingState>((set) => ({
  step: 1,
  data: { ...initialData },
  setStep: (step) => set({ step: Math.max(1, Math.min(TOTAL_STEPS, step)) }),
  nextStep: () => set((s) => ({ step: Math.min(TOTAL_STEPS, s.step + 1) })),
  prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),
  updateData: (partial) =>
    set((s) => ({ data: { ...s.data, ...partial } })),
  reset: () => set({ step: 1, data: { ...initialData } }),
}));

export const TOTAL_ONBOARDING_STEPS = TOTAL_STEPS;
