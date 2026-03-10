/**
 * Color definitions for the Fahman app
 * Use these constants for style props where NativeWind classes can't be used
 * For NativeWind classes, use the theme classes (e.g., bg-primary-500, text-text)
 */

/**
 * Color constants for use in style props
 * These mirror the CSS custom properties in global.css
 */
export const colors = {
  // Primary - Orange
  primary: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },

  // Neutral - Grays
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },

  // Base colors
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",

  // Text colors
  text: {
    primary: "#000000",
    secondary: "#525252",
    muted: "#a3a3a3",
    inverse: "#ffffff",
  },

  // Background colors
  background: "#ffffff",
  surface: "#ffffff",
  surfaceSecondary: "#f5f5f5",

  // Border colors
  border: "#e5e5e5",

  // Status colors
  success: "#22c55e",
  warning: "#f97316",
  error: "#ef4444",
  info: "#f97316",

  // Special colors
  gold: "#FFD700",

  // Medal colors for podiums/rankings
  medals: {
    gold: { bg: "#FFD700", border: "#DAA520", text: "#5D4E37" },
    silver: { bg: "#C0C0C0", border: "#A8A8A8", text: "#5D4E37" },
    bronze: { bg: "#CD7F32", border: "#8B4513", text: "#ffffff" },
  },

  // Accent colors for UI variety (room cards, stat cards, etc.)
  accent: {
    blue: "#3B82F6",
    violet: "#8B5CF6",
    pink: "#EC4899",
    emerald: "#10B981",
    amber: "#F59E0B",
  },

  // Confetti celebration palette
  confetti: {
    coral: "#FF6B6B",
    teal: "#4ECDC4",
    purple: "#A855F7",
    blue: "#3B82F6",
  },

  // Brand colors for social login buttons
  brands: {
    google: "#EA4335",
    facebook: "#1877F2",
  },
} as const;

/**
 * Helper to create rgba color with opacity
 */
export const withOpacity = (color: string, opacity: number): string => {
  if (!color) return 'rgba(0, 0, 0, 0)'; // Return transparent if color is undefined/null
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Theme color keys that are available in the app
 * Used for type-safe color props in components
 */
export const themeColorKeys = [
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
  "text",
  "text-secondary",
  "text-muted",
  "background",
  "surface",
  "border",
] as const;

export type ThemeColorKey = (typeof themeColorKeys)[number];

/**
 * Maps semantic color names to Tailwind class prefixes
 */
export const colorClassMap: Record<ThemeColorKey, string> = {
  primary: "primary-500",
  secondary: "secondary-500",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  text: "text",
  "text-secondary": "text-secondary",
  "text-muted": "text-muted",
  background: "background",
  surface: "surface",
  border: "border",
};

/**
 * Size scale for consistent sizing across components
 */
export const sizeScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export type SizeKey = keyof typeof sizeScale;
