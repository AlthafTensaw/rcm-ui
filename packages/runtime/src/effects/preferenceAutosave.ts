/**
 * Preference autosave effect.
 *
 * Replaces the Redux `preferenceMiddleware`. Subscribes to UI and preference
 * changes; when something the user can persist changes, it debounces 500ms
 * and then calls the injected saver function.
 *
 * Behavior preserved from the middleware:
 *   - 500ms trailing debounce so 100 panel-drag events save once
 *   - Mirrors `useUiStore`'s session-only state into `usePreferencesStore`
 *     before saving — single source of truth on save
 *   - Publishes `PREFERENCE_SAVE_REQUESTED`, `PREFERENCE_SAVE_SUCCEEDED`,
 *     and `PREFERENCE_SAVE_FAILED` events
 *   - If no saver is wired, treats save as success (test/pre-bootstrap mode)
 *
 * What changed:
 *   - Per-key debouncing (the middleware grouped saves by panel, container,
 *     density, savedView) is dropped in favor of a single debounce. The
 *     payload is always the full preferences snapshot, so per-key throttling
 *     gave no real benefit. Behavior is now: any preference-affecting change
 *     in any of the four watched stores resets the same 500ms timer.
 */

import { debounce } from 'lodash-es';
import { useUiStore } from '../stores/uiStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { buildEvent, publishEvent } from '../events/publish';
import type {
  ContainerUiState,
  GridUiState,
  PanelWidthState,
} from '../types';

/** Payload the injected saver receives. */
export interface PreferencesPayload {
  density: 'comfortable' | 'compact';
  panelsByPage: Record<string, PanelWidthState>;
  containersByKey: Record<string, ContainerUiState>;
  gridsByKey: Record<string, GridUiState>;
  savedViewByPage: Record<string, string>;
}

/** The injected save function. Returns a promise that resolves on success. */
export type PreferenceSaver = (payload: PreferencesPayload) => Promise<void>;

const DEBOUNCE_MS = 500;

let saver: PreferenceSaver | null = null;

/**
 * Inject the save function. Apps call this once during bootstrap, before
 * `startPreferenceAutosave()` runs. The autosave effect tolerates a null
 * saver by skipping the network call but still updating the preferences
 * store with synthetic success.
 */
export function setPreferenceSaver(fn: PreferenceSaver | null): void {
  saver = fn;
}

function makeCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function snapshotPayload(): PreferencesPayload {
  const ui = useUiStore.getState();
  const prefs = usePreferencesStore.getState();
  return {
    density: prefs.density,
    panelsByPage: ui.panelsByPage,
    containersByKey: ui.containersByKey,
    gridsByKey: ui.gridsByKey,
    savedViewByPage: prefs.savedViewByPage,
  };
}

async function flushSave(): Promise<void> {
  const payload = snapshotPayload();

  // Mirror current ui state into preferences store.
  const prefStore = usePreferencesStore.getState();
  prefStore.syncPanelsByPage(payload.panelsByPage);
  prefStore.syncContainersByKey(payload.containersByKey);
  prefStore.syncGridsByKey(payload.gridsByKey);

  prefStore.saveRequested();
  publishEvent(
    buildEvent(
      'PREFERENCE_SAVE_REQUESTED',
      { keys: ['ui'] },
      { sourcePageId: 'platform', correlationId: makeCorrelationId() },
    ),
  );

  if (!saver) {
    const now = new Date().toISOString();
    prefStore.saveSucceeded(now);
    publishEvent(
      buildEvent(
        'PREFERENCE_SAVE_SUCCEEDED',
        { keys: ['ui'], savedAt: now },
        { sourcePageId: 'platform', correlationId: makeCorrelationId() },
      ),
    );
    return;
  }

  try {
    await saver(payload);
    const now = new Date().toISOString();
    prefStore.saveSucceeded(now);
    publishEvent(
      buildEvent(
        'PREFERENCE_SAVE_SUCCEEDED',
        { keys: ['ui'], savedAt: now },
        { sourcePageId: 'platform', correlationId: makeCorrelationId() },
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    prefStore.saveFailed(message);
    publishEvent(
      buildEvent(
        'PREFERENCE_SAVE_FAILED',
        { keys: ['ui'], errorCode: 'SAVE_FAILED', errorMessage: message },
        { sourcePageId: 'platform', correlationId: makeCorrelationId() },
      ),
    );
  }
}

const debouncedSave = debounce(() => {
  void flushSave();
}, DEBOUNCE_MS);

/**
 * Start the autosave effect. Subscribes to preference-affecting changes and
 * fires `flushSave` debounced.
 *
 * Returns an unsubscribe function for testability.
 */
export function startPreferenceAutosave(): () => void {
  // Subscribe to UI store: any panel/container/grid change schedules a save.
  const unsubUi = useUiStore.subscribe(
    (state) => ({
      panels: state.panelsByPage,
      containers: state.containersByKey,
      grids: state.gridsByKey,
    }),
    () => {
      debouncedSave();
    },
    {
      equalityFn: (a, b) =>
        a.panels === b.panels &&
        a.containers === b.containers &&
        a.grids === b.grids,
    },
  );

  // Subscribe to preferences store: density/savedView changes schedule a save.
  const unsubPrefs = usePreferencesStore.subscribe(
    (state) => ({
      density: state.density,
      savedView: state.savedViewByPage,
    }),
    () => {
      debouncedSave();
    },
    {
      equalityFn: (a, b) =>
        a.density === b.density && a.savedView === b.savedView,
    },
  );

  return () => {
    debouncedSave.cancel();
    unsubUi();
    unsubPrefs();
  };
}

/** Test helper: cancel any in-flight debounce and forget the saver. */
export function _resetPreferenceAutosave(): void {
  debouncedSave.cancel();
  saver = null;
}
