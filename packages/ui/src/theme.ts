/**
 * Smart Nutrition Tracker design tokens.
 *
 * These values are the single source of truth for colors, spacing,
 * and typography. Both web (Tailwind custom properties) and mobile
 * (React Native StyleSheet) reference these.
 */

export const colors = {
  // ── Brand — Emerald Green ──────────────────────────────────────
  primary: "#059669",        // emerald-600 — main brand color
  primaryDark: "#047857",    // emerald-700 — hover / pressed states
  primaryLight: "#10b981",   // emerald-500 — secondary actions
  primaryLighter: "#34d399", // emerald-400 — rings, glows
  primaryFaint: "#6ee7b7",   // emerald-300 — subtle highlights
  primaryTint: "#d1fae5",    // emerald-100 — light backgrounds
  primaryBg: "#ecfdf5",      // emerald-50  — tinted surface

  accent: "#3b82f6",

  // ── Gradient stops (for headers & hero cards) ──────────────────
  gradientDark: "#064e3b",   // emerald-900
  gradientMid: "#065f46",    // emerald-800
  gradientLight: "#047857",  // emerald-700

  // ── Macros (consistent across all charts and UI) ───────────────
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
  calories: "#059669",
  fiber: "#8b5cf6",

  // ── Semantic ───────────────────────────────────────────────────
  success: "#059669",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",

  // ── Neutrals (light mode) ──────────────────────────────────────
  bg: "#f8faf9",             // very subtle warm-green tint
  surface: "#ffffff",
  surfaceElevated: "#f0fdf4", // emerald-50 — hero / featured cards
  surfaceHover: "#f5f5f5",
  border: "#e2e8f0",         // slate-200 — slightly cooler borders
  borderLight: "#f1f5f9",    // slate-100
  text: "#0f172a",           // slate-900 — deeper contrast
  textSecondary: "#475569",  // slate-600
  textMuted: "#64748b",      // slate-500
  textPlaceholder: "#94a3b8", // slate-400

  // ── Dark mode ──────────────────────────────────────────────────
  dark: {
    bg: "#0a0a0a",
    surface: "#171717",
    surfaceHover: "#262626",
    border: "#262626",
    borderLight: "#1f1f1f",
    text: "#fafafa",
    textSecondary: "#d4d4d4",
    textMuted: "#a3a3a3",
    textPlaceholder: "#737373",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const fontWeights = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadows = {
  sm: {
    shadowColor: "#064e3b",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#064e3b",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  lg: {
    shadowColor: "#064e3b",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;
