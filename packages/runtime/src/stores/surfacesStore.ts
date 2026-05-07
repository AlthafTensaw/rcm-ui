/**
 * Surfaces store.
 *
 * Replaces Redux surfacesSlice. Manages the modal/drawer/popup stack.
 *
 * The `closeOwnedBy(widgetInstanceId)` method is called by the widgets store
 * when a widget is disposed — see widgetsStore.markWidgetDisposed.
 */
import { create } from 'zustand';
import type {
  SurfaceInstance,
  SurfaceKind,
  SurfacesState,
} from '../types';

export interface SurfacesStore extends SurfacesState {
  openSurface: (params: {
    surfaceId: string;
    kind: SurfaceKind;
    componentId: string;
    props?: Record<string, unknown>;
    ownerWidgetInstanceId?: string | null;
  }) => void;
  closeSurface: (surfaceId: string) => void;
  closeAllSurfaces: () => void;
  /** Cross-store cleanup helper called by widgetsStore.markWidgetDisposed. */
  closeOwnedBy: (widgetInstanceId: string) => void;
}

const INITIAL: SurfacesState = {
  stack: [],
};

export const useSurfacesStore = create<SurfacesStore>((set) => ({
  ...INITIAL,

  openSurface: ({
    surfaceId,
    kind,
    componentId,
    props = {},
    ownerWidgetInstanceId = null,
  }) =>
    { set((state) => {
      const surface: SurfaceInstance = {
        surfaceId,
        kind,
        componentId,
        props,
        ownerWidgetInstanceId,
        openedAt: new Date().toISOString(),
      };
      return { stack: [...state.stack, surface] };
    }); },

  closeSurface: (surfaceId) =>
    { set((state) => ({
      stack: state.stack.filter((s) => s.surfaceId !== surfaceId),
    })); },

  closeAllSurfaces: () => { set({ stack: [] }); },

  closeOwnedBy: (widgetInstanceId) =>
    { set((state) => ({
      stack: state.stack.filter(
        (s) => s.ownerWidgetInstanceId !== widgetInstanceId,
      ),
    })); },
}));

export function _resetSurfacesStore(): void {
  useSurfacesStore.setState({ ...INITIAL });
}
