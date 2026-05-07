/**
 * Preferences store.
 *
 * Replaces Redux preferencesSlice. Holds the canonical persistable preferences:
 * density, panel widths, container UI, grid UI, saved-view per page, plus
 * load/save lifecycle.
 *
 * The autosave subscription (formerly the `preferenceMiddleware`) lives in
 * `effects/preferenceAutosave.ts` and uses `usePreferencesStore.subscribe`
 * with a debounced save call.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ContainerUiState,
  GridUiState,
  PanelWidthState,
  PreferencesState,
} from '../types';

export interface PreferencesStore extends PreferencesState {
  setDensity: (density: 'comfortable' | 'compact') => void;
  setSavedView: (params: { pageId: string; viewId: string }) => void;

  /** Mirror of UiState.panelsByPage on save — written by the autosave effect. */
  syncPanelsByPage: (panelsByPage: Record<string, PanelWidthState>) => void;
  syncContainersByKey: (
    containersByKey: Record<string, ContainerUiState>,
  ) => void;
  syncGridsByKey: (gridsByKey: Record<string, GridUiState>) => void;

  /** Per-grid setters (also mirror through the UI store on save). */
  setGridColumnVisibility: (params: {
    gridKey: string;
    visibility: Record<string, boolean>;
  }) => void;
  setGridSort: (params: {
    gridKey: string;
    sort: { columnId: string; direction: 'asc' | 'desc' } | null;
  }) => void;
  setGridPageSize: (params: { gridKey: string; pageSize: number }) => void;

  // Load lifecycle.
  loadRequested: () => void;
  loadSucceeded: (
    payload: Pick<
      PreferencesState,
      | 'density'
      | 'panelsByPage'
      | 'containersByKey'
      | 'gridsByKey'
      | 'savedViewByPage'
    >,
  ) => void;
  loadFailed: (error: string) => void;
  markLoading: () => void;

  // Save lifecycle.
  saveRequested: () => void;
  saveSucceeded: (savedAt: string) => void;
  saveFailed: (error: string) => void;
}

const INITIAL: PreferencesState = {
  density: 'comfortable',
  panelsByPage: {},
  containersByKey: {},
  gridsByKey: {},
  savedViewByPage: {},
  loadStatus: 'idle',
  saveStatus: 'idle',
  lastSavedAt: null,
  lastError: null,
};

const defaultGrid: GridUiState = {
  columnVisibility: {},
  sort: null,
  pageSize: null,
};

export const usePreferencesStore = create<PreferencesStore>()(
  subscribeWithSelector((set) => ({
    ...INITIAL,

    setDensity: (density) => { set({ density }); },

    setSavedView: ({ pageId, viewId }) =>
      { set((state) => ({
        savedViewByPage: { ...state.savedViewByPage, [pageId]: viewId },
      })); },

    syncPanelsByPage: (panelsByPage) => { set({ panelsByPage }); },
    syncContainersByKey: (containersByKey) => { set({ containersByKey }); },
    syncGridsByKey: (gridsByKey) => { set({ gridsByKey }); },

    setGridColumnVisibility: ({ gridKey, visibility }) =>
      { set((state) => {
        const existing = state.gridsByKey[gridKey] ?? defaultGrid;
        return {
          gridsByKey: {
            ...state.gridsByKey,
            [gridKey]: { ...existing, columnVisibility: visibility },
          },
        };
      }); },

    setGridSort: ({ gridKey, sort }) =>
      { set((state) => {
        const existing = state.gridsByKey[gridKey] ?? defaultGrid;
        return {
          gridsByKey: {
            ...state.gridsByKey,
            [gridKey]: { ...existing, sort },
          },
        };
      }); },

    setGridPageSize: ({ gridKey, pageSize }) =>
      { set((state) => {
        const existing = state.gridsByKey[gridKey] ?? defaultGrid;
        return {
          gridsByKey: {
            ...state.gridsByKey,
            [gridKey]: { ...existing, pageSize },
          },
        };
      }); },

    loadRequested: () => { set({ loadStatus: 'loading', lastError: null }); },
    markLoading: () => { set({ loadStatus: 'loading', lastError: null }); },
    loadSucceeded: (payload) =>
      { set({
        loadStatus: 'loaded',
        density: payload.density,
        panelsByPage: payload.panelsByPage,
        containersByKey: payload.containersByKey,
        gridsByKey: payload.gridsByKey,
        savedViewByPage: payload.savedViewByPage,
      }); },
    loadFailed: (error) => { set({ loadStatus: 'error', lastError: error }); },

    saveRequested: () => { set({ saveStatus: 'saving', lastError: null }); },
    saveSucceeded: (savedAt) =>
      { set({ saveStatus: 'saved', lastSavedAt: savedAt }); },
    saveFailed: (error) => { set({ saveStatus: 'error', lastError: error }); },
  })),
);

export function _resetPreferencesStore(): void {
  usePreferencesStore.setState({ ...INITIAL });
}
