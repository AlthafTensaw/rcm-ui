/**
 * Tests for the idle timeout effect.
 *
 * Replaces `middleware/idleTimeoutMiddleware.test.ts` from the Redux era.
 * Behavior:
 *   - When a user signs in, the timer arms to `idleMs`
 *   - Each `recordActivity()` resets the timer
 *   - When the timer expires, `expireSession()` is called
 *   - When the user signs out, the timer is cleared (no expiry)
 *   - `stop()` cancels any pending timer and removes the subscription
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startIdleTimeout,
  _resetIdleTimeout,
} from './idleTimeout';
import { useAuthStore, _resetAuthStore } from '../stores/authStore';

const TEST_IDLE_MS = 100;

beforeEach(() => {
  vi.useFakeTimers();
  _resetAuthStore();
  _resetIdleTimeout();
});

afterEach(() => {
  vi.useRealTimers();
  _resetIdleTimeout();
});

function signIn() {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u',
      username: 'u',
      email: 'u@example.com',
      fullName: 'U',
      roles: [],
      permissions: [],
      clinicIds: [],
    },
    clinicId: 'c',
  });
}

describe('startIdleTimeout — arming', () => {
  it('expires the session after the configured idle window when already signed in', () => {
    signIn();
    expect(useAuthStore.getState().status).toBe('signed-in');

    const stop = startIdleTimeout({ idleMs: TEST_IDLE_MS });

    vi.advanceTimersByTime(TEST_IDLE_MS + 10);

    expect(useAuthStore.getState().status).toBe('session-expired');
    stop();
  });

  it('does not arm a timer when no user is signed in at start', () => {
    const stop = startIdleTimeout({ idleMs: TEST_IDLE_MS });

    vi.advanceTimersByTime(TEST_IDLE_MS + 10);
    // No session to expire — auth status should remain idle.
    expect(useAuthStore.getState().status).not.toBe('session-expired');
    stop();
  });
});

describe('startIdleTimeout — activity resets the timer', () => {
  it('records activity to push the expiry forward', () => {
    signIn();
    const stop = startIdleTimeout({ idleMs: TEST_IDLE_MS });

    // Wait 80ms (under the 100ms threshold), then record activity.
    vi.advanceTimersByTime(80);
    useAuthStore.getState().recordActivity();

    // Wait another 80ms (160ms total). Without activity reset, would have
    // expired by now. With reset, still alive.
    vi.advanceTimersByTime(80);
    expect(useAuthStore.getState().status).toBe('signed-in');

    // 30 more ms (110ms after the activity push) crosses the threshold.
    vi.advanceTimersByTime(30);
    expect(useAuthStore.getState().status).toBe('session-expired');
    stop();
  });
});

describe('startIdleTimeout — sign out', () => {
  it('clears the timer when the user signs out', () => {
    signIn();
    const stop = startIdleTimeout({ idleMs: TEST_IDLE_MS });

    vi.advanceTimersByTime(50);
    useAuthStore.getState().signOut();

    // Even after the original window would have expired, the user is now
    // signed-out — the timer should not have fired any state transition.
    vi.advanceTimersByTime(TEST_IDLE_MS + 50);

    // signOut moved status to 'signed-out'; expireSession was never called.
    expect(useAuthStore.getState().status).toBe('signed-out');
    stop();
  });
});

describe('startIdleTimeout — disposer', () => {
  it('returns a function that stops the timer cleanly', () => {
    signIn();
    const stop = startIdleTimeout({ idleMs: TEST_IDLE_MS });

    stop();
    vi.advanceTimersByTime(TEST_IDLE_MS + 50);

    // No expiry because the timer was cancelled before it fired.
    expect(useAuthStore.getState().status).toBe('signed-in');
  });
});

describe('startIdleTimeout — default threshold', () => {
  it('defaults to 15 minutes when idleMs is not provided', () => {
    signIn();
    const stop = startIdleTimeout();

    // 14 minutes: still alive.
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(useAuthStore.getState().status).toBe('signed-in');

    // 1 more minute crosses the 15-minute threshold.
    vi.advanceTimersByTime(60 * 1000 + 100);
    expect(useAuthStore.getState().status).toBe('session-expired');
    stop();
  });
});
