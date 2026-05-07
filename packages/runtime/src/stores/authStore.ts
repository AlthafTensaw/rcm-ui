/**
 * Auth store.
 *
 * Replaces Redux authSlice. Tracks signed-in user, current clinic id, and
 * last activity timestamp (used by idle timeout).
 *
 * The session-expired transition (formerly the SESSION_EXPIRED_ACTION
 * extraReducer) becomes the `expireSession` method, called directly by the
 * API layer's 401 handler.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AuthState, AuthUser } from '../types';

export interface AuthStore extends AuthState {
  signIn: (params: { user: AuthUser; clinicId: string | number | null }) => void;
  signOut: () => void;
  switchClinic: (clinicId: string | number) => void;
  recordActivity: () => void;
  expireSession: () => void;
}

const INITIAL: AuthState = {
  status: 'unknown',
  user: null,
  clinicId: null,
  lastActivityAt: null,
};

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set) => ({
    ...INITIAL,
    signIn: ({ user, clinicId }) =>
      { set({
        status: 'signed-in',
        user,
        clinicId,
        lastActivityAt: new Date().toISOString(),
      }); },
    signOut: () =>
      { set({
        status: 'signed-out',
        user: null,
        clinicId: null,
        lastActivityAt: null,
      }); },
    switchClinic: (clinicId) => { set({ clinicId }); },
    recordActivity: () => { set({ lastActivityAt: new Date().toISOString() }); },
    expireSession: () =>
      { set({
        status: 'session-expired',
        user: null,
      }); },
  })),
);

/** Test/bootstrap helper — reset to initial. */
export function _resetAuthStore(): void {
  useAuthStore.setState({ ...INITIAL });
}
