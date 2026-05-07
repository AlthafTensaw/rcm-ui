/**
 * useColumnVisibility — standard hook for the search-list archetype.
 *
 * Binds column-visibility state to the runtime UI store (per-grid) and lets
 * the preference autosave effect persist it per-user across sessions.
 *
 * Storage pattern:
 *   - Live state lives in `useUiStore.gridsByKey['<pageId>:<gridId>']`
 *   - On mount, falls back to `usePreferencesStore.gridsByKey` if available
 *   - Writes go through `setGridColumnVisibility` which the preference
 *     autosave effect picks up and debounces.
 */

import { useCallback, useMemo } from 'react';
import { useUiStore, usePreferencesStore } from '@tensaw/runtime';
import type { ColumnVisibilityColumn } from './primitives/ColumnVisibilityMenu';

export interface UseColumnVisibilityOptions {
  /** Stable id of the page the grid lives on, e.g. "ar-mgmt". */
  pageId: string;
  /** Stable id of the grid within the page, e.g. "main-grid". */
  gridId: string;
  /** Column schema (drives the default when no preference exists). */
  columns: readonly ColumnVisibilityColumn[];
}

export interface UseColumnVisibilityResult {
  visibility: Record<string, boolean>;
  setVisibility: (next: Record<string, boolean>) => void;
  reset: () => void;
}

function buildDefaultVisibility(
  columns: readonly ColumnVisibilityColumn[],
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const c of columns) {
    out[c.id] = c.defaultHidden !== true;
  }
  return out;
}

export function useColumnVisibility({
  pageId,
  gridId,
  columns,
}: UseColumnVisibilityOptions): UseColumnVisibilityResult {
  const gridKey = `${pageId}:${gridId}`;

  // Prefer the live ui store value; fall back to preferences.
  const liveVis = useUiStore(
    (state) => state.gridsByKey[gridKey]?.columnVisibility ?? null,
  );
  const persistedVis = usePreferencesStore(
    (state) => state.gridsByKey[gridKey]?.columnVisibility ?? null,
  );

  const stored: Record<string, boolean> | null =
    liveVis && Object.keys(liveVis).length > 0
      ? liveVis
      : persistedVis && Object.keys(persistedVis).length > 0
        ? persistedVis
        : null;

  const visibility = useMemo<Record<string, boolean>>(
    () => stored ?? buildDefaultVisibility(columns),
    [stored, columns],
  );

  const setVisibility = useCallback(
    (next: Record<string, boolean>) => {
      useUiStore.getState().setGridColumnVisibility({
        pageId,
        gridId,
        visibility: next,
      });
    },
    [pageId, gridId],
  );

  const reset = useCallback(() => {
    useUiStore.getState().setGridColumnVisibility({
      pageId,
      gridId,
      visibility: buildDefaultVisibility(columns),
    });
  }, [pageId, gridId, columns]);

  return { visibility, setVisibility, reset };
}
