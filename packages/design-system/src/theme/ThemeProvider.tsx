/**
 * ThemeProvider.
 *
 * Wraps the app once. On mount and on prop change:
 *   - Computes the CSS variable map from `(mode, density)`
 *   - Applies it to document.documentElement (so any component can read via var())
 *   - Sets `data-theme` and `data-density` attributes for descendant CSS selectors
 *   - If `accentColor` is provided, propagates it as an `--accent` HSL override
 *     on the same element (per §6.5 of the design-system buildout spec); used
 *     for per-tenant brand color theming.
 *
 * Density and mode are also exposed via `useTheme()` for the small handful of
 * cases where component logic needs to know (e.g. SchemaDataGrid choosing
 * which row height to render).
 *
 * In tests / Storybook, you can call ThemeProvider with a target element to
 * apply variables to a sub-tree instead of :root.
 *
 * Backward compatibility: callers that pass only `mode` and `density` continue
 * to work unchanged. `accentColor` is optional and defaults to "no override."
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import {
  applyCssVariables,
  buildCssVariables,
  type Density,
} from '../tokens';

export type ThemeMode = 'light' | 'dark';

/**
 * Tenant accent-color override. Either an HSL triplet string (e.g.
 * `"190 70% 40%"`) for direct CSS-variable substitution into `--accent`, or
 * `null` / `undefined` for "use the shadcn neutral default."
 *
 * Document the format in `docs/DESIGN_TOKENS.md` so tenants know what to
 * supply. The HSL-triplet shape matches shadcn's CSS-variable convention so
 * it composes with `hsl(var(--accent))` references throughout the system.
 */
export type AccentColor = string | null;

export interface Theme {
  mode: ThemeMode;
  density: Density;
  accentColor: AccentColor;
}

const defaultTheme: Theme = {
  mode: 'light',
  density: 'comfortable',
  accentColor: null,
};

const ThemeContext = createContext<Theme>(defaultTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export interface ThemeProviderProps extends PropsWithChildren {
  mode?: ThemeMode;
  density?: Density;
  /**
   * Per-tenant accent color as an HSL triplet (e.g. `"190 70% 40%"`). When
   * provided, overrides the shadcn `--accent` and `--accent-foreground` CSS
   * variables for the subtree (or the document root when no `target` is
   * given). When omitted, the shadcn neutral default is used.
   */
  accentColor?: AccentColor;
  /** Apply variables to this element instead of document root. Useful for tests. */
  target?: HTMLElement | null;
}

export function ThemeProvider({
  mode = 'light',
  density = 'comfortable',
  accentColor = null,
  target,
  children,
}: ThemeProviderProps) {
  const theme = useMemo(
    () => ({ mode, density, accentColor }),
    [mode, density, accentColor],
  );

  useEffect(() => {
    const el =
      target ??
      (typeof document !== 'undefined' ? document.documentElement : null);
    if (!el) return;

    const vars = buildCssVariables({ mode, density });
    applyCssVariables(el, vars);
    el.setAttribute('data-theme', mode);
    el.setAttribute('data-density', density);

    // Tenant accent override (shadcn-compatible HSL-triplet substitution).
    // Setting/unsetting on every render is intentional — switching tenants
    // should re-paint cleanly.
    if (accentColor) {
      el.style.setProperty('--accent', accentColor);
      // Foreground stays at the neutral default; tenants needing a paired
      // foreground override can extend this prop into a tuple in v0.2.
    } else {
      el.style.removeProperty('--accent');
    }
  }, [mode, density, accentColor, target]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
