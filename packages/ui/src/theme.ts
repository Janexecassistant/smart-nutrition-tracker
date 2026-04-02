/**
 * Smart Nutrition Tracker design tokens.
 *
 * These values are the single source of truth for colors, spacing,
 * and typography. Both web (Tailwind custom properties) and mobile
 * (React Native StyleSheet) reference these.
 */

export const colors = {
  // Brand
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#86efac",
  accent: "#3b82f6",

  // Macros (consistent across all charts and UI)
  protein: "#3b82f6",
  carbs: "#f59e0b",
  fat: "#ef4444",
  calories: "#22c55e",
  fiber: "#8b5cf6",

  // Semantic
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",

  // Neutrals
  bg: "#fafafa",
  surface: "#ffffff",
  surfaceHover: "#f5f5f5",
  border: "#e5e5e5",
  borderLight: "#f5f5f5",
  text: "#171717",
  textSecondary: "#525252",
  textMuted: "#737373",
  textPlaceholder: "#a3a3a3",

  // Dark mode
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
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
