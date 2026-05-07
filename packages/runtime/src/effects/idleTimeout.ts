/**
 * Idle timeout effect.
 *
 * Replaces the Redux `idleTimeoutMiddleware`. HIPAA inactivity logout per
 * §5.4 of the migration handoff.
 *
 * Mechanism:
 *   1. The app root listens for user activity (mousedown, keydown, etc.) and
 *      calls `useAuthStore.getState().recordActivity()` on each. (This is a
 *      React effect in the app root, not part of this module — see
 *      apps/patient/src/AppShell.tsx.)
 *   2. This module subscribes to `useAuthStore.lastActivityAt` and resets a
 *      timer on each change.
 *   3. If the timer expires without further activity, it calls
 *      `useAuthStore.getState().expireSession()` and publishes a
 *      `SESSION_EXPIRED` event.
 *
 * Default idle threshold is 15 minutes per HIPAA's broad interpretation. Apps
 * may override at startup via `startIdleTimeout({ idleMs: ... })`.
 */

import { useAuthStore } from '../stores/authStore';

const DEFAULT_IDLE_MS = 15 * 60 * 1000;

export interface StartIdleTimeoutOptions {
  /** Inactivity threshold in milliseconds. Default 15 minutes. */
  idleMs?: number;
}

let timerHandle: ReturnType<typeof setTimeout> | null = null;

function clearTimer(): void {
  if (timerHandle !== null) {
    clearTimeout(timerHandle);
    timerHandle = null;
  }
}

function armTimer(idleMs: number): void {
  clearTimer();
  timerHandle = setTimeout(() => {
    timerHandle = null;
    useAuthStore.getState().expireSession();
  }, idleMs);
}

/**
 * Start the idle-timeout effect. Subscribes to `auth.lastActivityAt` and
 * resets the inactivity timer on each change. If the user signs out, the
 * timer is cleared.
 *
 * Returns an unsubscribe function.
 */
export function startIdleTimeout(
  options: StartIdleTimeoutOptions = {},
): () => void {
  const idleMs = options.idleMs ?? DEFAULT_IDLE_MS;

  const initial = useAuthStore.getState();
  if (initial.status === 'signed-in') {
    armTimer(idleMs);
  }

  const unsubscribe = useAuthStore.subscribe(
    (state) => ({
      status: state.status,
      lastActivityAt: state.lastActivityAt,
    }),
    ({ status }) => {
      if (status === 'signed-in') {
        armTimer(idleMs);
      } else {
        clearTimer();
      }
    },
    {
      equalityFn: (a, b) =>
        a.status === b.status && a.lastActivityAt === b.lastActivityAt,
    },
  );

  return () => {
    clearTimer();
    unsubscribe();
  };
}

/** Test helper: cancel any pending timer. */
export function _resetIdleTimeout(): void {
  clearTimer();
}
