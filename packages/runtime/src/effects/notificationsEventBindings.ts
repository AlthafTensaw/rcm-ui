/**
 * Notifications event bindings.
 *
 * Replaces the `extraReducers` block in the old `notificationsSlice` that
 * translated `TOAST_REQUESTED` events into toast pushes.
 *
 * After migration, this is an explicit event handler registered at app boot.
 */

import { registerEventHandler } from '../events/publish';
import { useNotificationsStore } from '../stores/notificationsStore';
import type { ToastSeverity } from '../types';

interface ToastRequestedPayload {
  severity: ToastSeverity;
  title: string;
  body?: string | null;
  durationMs?: number | null;
}

export function startNotificationsEventBindings(): () => void {
  return registerEventHandler('TOAST_REQUESTED', (event) => {
    const payload = event.payload as unknown as ToastRequestedPayload;
    useNotificationsStore.getState().pushToast({
      toastId: event.meta.correlationId,
      severity: payload.severity,
      title: payload.title,
      body: payload.body ?? null,
      durationMs: payload.durationMs ?? 5000,
    });
  });
}
