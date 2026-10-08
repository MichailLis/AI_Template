import { create } from 'zustand';

import { safeStorage } from '@/shared/lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ai_template.admin.theme';
export const DARK_THEME_CLASS = 'dark';

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export const readStoredThemePreference = (): ThemePreference => {
  const stored = safeStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : 'system';
};

export const resolveTheme = (
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
};

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: readStoredThemePreference(),
  setPreference: (preference) => {
    safeStorage.setItem(THEME_STORAGE_KEY, preference);
    set({ preference });
  },
}));
