/**
 * @tensaw/runtime/effects — subscription-based platform effects.
 *
 * After the Redux → Zustand + TanStack Query migration, the four Redux
 * middleware (`eventMiddleware`, `errorListenerMiddleware`,
 * `preferenceMiddleware`, `idleTimeoutMiddleware`) are replaced by:
 *   - `events/publish`: direct function call (no middleware)
 *   - `effects/preferenceAutosave`: subscription with debounce
 *   - `effects/idleTimeout`: subscription on auth.lastActivityAt
 *   - `effects/contextEventBindings`: event handlers for context selections
 *   - `effects/notificationsEventBindings`: event handler for toast requests
 *   - TanStack Query `onError` (in `api/queryClient`): replaces error
 *     listener middleware
 *
 * `bootstrapApp` wires all of these on. Each returns an unsubscribe function
 * so tests and Storybook can tear down between scenarios.
 */

export {
  startPreferenceAutosave,
  setPreferenceSaver,
  _resetPreferenceAutosave,
  type PreferenceSaver,
  type PreferencesPayload,
} from './preferenceAutosave';

export {
  startIdleTimeout,
  _resetIdleTimeout,
  type StartIdleTimeoutOptions,
} from './idleTimeout';

export { startContextEventBindings } from './contextEventBindings';
export { startNotificationsEventBindings } from './notificationsEventBindings';
