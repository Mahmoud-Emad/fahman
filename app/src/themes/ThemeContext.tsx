/**
 * Theme Context for the Fahman app
 * Currently light mode only - dark mode can be added later
 */
import React, { createContext, useContext, type ReactNode } from "react";

/**
 * Theme context value interface
 */
interface ThemeContextValue {
  /** Current theme mode (light only for now) */
  mode: "light";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * ThemeProvider component
 * Wraps the app and provides theme context to all children
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const value: ThemeContextValue = {
    mode: "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
