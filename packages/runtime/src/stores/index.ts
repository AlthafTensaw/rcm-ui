/**
 * Stores barrel.
 *
 * Eleven independent Zustand stores. Use the named hooks from React
 * components, or the singleton `getState()` from non-React code (effects,
 * the action dispatcher, MSW handlers, tests).
 *
 * Anti-pattern: do not combine these into a single root store. Each store
 * is one cohesive concern and they stay independent. Cross-store
 * coordination uses imperative `getState()` calls or `subscribe()` —
 * see §3.3 of the migration handoff.
 */

export { useAuthStore, _resetAuthStore } from './authStore';
export type { AuthStore } from './authStore';

export { useAppStore, _resetAppStore } from './appStore';
export type { AppStore } from './appStore';

export { useContextStore, _resetContextStore } from './contextStore';
export type { ContextStore } from './contextStore';

export { useUiStore, _resetUiStore } from './uiStore';
export type { UiStore } from './uiStore';

export { usePreferencesStore, _resetPreferencesStore } from './preferencesStore';
export type { PreferencesStore } from './preferencesStore';

export { useEventsStore, _resetEventsStore } from './eventsStore';
export type { EventsStore } from './eventsStore';

export { usePageRuntimeStore, _resetPageRuntimeStore } from './pageRuntimeStore';
export type { PageRuntimeStore } from './pageRuntimeStore';

export { useWidgetsStore, _resetWidgetsStore } from './widgetsStore';
export type { WidgetsStore } from './widgetsStore';

export { useSurfacesStore, _resetSurfacesStore } from './surfacesStore';
export type { SurfacesStore } from './surfacesStore';

export { useDirtyStateStore, _resetDirtyStateStore } from './dirtyStateStore';
export type { DirtyStateStore } from './dirtyStateStore';

export {
  useNotificationsStore,
  _resetNotificationsStore,
} from './notificationsStore';
export type { NotificationsStore, PushToastInput } from './notificationsStore';

import { _resetAuthStore } from './authStore';
import { _resetAppStore } from './appStore';
import { _resetContextStore } from './contextStore';
import { _resetUiStore } from './uiStore';
import { _resetPreferencesStore } from './preferencesStore';
import { _resetEventsStore } from './eventsStore';
import { _resetPageRuntimeStore } from './pageRuntimeStore';
import { _resetWidgetsStore } from './widgetsStore';
import { _resetSurfacesStore } from './surfacesStore';
import { _resetDirtyStateStore } from './dirtyStateStore';
import { _resetNotificationsStore } from './notificationsStore';

/**
 * Test helper: reset every store to its initial state.
 *
 * Per §13.6 of the migration handoff. Zustand stores are module-level
 * singletons; without this helper, state leaks between tests.
 */
export function resetAllStoresForTesting(): void {
  _resetAuthStore();
  _resetAppStore();
  _resetContextStore();
  _resetUiStore();
  _resetPreferencesStore();
  _resetEventsStore();
  _resetPageRuntimeStore();
  _resetWidgetsStore();
  _resetSurfacesStore();
  _resetDirtyStateStore();
  _resetNotificationsStore();
}
