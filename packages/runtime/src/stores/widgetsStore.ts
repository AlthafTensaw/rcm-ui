/**
 * Widgets store.
 *
 * Replaces Redux widgetsSlice. Tracks all mounted widget instances and their
 * lifecycle.
 *
 * Cross-store cleanup on dispose:
 *   - Today: dirtyState and surfaces slices listened for `markWidgetDisposed`
 *     via Redux extraReducers.
 *   - After migration: `markWidgetDisposed` directly calls the imperative
 *     cleanup methods on `useDirtyStateStore` and `useSurfacesStore`.
 *
 * The cross-store calls use `getState()` so they don't subscribe to changes —
 * they perform a one-shot mutation. This is the canonical Zustand pattern for
 * imperative cross-store coordination per §3.3 of the migration handoff.
 */
import { create } from 'zustand';
import type { WidgetLifecycle, WidgetsState } from '../types';
import { useDirtyStateStore } from './dirtyStateStore';
import { useSurfacesStore } from './surfacesStore';

export interface WidgetsStore extends WidgetsState {
  registerWidget: (params: {
    instanceId: string;
    widgetId: string;
    containerId: string;
    pageId: string;
  }) => void;
  setWidgetLifecycle: (params: {
    instanceId: string;
    lifecycle: WidgetLifecycle;
  }) => void;
  setWidgetError: (params: {
    instanceId: string;
    errorCode: string;
    errorMessage: string;
  }) => void;
  clearWidgetError: (instanceId: string) => void;
  setWidgetDataLoaded: (instanceId: string) => void;
  markWidgetDisposed: (instanceId: string) => void;
}

const INITIAL: WidgetsState = {
  byInstanceId: {},
};

export const useWidgetsStore = create<WidgetsStore>((set) => ({
  ...INITIAL,

  registerWidget: ({ instanceId, widgetId, containerId, pageId }) =>
    { set((state) => ({
      byInstanceId: {
        ...state.byInstanceId,
        [instanceId]: {
          instanceId,
          widgetId,
          containerId,
          pageId,
          lifecycle: 'mounting',
          errorCode: null,
          errorMessage: null,
          mountedAt: new Date().toISOString(),
          lastDataLoadedAt: null,
        },
      },
    })); },

  setWidgetLifecycle: ({ instanceId, lifecycle }) =>
    { set((state) => {
      const w = state.byInstanceId[instanceId];
      if (!w) return state;
      return {
        byInstanceId: { ...state.byInstanceId, [instanceId]: { ...w, lifecycle } },
      };
    }); },

  setWidgetError: ({ instanceId, errorCode, errorMessage }) =>
    { set((state) => {
      const w = state.byInstanceId[instanceId];
      if (!w) return state;
      return {
        byInstanceId: {
          ...state.byInstanceId,
          [instanceId]: {
            ...w,
            lifecycle: 'error',
            errorCode,
            errorMessage,
          },
        },
      };
    }); },

  clearWidgetError: (instanceId) =>
    { set((state) => {
      const w = state.byInstanceId[instanceId];
      if (!w) return state;
      return {
        byInstanceId: {
          ...state.byInstanceId,
          [instanceId]: {
            ...w,
            errorCode: null,
            errorMessage: null,
            lifecycle: w.lifecycle === 'error' ? 'ready' : w.lifecycle,
          },
        },
      };
    }); },

  setWidgetDataLoaded: (instanceId) =>
    { set((state) => {
      const w = state.byInstanceId[instanceId];
      if (!w) return state;
      return {
        byInstanceId: {
          ...state.byInstanceId,
          [instanceId]: {
            ...w,
            lastDataLoadedAt: new Date().toISOString(),
          },
        },
      };
    }); },

  markWidgetDisposed: (instanceId) => {
    // 1. Remove from our own state.
    set((state) => {
      const { [instanceId]: _removed, ...rest } = state.byInstanceId;
      void _removed;
      return { byInstanceId: rest };
    });

    // 2. Cross-store cleanup. Uses getState() so we don't subscribe — these
    //    are one-shot mutations performed at dispose time.
    useDirtyStateStore.getState().clearForInstance(instanceId);
    useSurfacesStore.getState().closeOwnedBy(instanceId);
  },
}));

export function _resetWidgetsStore(): void {
  useWidgetsStore.setState({ ...INITIAL });
}
