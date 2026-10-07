import { describe, expect, it } from 'vitest';

import { safeStorage } from './storage';
import {
  isThemePreference,
  readStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './theme';

describe('theme', () => {
  it('resolves system preference from the media query', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('explicit preference ignores the system value', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('validates preference values', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('blue')).toBe(false);
  });

  it('falls back to system for missing or broken stored values', () => {
    safeStorage.removeItem(THEME_STORAGE_KEY);
    expect(readStoredThemePreference()).toBe('system');
    safeStorage.setItem(THEME_STORAGE_KEY, 'garbage');
    expect(readStoredThemePreference()).toBe('system');
    safeStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredThemePreference()).toBe('dark');
    safeStorage.removeItem(THEME_STORAGE_KEY);
  });
});
