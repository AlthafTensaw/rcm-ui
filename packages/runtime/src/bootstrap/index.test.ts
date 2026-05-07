/**
 * Tests for the bootstrap sequence.
 *
 * Replaces the Redux-thunk variant. Behavior preserved:
 *   1. Auth: validates token, calls signIn or signOut
 *   2. Preferences: load + hydrate the UI store
 *   3. Effects start (autosave, idle timeout, context bindings, notifications)
 *   4. App marked initialized
 *
 * On unhandled error, sets globalFatalError and still marks initialized.
 *
 * Disposers are returned so tests/HMR can tear down cleanly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapApp } from './index';
import { useAuthStore, _resetAuthStore } from '../stores/authStore';
import { useAppStore, _resetAppStore } from '../stores/appStore';
import {
  usePreferencesStore,
  _resetPreferencesStore,
} from '../stores/preferencesStore';
import { useUiStore, _resetUiStore } from '../stores/uiStore';
import { _resetEventsStore } from '../stores/eventsStore';
import { _resetNotificationsStore } from '../stores/notificationsStore';
import { _resetContextStore } from '../stores/contextStore';
import { setTokenProvider, type TokenProvider } from '../auth/tokenProvider';
import { _resetIdleTimeout } from '../effects/idleTimeout';
import { _resetPreferenceAutosave } from '../effects/preferenceAutosave';
import { clearAllEventHandlers } from '../events/publish';

beforeEach(() => {
  _resetAuthStore();
  _resetAppStore();
  _resetPreferencesStore();
  _resetUiStore();
  _resetEventsStore();
  _resetNotificationsStore();
  _resetContextStore();
  _resetIdleTimeout();
  _resetPreferenceAutosave();
  clearAllEventHandlers();
});

afterEach(() => {
  _resetIdleTimeout();
  _resetPreferenceAutosave();
  clearAllEventHandlers();
});

function withTokenProvider(token: string | null) {
  const provider: TokenProvider = {
    getAccessToken: vi.fn().mockResolvedValue(token),
  };
  setTokenProvider(provider);
}

describe('bootstrapApp — auth', () => {
  it('signs the user out when no token is present', async () => {
    withTokenProvider(null);
    await bootstrapApp({});
    expect(useAuthStore.getState().status).toBe('signed-out');
    expect(useAppStore.getState().initialized).toBe(true);
  });

  it('signs the user in when token + loadAuthUser succeed', async () => {
    withTokenProvider('jwt-test');
    await bootstrapApp({
      loadAuthUser: () =>
        Promise.resolve({
          user: {
            userId: 'u-1',
            username: 'tester',
            email: 'tester@tensaw.local',
            fullName: 'Tester One',
            roles: ['account_manager'],
            permissions: ['ar.read'],
            clinicIds: ['clinic-1'],
          },
          clinicId: 'clinic-1',
        }),
    });
    const auth = useAuthStore.getState();
    expect(auth.status).toBe('signed-in');
    expect(auth.user?.userId).toBe('u-1');
    expect(auth.clinicId).toBe('clinic-1');
  });

  it('treats loadAuthUser failure as a non-fatal sign-out', async () => {
    withTokenProvider('jwt-bad');
    await bootstrapApp({
      loadAuthUser: () => Promise.reject(new Error('Token decode failed')),
    });
    expect(useAuthStore.getState().status).toBe('signed-out');
    expect(useAppStore.getState().initialized).toBe(true);
    expect(useAppStore.getState().globalFatalError).toBeNull();
  });

  it('treats null user from loadAuthUser as a sign-out', async () => {
    withTokenProvider('jwt-test');
    await bootstrapApp({
      loadAuthUser: () => Promise.resolve({ user: null, clinicId: null }),
    });
    expect(useAuthStore.getState().status).toBe('signed-out');
  });
});

describe('bootstrapApp — preferences', () => {
  it('loads preferences and hydrates the UI store', async () => {
    withTokenProvider(null);

    await bootstrapApp({
      loadPreferences: () =>
        Promise.resolve({
          density: 'compact',
          panelsByPage: { 'ar-mgmt': { left: 320 } },
          containersByKey: { 'ar-mgmt:summary': { expanded: false } },
          gridsByKey: {},
          savedViewByPage: { 'ar-mgmt': 'unassigned' },
        }),
    });

    const prefs = usePreferencesStore.getState();
    expect(prefs.density).toBe('compact');
    expect(prefs.panelsByPage['ar-mgmt']?.left).toBe(320);
    expect(prefs.savedViewByPage['ar-mgmt']).toBe('unassigned');
    expect(prefs.loadStatus).toBe('loaded');

    // UI store mirror.
    const ui = useUiStore.getState();
    expect(ui.panelsByPage['ar-mgmt']?.left).toBe(320);
    expect(ui.containersByKey['ar-mgmt:summary']?.expanded).toBe(false);
  });

  it('treats preference load failure as non-fatal', async () => {
    withTokenProvider(null);

    await bootstrapApp({
      loadPreferences: () =>
        Promise.reject(new Error('500 Internal Server Error')),
    });

    expect(useAppStore.getState().initialized).toBe(true);
    expect(useAppStore.getState().globalFatalError).toBeNull();
    expect(usePreferencesStore.getState().loadStatus).toBe('error');
  });
});

describe('bootstrapApp — disposers', () => {
  it('returns disposers for all four effects', async () => {
    withTokenProvider(null);
    const disposers = await bootstrapApp({});
    expect(typeof disposers.stopPreferenceAutosave).toBe('function');
    expect(typeof disposers.stopIdleTimeout).toBe('function');
    expect(typeof disposers.stopContextEventBindings).toBe('function');
    expect(typeof disposers.stopNotificationsEventBindings).toBe('function');

    // Disposers should be safely callable.
    expect(() => { disposers.stopPreferenceAutosave(); }).not.toThrow();
    expect(() => { disposers.stopIdleTimeout(); }).not.toThrow();
    expect(() => { disposers.stopContextEventBindings(); }).not.toThrow();
    expect(() => { disposers.stopNotificationsEventBindings(); }).not.toThrow();
  });
});

describe('bootstrapApp — finalization', () => {
  it('always marks the app initialized, even on auth failure', async () => {
    withTokenProvider('jwt-bad');
    await bootstrapApp({
      loadAuthUser: () => Promise.reject(new Error('Network down')),
    });
    expect(useAppStore.getState().initialized).toBe(true);
  });
});
