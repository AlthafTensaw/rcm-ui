/**
 * Dirty state store.
 *
 * Replaces Redux dirtyStateSlice. Tracks unsaved changes per widget instance
 * and the pending route transition (a context-changing event blocked by a
 * dirty widget that is waiting on user confirmation via DirtyStateGuard).
 *
 * The `clearForInstance(instanceId)` method is called by the widgets store
 * when a widget is disposed — see widgetsStore.markWidgetDisposed.
 */
import { create } from 'zustand';
import type { DirtyStateState } from '../types';

export interface DirtyStateStore extends DirtyStateState {
  markDirty: (params: {
    instanceId: string;
    widgetId: string;
    pageId: string;
  }) => void;
  clearDirty: (instanceId: string) => void;
  clearAllDirty: () => void;
  setPendingTransition: (
    transition: DirtyStateState['pendingTransition'],
  ) => void;
  clearPendingTransition: () => void;
  /** Cross-store cleanup called by widgetsStore.markWidgetDisposed. */
  clearForInstance: (instanceId: string) => void;
}

const INITIAL: DirtyStateState = {
  dirtyByInstanceId: {},
  pendingTransition: null,
};

export const useDirtyStateStore = create<DirtyStateStore>((set) => ({
  ...INITIAL,

  markDirty: ({ instanceId, widgetId, pageId }) =>
    { set((state) => ({
      dirtyByInstanceId: {
        ...state.dirtyByInstanceId,
        [instanceId]: {
          instanceId,
          widgetId,
          pageId,
          markedAt: new Date().toISOString(),
        },
      },
    })); },

  clearDirty: (instanceId) =>
    { set((state) => {
      const { [instanceId]: _removed, ...rest } = state.dirtyByInstanceId;
      void _removed;
      return { dirtyByInstanceId: rest };
    }); },

  clearAllDirty: () => { set({ dirtyByInstanceId: {} }); },

  setPendingTransition: (pendingTransition) => { set({ pendingTransition }); },

  clearPendingTransition: () => { set({ pendingTransition: null }); },

  clearForInstance: (instanceId) =>
    { set((state) => {
      const { [instanceId]: _removed, ...rest } = state.dirtyByInstanceId;
      void _removed;
      return { dirtyByInstanceId: rest };
    }); },
}));

export function _resetDirtyStateStore(): void {
  useDirtyStateStore.setState({ ...INITIAL });
}
