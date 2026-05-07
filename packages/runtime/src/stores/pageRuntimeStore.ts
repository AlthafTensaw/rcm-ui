/**
 * Page runtime store.
 *
 * Replaces Redux pageRuntimeSlice. Tracks the current page's lifecycle
 * (mounting → loading-prefs → ready → fatal-error → unmounting), the active
 * archetype, and registered containers.
 */
import { create } from 'zustand';
import type { PageRuntimeState } from '../types';

export interface PageRuntimeStore extends PageRuntimeState {
  setPageRuntime: (payload: Partial<PageRuntimeState>) => void;
  setPageStatus: (status: PageRuntimeState['status']) => void;
  setPageFatalError: (error: { code: string; message: string } | null) => void;
  registerContainer: (containerId: string) => void;
  unregisterContainer: (containerId: string) => void;
  resetPageRuntime: () => void;
}

const INITIAL: PageRuntimeState = {
  pageId: null,
  pageVersion: null,
  layoutArchetypeId: null,
  status: 'mounting',
  visibleZones: [],
  registeredContainerIds: [],
  fatalError: null,
};

export const usePageRuntimeStore = create<PageRuntimeStore>((set) => ({
  ...INITIAL,
  setPageRuntime: (payload) => { set(payload); },
  setPageStatus: (status) => { set({ status }); },
  setPageFatalError: (fatalError) =>
    { set(fatalError ? { fatalError, status: 'fatal-error' } : { fatalError: null }); },
  registerContainer: (containerId) =>
    { set((state) =>
      state.registeredContainerIds.includes(containerId)
        ? state
        : {
            registeredContainerIds: [
              ...state.registeredContainerIds,
              containerId,
            ],
          },
    ); },
  unregisterContainer: (containerId) =>
    { set((state) => ({
      registeredContainerIds: state.registeredContainerIds.filter(
        (id) => id !== containerId,
      ),
    })); },
  resetPageRuntime: () => { set({ ...INITIAL }); },
}));

export function _resetPageRuntimeStore(): void {
  usePageRuntimeStore.setState({ ...INITIAL });
}
