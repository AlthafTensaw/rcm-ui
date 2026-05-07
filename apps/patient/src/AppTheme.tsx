/**
 * AppTheme — app-level wrapper around the design-system `<ThemeProvider>`
 * that adds a setter and persists the mode in `localStorage`.
 *
 * The design-system `<ThemeProvider>` is intentionally read-only — its
 * `mode` and `density` are props supplied by the application. This module
 * holds the state and exposes a setter via context so far-flung components
 * (e.g. the user menu in `<TopNav>`) can flip the theme without prop drilling.
 *
 * Persistence:
 *   - Mode is read from `localStorage.tensaw:theme:mode` on first render and
 *     written back on every change. Falls back to `light`.
 *   - In SSR / non-browser contexts (jsdom in Vitest does have `localStorage`,
 *     so this works in tests too), reads/writes are wrapped in try/catch.
 *
 * Density is fixed at `comfortable` for the patient app v1; we'll add a
 * density toggle when there's user demand.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { ThemeProvider, type ThemeMode } from '@tensaw/design-system';

const STORAGE_KEY = 'tensaw:theme:mode';

interface AppThemeContextValue {
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
  toggleMode: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue>({
  mode: 'light',
  setMode: () => {
    /* default no-op */
  },
  toggleMode: () => {
    /* default no-op */
  },
});

function readInitialMode(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    /* SSR / blocked storage — fall through */
  }
  return 'light';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const value = useMemo<AppThemeContextValue>(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider mode={mode} density="comfortable">
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  return useContext(AppThemeContext);
}
