/**
 * App store.
 *
 * Replaces Redux appSlice. Tracks the runtime app/module/page identity, the
 * `initialized` flag (true after bootstrapApp resolves), and any global fatal
 * error that prevents the app from running.
 */
import { create } from 'zustand';
import type { AppState } from '../types';

export interface AppStore extends AppState {
  setAppRuntime: (
    payload: Partial<Pick<AppState, 'appId' | 'moduleId' | 'pageId'>>,
  ) => void;
  setInitialized: (initialized: boolean) => void;
  setGlobalFatalError: (
    error: { code: string; message: string } | null,
  ) => void;
}

const INITIAL: AppState = {
  appId: null,
  moduleId: null,
  pageId: null,
  initialized: false,
  globalFatalError: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...INITIAL,
  setAppRuntime: (payload) => { set(payload); },
  setInitialized: (initialized) => { set({ initialized }); },
  setGlobalFatalError: (globalFatalError) => { set({ globalFatalError }); },
}));

export function _resetAppStore(): void {
  useAppStore.setState({ ...INITIAL });
}
