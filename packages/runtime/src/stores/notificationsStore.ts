/**
 * Notifications store.
 *
 * Replaces Redux notificationsSlice. Toast queue.
 *
 * Today the slice listened for the `TOAST_REQUESTED` event via Redux
 * extraReducer. After migration the event handler in
 * `effects/notificationsEventBindings.ts` calls `pushToast` directly.
 *
 * The TanStack Query global `onError` (in `api/queryClient.ts`) also calls
 * `pushToast` directly for any uncaught query/mutation error.
 */
import { create } from 'zustand';
import type {
  NotificationsState,
  ToastInstance,
  ToastSeverity,
} from '../types';

export interface PushToastInput {
  toastId: string;
  severity: ToastSeverity;
  title: string;
  body?: string | null;
  durationMs?: number | null;
}

export interface NotificationsStore extends NotificationsState {
  pushToast: (toast: PushToastInput) => void;
  dismissToast: (toastId: string) => void;
  dismissAllToasts: () => void;
}

const INITIAL: NotificationsState = {
  toasts: [],
};

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  ...INITIAL,

  pushToast: ({ toastId, severity, title, body = null, durationMs = 5000 }) =>
    { set((state) => {
      const toast: ToastInstance = {
        toastId,
        severity,
        title,
        body,
        durationMs,
        createdAt: new Date().toISOString(),
      };
      return { toasts: [...state.toasts, toast] };
    }); },

  dismissToast: (toastId) =>
    { set((state) => ({
      toasts: state.toasts.filter((t) => t.toastId !== toastId),
    })); },

  dismissAllToasts: () => { set({ toasts: [] }); },
}));

export function _resetNotificationsStore(): void {
  useNotificationsStore.setState({ ...INITIAL });
}
