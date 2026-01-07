import { useEffect, useCallback } from 'react';
import { useSettingsStore, selectTheme } from '@/stores/settingsStore';
import type { ThemeMode } from '@/types';

type ResolvedTheme = 'light' | 'dark';

export function useTheme() {
  const themePreference = useSettingsStore(selectTheme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  // Resolve 'system' to actual theme
  const getResolvedTheme = useCallback((): ResolvedTheme => {
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference]);

  // Apply theme to DOM
  const applyTheme = useCallback((theme: ResolvedTheme) => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0D0F12' : '#FAF9F7');
    }
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply theme on mount and changes, sync localStorage
  useEffect(() => {
    const resolved = getResolvedTheme();
    applyTheme(resolved);

    // Sync localStorage with Dexie value for FOUC prevention
    if (themePreference) {
      localStorage.setItem('pinpig-theme', themePreference);
    }
  }, [themePreference, getResolvedTheme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference, applyTheme]);

  const handleSetTheme = useCallback(
    async (theme: ThemeMode) => {
      // Save to localStorage for FOUC prevention
      localStorage.setItem('pinpig-theme', theme);

      // Apply theme immediately for instant feedback
      const resolved: ResolvedTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      applyTheme(resolved);

      // Persist to database
      await setTheme(theme);
    },
    [setTheme, applyTheme]
  );

  return {
    theme: themePreference,
    resolvedTheme: getResolvedTheme(),
    setTheme: handleSetTheme,
  };
}
