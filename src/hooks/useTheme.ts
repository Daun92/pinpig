import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/services/database';
import type { ThemeMode } from '@/types';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // 초기 테마 로드
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await getSettings();
        if (settings?.theme) {
          setThemeState(settings.theme);
          applyTheme(settings.theme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    await updateSettings({ theme: newTheme });
  };

  return { theme, setTheme, isLoading };
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // PWA 상태바 색상 업데이트
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#121212' : '#FAF9F7');
  }
}

export function getThemeLabel(theme: ThemeMode): string {
  switch (theme) {
    case 'light':
      return '라이트';
    case 'dark':
      return '다크';
    case 'system':
      return '시스템';
  }
}
