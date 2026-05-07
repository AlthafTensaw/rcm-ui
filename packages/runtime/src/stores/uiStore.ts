/**
 * UI store.
 *
 * Replaces Redux uiSlice. Session-only panel/container/grid UI state. The
 * preferences saver subscribes to this store (via `subscribeWithSelector`)
 * to debounce-persist changes.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ContainerUiState,
  GridUiState,
  PanelWidthState,
  UiState,
} from '../types';

export interface UiStore extends UiState {
  setLeftPanelWidth: (params: { pageId: string; width: number }) => void;
  setRightPanelWidth: (params: { pageId: string; width: number }) => void;
  setLeftPanelCollapsed: (params: { pageId: string; collapsed: boolean }) => void;
  setRightPanelCollapsed: (params: { pageId: string; collapsed: boolean }) => void;
  setContainerExpanded: (params: {
    pageId: string;
    containerId: string;
    expanded: boolean;
  }) => void;
  setContainerActiveTab: (params: {
    pageId: string;
    containerId: string;
    tabId: string;
  }) => void;
  setGridColumnVisibility: (params: {
    pageId: string;
    gridId: string;
    visibility: Record<string, boolean>;
  }) => void;
  setGridSort: (params: {
    pageId: string;
    gridId: string;
    sort: { columnId: string; direction: 'asc' | 'desc' } | null;
  }) => void;
  setGridPageSize: (params: {
    pageId: string;
    gridId: string;
    pageSize: number;
  }) => void;
  hydrateFromPreferences: (payload: {
    panelsByPage?: Record<string, PanelWidthState>;
    containersByKey?: Record<string, ContainerUiState>;
    gridsByKey?: Record<string, GridUiState>;
  }) => void;
}

const INITIAL: UiState = {
  panelsByPage: {},
  containersByKey: {},
  gridsByKey: {},
};

const defaultPanels: PanelWidthState = {
  leftPanelWidth: null,
  rightPanelWidth: null,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
};

const defaultContainer: ContainerUiState = {
  expanded: true,
  activeTabId: null,
};

const defaultGrid: GridUiState = {
  columnVisibility: {},
  sort: null,
  pageSize: null,
};

function containerKey(pageId: string, containerId: string): string {
  return `${pageId}:${containerId}`;
}

function gridKeyOf(pageId: string, gridId: string): string {
  return `${pageId}:${gridId}`;
}

export const useUiStore = create<UiStore>()(
  subscribeWithSelector((set) => ({
    ...INITIAL,

    setLeftPanelWidth: ({ pageId, width }) =>
      { set((state) => {
        const cur = state.panelsByPage[pageId] ?? defaultPanels;
        return {
          panelsByPage: {
            ...state.panelsByPage,
            [pageId]: { ...cur, leftPanelWidth: width },
          },
        };
      }); },

    setRightPanelWidth: ({ pageId, width }) =>
      { set((state) => {
        const cur = state.panelsByPage[pageId] ?? defaultPanels;
        return {
          panelsByPage: {
            ...state.panelsByPage,
            [pageId]: { ...cur, rightPanelWidth: width },
          },
        };
      }); },

    setLeftPanelCollapsed: ({ pageId, collapsed }) =>
      { set((state) => {
        const cur = state.panelsByPage[pageId] ?? defaultPanels;
        return {
          panelsByPage: {
            ...state.panelsByPage,
            [pageId]: { ...cur, leftPanelCollapsed: collapsed },
          },
        };
      }); },

    setRightPanelCollapsed: ({ pageId, collapsed }) =>
      { set((state) => {
        const cur = state.panelsByPage[pageId] ?? defaultPanels;
        return {
          panelsByPage: {
            ...state.panelsByPage,
            [pageId]: { ...cur, rightPanelCollapsed: collapsed },
          },
        };
      }); },

    setContainerExpanded: ({ pageId, containerId, expanded }) =>
      { set((state) => {
        const key = containerKey(pageId, containerId);
        const cur = state.containersByKey[key] ?? defaultContainer;
        return {
          containersByKey: {
            ...state.containersByKey,
            [key]: { ...cur, expanded },
          },
        };
      }); },

    setContainerActiveTab: ({ pageId, containerId, tabId }) =>
      { set((state) => {
        const key = containerKey(pageId, containerId);
        const cur = state.containersByKey[key] ?? defaultContainer;
        return {
          containersByKey: {
            ...state.containersByKey,
            [key]: { ...cur, activeTabId: tabId },
          },
        };
      }); },

    setGridColumnVisibility: ({ pageId, gridId, visibility }) =>
      { set((state) => {
        const key = gridKeyOf(pageId, gridId);
        const cur = state.gridsByKey[key] ?? defaultGrid;
        return {
          gridsByKey: {
            ...state.gridsByKey,
            [key]: { ...cur, columnVisibility: visibility },
          },
        };
      }); },

    setGridSort: ({ pageId, gridId, sort }) =>
      { set((state) => {
        const key = gridKeyOf(pageId, gridId);
        const cur = state.gridsByKey[key] ?? defaultGrid;
        return {
          gridsByKey: { ...state.gridsByKey, [key]: { ...cur, sort } },
        };
      }); },

    setGridPageSize: ({ pageId, gridId, pageSize }) =>
      { set((state) => {
        const key = gridKeyOf(pageId, gridId);
        const cur = state.gridsByKey[key] ?? defaultGrid;
        return {
          gridsByKey: { ...state.gridsByKey, [key]: { ...cur, pageSize } },
        };
      }); },

    hydrateFromPreferences: (payload) =>
      { set((state) => {
        const next: Partial<UiState> = {};
        if (payload.panelsByPage) {
          next.panelsByPage = { ...state.panelsByPage, ...payload.panelsByPage };
        }
        if (payload.containersByKey) {
          next.containersByKey = {
            ...state.containersByKey,
            ...payload.containersByKey,
          };
        }
        if (payload.gridsByKey) {
          next.gridsByKey = { ...state.gridsByKey, ...payload.gridsByKey };
        }
        return next;
      }); },
  })),
);

export function _resetUiStore(): void {
  useUiStore.setState({ ...INITIAL });
}
