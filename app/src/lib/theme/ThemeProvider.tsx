'use client';

// Theme state for the whole app. Mode 'system' (the default) follows prefers-color-scheme live;
// 'dark' or 'light' is a manual choice kept in localStorage that overrides the system.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { THEME_KEY } from './script';

export type Theme = 'dark' | 'light';
export type ThemeMode = Theme | 'system';
type ThemeContextValue = { mode: ThemeMode; theme: Theme; setMode: (mode: ThemeMode) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
const resolve = (mode: ThemeMode): Theme => (mode === 'system' ? systemTheme() : mode);

function storedMode(): ThemeMode {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const sync = () => {
      const m = storedMode();
      const t = resolve(m);
      apply(t);
      setModeState(m);
      setTheme(t);
    };
    sync();
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onSystem = () => storedMode() === 'system' && sync();
    const onStorage = (e: StorageEvent) => (e.key === null || e.key === THEME_KEY) && sync(); // another tab
    mq.addEventListener('change', onSystem);
    window.addEventListener('storage', onStorage);
    return () => {
      mq.removeEventListener('change', onSystem);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice lasts for this visit */
    }
    const t = resolve(next);
    apply(t);
    setModeState(next);
    setTheme(t);
  }, []);

  const value = useMemo(() => ({ mode, theme, setMode }), [mode, theme, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
