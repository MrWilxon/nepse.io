import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { DarkTheme, LightTheme, ThemeColors } from "../constants/colors";
import { useThemeStore } from "../stores/useThemeStore";

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DarkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isDark, toggleTheme } = useThemeStore();
  const colors = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
