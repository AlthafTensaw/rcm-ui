/**
 * @tensaw/actions
 *
 * Typed action contract for backend calls. Implements the spec in
 * docs/ACTION_CONTRACT.md.
 *
 * Public surface:
 *   - defineAction()              — registers a query/mutation/surface/navigate action
 *   - useActionQuery()            — fetch + subscribe React hook
 *   - useActionMutation()         — fire mutation React hook
 *   - useActionDispatcher()       — raw dispatch escape hatch
 *   - dispatchAction()            — non-React imperative dispatch
 *   - setActionStore()            — wire the Redux store at app boot
 *   - setRouterAdapter()          — wire the router adapter at app boot
 *   - getActionPermission()       — introspect required permission
 */

export const PACKAGE_VERSION = '0.0.0';

// Types
export type {
  ActionDeclaration,
  ActionError,
  ActionKind,
  ActionResult,
  DispatchOptions,
  DryRunResult,
  ErrorToastPolicy,
  MutationActionDeclaration,
  NavigateActionDeclaration,
  OptimisticPattern,
  QueryActionDeclaration,
  RequestOf,
  ResponseOf,
  SuccessToastPolicy,
  SurfaceActionDeclaration,
  SurfaceKind,
} from './types';

// Registry
export {
  defineAction,
  getAction,
  hasAction,
  listActions,
  getInvalidationsFor,
  _clearActionRegistry,
} from './registry';

// Dispatcher
//
// The `setActionStore`, `subscribeToCacheKey`, `readCacheValue`, and
// `isCacheFresh` re-exports are intentionally `@deprecated` compat shims
// from the Redux→Zustand migration (per §19.1 of the buildout spec). They
// continue to be re-exported here so existing callers don't break; the
// @deprecated JSDoc tags signal the migration path.
export {
  dispatchAction,
  setActionStore,
  setRouterAdapter,
  getRouterAdapter,
  subscribeToCacheKey,
  readCacheValue,
  isCacheFresh,
  _clearActionCache,
  type RouterAdapter,
} from './dispatcher';

// Hooks
export {
  useActionQuery,
  useActionMutation,
  useActionDispatcher,
  getActionPermission,
  type UseActionQueryResult,
  type UseActionQueryOptions,
  type UseActionMutationState,
  type ActionMutationFire,
} from './hooks';

// Patterns
export { applyOptimistic } from './patterns/optimistic';

// Utils
export {
  parseEndpoint,
  resolveEndpoint,
  buildQueryString,
  type HttpMethod,
  type ResolvedEndpoint,
} from './utils/endpoint';
export {
  deterministicStringify,
  deriveCacheKey,
  resolveCacheKey,
} from './utils/cacheKey';

// Wire the registry-aware cache-key resolver so hooks and dispatcher agree
// on the effective cache key when an action declares a custom cacheKey.
import { setCustomCacheKeyFnGetter } from './utils/cacheKey';
import { getAction } from './registry';
setCustomCacheKeyFnGetter((actionId) => {
  const decl = getAction(actionId);
  if (decl?.kind !== 'query') return undefined;
  return decl.cacheKey as ((request: unknown) => string) | undefined;
});
