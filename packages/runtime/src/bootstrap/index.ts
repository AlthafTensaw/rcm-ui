/**
 * App bootstrap.
 *
 * Replaces the Redux thunk pattern. Direct async function that calls Zustand
 * store setters and starts the platform effects. Apps invoke it like:
 *
 *   await bootstrapApp({ loadPreferences, loadAuthUser });
 *
 * Sequence preserved from the v3 plan (per §6 of the migration handoff):
 *   1. Auth — validate the Cognito session and call signIn / signOut
 *   2. Preferences — load + hydrate the UI store
 *   3. Start preference autosave (debounced subscription)
 *   4. Start idle timeout (subscription on auth.lastActivityAt)
 *   5. Start context event bindings (PATIENT_SELECTED → useContextStore, etc.)
 *   6. Start notifications event bindings (TOAST_REQUESTED → pushToast)
 *   7. Mark app initialized
 *
 * Any unexpected error becomes a global fatal error. Auth failure is NOT
 * fatal — the app just renders the sign-in screen.
 */

import { getTokenProvider } from '../auth/tokenProvider';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useUiStore } from '../stores/uiStore';
import {
  startPreferenceAutosave,
  startIdleTimeout,
  startContextEventBindings,
  startNotificationsEventBindings,
} from '../effects';
import type {
  AuthUser,
  ContainerUiState,
  GridUiState,
  PanelWidthState,
} from '../types';

/** Loader that the app provides. May call any endpoint. */
export type PreferenceLoader = () => Promise<{
    density: 'comfortable' | 'compact';
    panelsByPage: Record<string, PanelWidthState>;
    containersByKey: Record<string, ContainerUiState>;
    gridsByKey: Record<string, GridUiState>;
    savedViewByPage: Record<string, string>;
  }>;

/** Loader that the app provides for auth user details from the token. */
export type AuthUserLoader = (token: string) => Promise<{
    user: AuthUser | null;
    clinicId: string | number | null;
  }>;

export interface BootstrapAppDeps {
  loadPreferences?: PreferenceLoader;
  loadAuthUser?: AuthUserLoader;
  /** Optional override for the idle-timeout threshold. */
  idleMs?: number;
}

/** Disposers returned to the caller so tests/hot reload can tear down. */
export interface BootstrapDisposers {
  stopPreferenceAutosave: () => void;
  stopIdleTimeout: () => void;
  stopContextEventBindings: () => void;
  stopNotificationsEventBindings: () => void;
}

/**
 * Run the bootstrap sequence and start every platform effect. Returns the
 * collection of disposers so tests / HMR can stop them cleanly.
 */
export async function bootstrapApp(
  deps: BootstrapAppDeps = {},
): Promise<BootstrapDisposers> {
  try {
    // 1. Auth
    const token = await getTokenProvider().getAccessToken();
    if (!token) {
      useAuthStore.getState().signOut();
    } else if (deps.loadAuthUser) {
      try {
        const { user, clinicId } = await deps.loadAuthUser(token);
        if (user) {
          useAuthStore.getState().signIn({ user, clinicId });
        } else {
          useAuthStore.getState().signOut();
        }
      } catch {
        // Token-decode failure shouldn't be fatal — treat as signed-out.
        useAuthStore.getState().signOut();
      }
    }

    // 2. Preferences
    if (deps.loadPreferences) {
      usePreferencesStore.getState().loadRequested();
      try {
        const prefs = await deps.loadPreferences();
        usePreferencesStore.getState().loadSucceeded(prefs);
        // 3. Mirror into ui store for immediate effect.
        useUiStore.getState().hydrateFromPreferences({
          panelsByPage: prefs.panelsByPage,
          containersByKey: prefs.containersByKey,
          gridsByKey: prefs.gridsByKey,
        });
      } catch (err) {
        // Preference load failure is non-fatal; the app runs with defaults.
        const msg = err instanceof Error ? err.message : String(err);
        usePreferencesStore.getState().loadFailed(msg);
      }
    }

    // 4-7. Start effects (subscriptions + event bindings).
    const stopPreferenceAutosave = startPreferenceAutosave();
    const stopIdleTimeout = startIdleTimeout(
      deps.idleMs !== undefined ? { idleMs: deps.idleMs } : {},
    );
    const stopContextEventBindings = startContextEventBindings();
    const stopNotificationsEventBindings = startNotificationsEventBindings();

    // 8. Done.
    useAppStore.getState().setInitialized(true);

    return {
      stopPreferenceAutosave,
      stopIdleTimeout,
      stopContextEventBindings,
      stopNotificationsEventBindings,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    useAppStore.getState().setGlobalFatalError({
      code: 'BOOTSTRAP_FAILED',
      message: msg,
    });
    useAppStore.getState().setInitialized(true);
    // Return no-op disposers when bootstrap failed before effects started.
    // Each function is an explicit no-op — bootstrap aborted, nothing to clean up.
    const noop = () => {
      /* bootstrap aborted before effect started */
    };
    return {
      stopPreferenceAutosave: noop,
      stopIdleTimeout: noop,
      stopContextEventBindings: noop,
      stopNotificationsEventBindings: noop,
    };
  }
}
