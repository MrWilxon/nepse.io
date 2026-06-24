import { create } from "zustand";
import { storageGet, storageSet } from "../lib/storage";

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      storageSet("theme", next);
      return { isDark: next };
    }),
  setTheme: (isDark) => set({ isDark }),
}));

export async function loadThemeFromStorage() {
  const saved = await storageGet<boolean>("theme");
  if (saved !== null) useThemeStore.getState().setTheme(saved);
}
