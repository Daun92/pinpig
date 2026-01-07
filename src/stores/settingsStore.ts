import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '@/services/database';
import type { Settings, ThemeMode } from '@/types';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
}

interface SettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setPayday: (day: number) => Promise<void>;
  setStartDayOfMonth: (day: number) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearError: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await db.settings.get('default');
          set({ settings: settings || null, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch settings:', error);
          set({ error: '설정을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      updateSettings: async (updates: Partial<Settings>) => {
        set({ isLoading: true, error: null });
        try {
          // Get current settings first
          let currentSettings = await db.settings.get('default');

          if (!currentSettings) {
            // If settings don't exist, create them with defaults
            const { DEFAULT_SETTINGS } = await import('@/types');
            currentSettings = {
              ...DEFAULT_SETTINGS,
              id: 'default',
              updatedAt: new Date(),
            } as Settings;
            await db.settings.add(currentSettings);
          }

          // Merge updates with current settings
          const updatedSettings: Settings = {
            ...currentSettings,
            ...updates,
            updatedAt: new Date(),
          };

          // Use put to ensure the record is saved (upsert)
          await db.settings.put(updatedSettings);

          // Update state with the new settings
          set({
            settings: updatedSettings,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to update settings:', error);
          set({ error: '설정 저장에 실패했습니다.', isLoading: false });
          throw error;
        }
      },

      setMonthlyBudget: async (budget: number) => {
        if (budget < 0) {
          throw new Error('예산은 0 이상이어야 합니다.');
        }
        await get().updateSettings({ monthlyBudget: budget });
      },

      setPayday: async (day: number) => {
        if (day < 1 || day > 31) {
          throw new Error('급여일은 1-31 사이여야 합니다.');
        }
        await get().updateSettings({ payday: day });
      },

      setStartDayOfMonth: async (day: number) => {
        if (day < 1 || day > 31) {
          throw new Error('시작일은 1-31 사이여야 합니다.');
        }
        await get().updateSettings({ startDayOfMonth: day });
      },

      setTheme: async (theme: ThemeMode) => {
        await get().updateSettings({ theme });
      },

      completeOnboarding: async () => {
        await get().updateSettings({ isOnboardingComplete: true });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'SettingsStore' }
  )
);

// Selectors
export const selectMonthlyBudget = (state: SettingsStore) =>
  state.settings?.monthlyBudget ?? 0;

export const selectPayday = (state: SettingsStore) =>
  state.settings?.payday ?? 25;

export const selectStartDayOfMonth = (state: SettingsStore) =>
  state.settings?.startDayOfMonth ?? 1;

export const selectIsOnboardingComplete = (state: SettingsStore) =>
  state.settings?.isOnboardingComplete ?? false;

export const selectTheme = (state: SettingsStore) =>
  state.settings?.theme ?? 'system';

export const selectCurrency = (state: SettingsStore) => ({
  currency: state.settings?.currency ?? 'KRW',
  symbol: state.settings?.currencySymbol ?? '원',
});
