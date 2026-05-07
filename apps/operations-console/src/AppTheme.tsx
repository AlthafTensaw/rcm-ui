/**
 * AppTheme — app-level wrapper around the design-system `<ThemeProvider>`.
 *
 * Mirrors `apps/patient/src/AppTheme.tsx` exactly. The design-system
 * `<ThemeProvider>` is read-only; this module holds the mode state and
 * persists it to localStorage so the user-menu's theme toggle survives
 * page reloads.
 *
 * Density is fixed at `comfortable` for v1; a density toggle is a
 * future enhancement.
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

const STORAGE_KEY = 'tensaw:operations-console:theme:mode';

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
