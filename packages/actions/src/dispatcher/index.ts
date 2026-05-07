/**
 * Action dispatcher.
 *
 * Migrated from a hand-rolled cache + subscriber map to TanStack Query's
 * `queryClient`. Per §6.4 of the migration handoff, this is the integration
 * point the original code anticipated:
 *   "Future swap for SWR/React Query/etc. would only touch this file."
 *
 * Responsibilities (unchanged from the Redux era):
 *   1. Look up the action declaration in the registry
 *   2. Validate the request against its Zod schema
 *   3. Check permission against current auth state
 *   4. Execute by kind (query | mutation | surface | navigate)
 *   5. Errors return as `{ ok: false, error }` — never throw for predictable failures
 *
 * What changed internally:
 *   - Cache: `queryClient.getQueryData` / `setQueryData` / `fetchQuery`
 *   - Invalidation: `queryClient.invalidateQueries({ queryKey: [...] })`
 *   - HTTP: `authenticatedFetch` (replaces the inline fetch + envelope parse)
 *   - Surface dispatch: `useSurfacesStore.getState().openSurface(...)`
 *   - Auth read: `useAuthStore.getState()`
 *   - Toast: `useNotificationsStore.getState().pushToast(...)`
 *
 * Public API preserved:
 *   - `dispatchAction(id, request, options)` returns `ActionResult<T>`
 *   - `setActionStore` / `setActionStore` deprecated (ignored — no Redux store)
 *   - `setRouterAdapter` / `getRouterAdapter` unchanged
 *   - `subscribeToCacheKey`, `readCacheValue`, `isCacheFresh` reimplemented
 *     against TanStack Query so the hooks layer didn't have to change shape
 *   - `_clearActionCache` calls `queryClient.clear()`
 */

import type { z } from 'zod';
import {
  authenticatedFetch,
  ApiError,
  buildActionQueryKey,
  config,
  PLATFORM_ERROR_CODES,
  queryClient,
  useAuthStore,
  useNotificationsStore,
  useSurfacesStore,
} from '@tensaw/runtime';
import {
  getAction,
  getInvalidationsFor,
} from '../registry';
import type {
  ActionDeclaration,
  ActionError,
  ActionResult,
  DispatchOptions,
  DryRunResult,
  ErrorToastPolicy,
  MutationActionDeclaration,
  NavigateActionDeclaration,
  QueryActionDeclaration,
  SuccessToastPolicy,
  SurfaceActionDeclaration,
} from '../types';
import { applyOptimistic } from '../patterns/optimistic';
import { buildQueryString, resolveEndpoint } from '../utils/endpoint';
import { resolveCacheKey } from '../utils/cacheKey';

// ---------------------------------------------------------------------------
// Router adapter (for navigate actions)
// ---------------------------------------------------------------------------

export interface RouterAdapter {
  push(to: string): void;
}

let routerAdapter: RouterAdapter | null = null;

export function setRouterAdapter(adapter: RouterAdapter | null): void {
  routerAdapter = adapter;
}

export function getRouterAdapter(): RouterAdapter | null {
  return routerAdapter;
}

// ---------------------------------------------------------------------------
// Store wiring (kept for API compatibility; the dispatcher no longer needs
// a Redux store, but call sites won't break.)
// ---------------------------------------------------------------------------

/**
 * @deprecated The dispatcher no longer needs a Redux store; this is a no-op
 *   kept so existing bootstrap code doesn't crash. Remove call sites at the
 *   first convenient cleanup pass.
 */
export function setActionStore(_store: unknown): void {
  // Intentionally a no-op. Kept for backwards compatibility during migration.
}

// ---------------------------------------------------------------------------
// Cache compatibility shims
//
// The hook layer historically called `readCacheValue`, `subscribeToCacheKey`,
// `isCacheFresh`. After migration these are thin wrappers around the
// queryClient. Keeping the names spares the hooks from a rewrite.
// ---------------------------------------------------------------------------

function actionQueryKey(actionId: string, request: unknown): readonly unknown[] {
  // Use the platform's standard action key shape: ['action', actionId, requestKey].
  // resolveCacheKey returns "actionId::{requestStringified}". We strip the
  // prefix so the queryKey's third element is just the request portion —
  // matches what `readCacheValue('actionId::{...}')` expects when it splits.
  const fullKey = resolveCacheKey(actionId, request);
  const sep = fullKey.indexOf('::');
  const requestKey = sep < 0 ? fullKey : fullKey.slice(sep + 2);
  return buildActionQueryKey(actionId, requestKey);
}

/**
 * Read the current cached value for an action+request. Undefined if not cached.
 *
 * @deprecated Compat shim from the Redux→Zustand migration. The hooks layer
 * (`useActionQuery` / `useActionMutation`) currently calls this; once those
 * hooks are rewritten directly against TanStack Query's `useQuery` /
 * `useMutation`, this shim and its siblings will be removed. Prefer
 * `queryClient.getQueryData(...)` / `queryClient.getQueryCache().subscribe(...)` /
 * `queryClient.getQueryState(...)` directly. See
 * `packages/runtime/docs/ADR-001-redux-to-zustand.md`.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/unified-signatures */
export function readCacheValue<T = unknown>(
  cacheKey: string,
): T | undefined;
export function readCacheValue<T = unknown>(
  actionId: string,
  request: unknown,
): T | undefined;
export function readCacheValue<T = unknown>(
  actionIdOrKey: string,
  request?: unknown,
): T | undefined {
/* eslint-enable @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/unified-signatures */
  // Backwards-compat: when called with a single string arg the value is a
  // composed cache key (the way useActionQuery used to call it). Map it to a
  // queryKey by treating the string as `${actionId}::${requestKey}` and
  // splitting back. The hooks now pass (actionId, request) directly.
  if (request === undefined) {
    const compositeKey = actionIdOrKey;
    // Old shape: 'actionId::requestKey'. Try to split.
    const sep = compositeKey.indexOf('::');
    if (sep < 0) {
      return queryClient.getQueryData<T>([
        'action',
        compositeKey,
        '',
      ] as const);
    }
    const actionId = compositeKey.slice(0, sep);
    const requestKey = compositeKey.slice(sep + 2);
    return queryClient.getQueryData<T>(
      buildActionQueryKey(actionId, requestKey),
    );
  }
  return queryClient.getQueryData<T>(
    actionQueryKey(actionIdOrKey, request),
  );
}

/**
 * Subscribe to a cache key. Returns an unsubscribe function.
 *
 * Forwards to TanStack Query's queryCache subscription mechanism.
 *
 * @deprecated Compat shim from the Redux→Zustand migration. The hooks layer
 * (`useActionQuery` / `useActionMutation`) currently calls this; once those
 * hooks are rewritten directly against TanStack Query's `useQuery` /
 * `useMutation`, this shim and its siblings will be removed. Prefer
 * `queryClient.getQueryData(...)` / `queryClient.getQueryCache().subscribe(...)` /
 * `queryClient.getQueryState(...)` directly. See
 * `packages/runtime/docs/ADR-001-redux-to-zustand.md`.
 */
export function subscribeToCacheKey(
  cacheKey: string,
  fn: (value: unknown) => void,
): () => void {
  // Map the historical "actionId::requestKey" string into a TanStack queryKey.
  let queryKey: readonly unknown[];
  const sep = cacheKey.indexOf('::');
  if (sep < 0) {
    queryKey = ['action', cacheKey, ''] as const;
  } else {
    queryKey = buildActionQueryKey(
      cacheKey.slice(0, sep),
      cacheKey.slice(sep + 2),
    );
  }

  // Fire once with the current value (matches the old behavior).
  const initial = queryClient.getQueryData(queryKey);
  if (initial !== undefined) fn(initial);

  // Subscribe via the queryClient's internal QueryCache. TanStack's event
  // shape is loosely typed at the cache-subscriber boundary; we cast to
  // `unknown[]` explicitly to avoid the unsafe-any flood.
  const cache = queryClient.getQueryCache();
  return cache.subscribe((event) => {
    const eventKey = event.query.queryKey as readonly unknown[];
    if (
      eventKey.length === queryKey.length &&
      eventKey.every((part, i) => part === queryKey[i])
    ) {
      fn(event.query.state.data);
    }
  });
}

/**
 * True if the cache has a fresh-enough entry.
 *
 * @deprecated Compat shim from the Redux→Zustand migration. The hooks layer
 * (`useActionQuery` / `useActionMutation`) currently calls this; once those
 * hooks are rewritten directly against TanStack Query's `useQuery` /
 * `useMutation`, this shim and its siblings will be removed. Prefer
 * `queryClient.getQueryData(...)` / `queryClient.getQueryCache().subscribe(...)` /
 * `queryClient.getQueryState(...)` directly. See
 * `packages/runtime/docs/ADR-001-redux-to-zustand.md`.
 */
export function isCacheFresh(cacheKey: string, maxAgeMs = 60_000): boolean {
  let queryKey: readonly unknown[];
  const sep = cacheKey.indexOf('::');
  if (sep < 0) {
    queryKey = ['action', cacheKey, ''] as const;
  } else {
    queryKey = buildActionQueryKey(
      cacheKey.slice(0, sep),
      cacheKey.slice(sep + 2),
    );
  }
  const state = queryClient.getQueryState(queryKey);
  if (state?.data === undefined) return false;
  return Date.now() - state.dataUpdatedAt < maxAgeMs;
}

/** Clear the in-memory cache. Test-only. */
export function _clearActionCache(): void {
  queryClient.clear();
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function dispatchAction<T = unknown>(
  actionId: string,
  request: unknown = {},
  options: DispatchOptions = {},
): Promise<ActionResult<T>> {
  const decl = getAction(actionId);
  if (!decl) {
    throw new Error(`[actions] Unknown actionId "${actionId}".`);
  }

  // Validate request input. Still runs in dry-run mode.
  const requestParse = (decl.request).safeParse(request);
  if (!requestParse.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: `Request validation failed for ${actionId}.`,
        details: requestParse.error.flatten(),
      },
    };
  }
  const validRequest = requestParse.data as Record<string, unknown>;

  // Permission check. Still runs in dry-run mode.
  if (decl.permission) {
    const perms = useAuthStore.getState().user?.permissions ?? [];
    if (!perms.includes(decl.permission)) {
      return {
        ok: false,
        error: {
          code: PLATFORM_ERROR_CODES.FORBIDDEN,
          message: `Missing required permission: ${decl.permission}.`,
        },
      };
    }
  }

  // Dry-run short-circuit.
  if (options.dryRun === true) {
    return executeDryRun<T>(decl, validRequest);
  }

  switch (decl.kind) {
    case 'query':
      return executeQuery<T>(decl, validRequest);
    case 'mutation':
      return executeMutation<T>(decl, validRequest);
    case 'surface':
      return executeSurface<T>(decl, validRequest);
    case 'navigate':
      return executeNavigate<T>(decl, validRequest);
  }
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

function executeDryRun<T>(
  decl: ActionDeclaration,
  request: Record<string, unknown>,
): ActionResult<T> {
  if (decl.kind === 'query' || decl.kind === 'mutation') {
    let resolved;
    try {
      resolved = resolveEndpoint(decl.endpoint, request);
    } catch (e) {
      return {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: e instanceof Error ? e.message : String(e),
        },
      };
    }
    const { method, path, remainder } = resolved;
    const url =
      method === 'GET' || method === 'DELETE'
        ? `${config.api.baseUrl}${path}${buildQueryString(remainder)}`
        : `${config.api.baseUrl}${path}`;
    const dryRunData: DryRunResult = {
      dryRun: true,
      actionId: decl.actionId,
      kind: decl.kind,
      wouldDispatch: {
        method,
        url,
        ...(method === 'GET' || method === 'DELETE'
          ? {}
          : { body: JSON.stringify(remainder) }),
      },
    };
    return { ok: true, data: dryRunData as T };
  }

  if (decl.kind === 'surface') {
    const props = decl.propsFromArgs ? decl.propsFromArgs(request) : request;
    const dryRunData: DryRunResult = {
      dryRun: true,
      actionId: decl.actionId,
      kind: 'surface',
      wouldOpenSurface: {
        componentId: decl.componentId,
        surfaceKind: decl.surfaceKind,
        props,
      },
    };
    return { ok: true, data: dryRunData as T };
  }

  // navigate
  const target = decl.to(request);
  const dryRunData: DryRunResult = {
    dryRun: true,
    actionId: decl.actionId,
    kind: 'navigate',
    wouldNavigate: target,
  };
  return { ok: true, data: dryRunData as T };
}

// ---------------------------------------------------------------------------
// Kind-specific executors
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;

async function executeQuery<T>(
  decl: QueryActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>,
  request: Record<string, unknown>,
): Promise<ActionResult<T>> {
  const queryKey = actionQueryKey(decl.actionId, request);

  try {
    // fetchQuery handles dedupe/cache lookup automatically. Disable retries
    // so the actions contract preserves its "fail fast" behavior — each
    // dispatch() returns one ActionResult, not a retry loop.
    const data = await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => runHttpToData(decl, request),
      staleTime: 60_000,
      retry: false,
    });
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, error: errorFromUnknown(err) };
  }
}

async function executeMutation<T>(
  decl: MutationActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>,
  request: Record<string, unknown>,
): Promise<ActionResult<T>> {
  // Apply optimistic patch BEFORE the network call.
  const reverts: (() => void)[] = [];
  if (decl.optimistic && decl.optimistic.pattern !== 'none') {
    const targetTag = (decl.optimistic as { target: string }).target;
    // Walk every cached query whose action declaration tags it with target.
    const allQueries = queryClient.getQueryCache().getAll();
    for (const q of allQueries) {
      // Action queries have key shape ['action', actionId, requestKey].
      const key = q.queryKey;
      if (key.length < 2 || key[0] !== 'action') continue;
      const cachedActionId = key[1] as string;
      const cachedDecl = getAction(cachedActionId);
      if (
        cachedDecl?.kind !== 'query' ||
        cachedDecl.cache?.tag !== targetTag
      ) {
        continue;
      }
      const before = q.state.data;
      const applied = applyOptimistic(decl.optimistic, request, before);
      if (applied) {
        queryClient.setQueryData(q.queryKey, applied.next);
        reverts.push(() => {
          queryClient.setQueryData(q.queryKey, before);
        });
      }
    }
  }

  let result: ActionResult<T>;
  try {
    const data = await runHttpToData(decl, request);
    result = { ok: true, data: data as T };
  } catch (err) {
    // Roll back optimistic patches.
    for (const r of reverts) r();
    const error = errorFromUnknown(err);
    fireErrorToast(decl.onError?.toast, error);
    return { ok: false, error };
  }

  // Reconcile cached entries with the server response if the optimistic
  // pattern is `replace-row`. The `result.ok` check is redundant in flow
  // (the catch branch returns early) but keeps the narrowing local.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (decl.optimistic?.pattern === 'replace-row' && result.ok) {
    const targetTag = decl.optimistic.target;
    const id = decl.optimistic.rowIdFrom(request);
    const allQueries = queryClient.getQueryCache().getAll();
    for (const q of allQueries) {
      const key = q.queryKey;
      if (key.length < 2 || key[0] !== 'action') continue;
      const cachedActionId = key[1] as string;
      const cachedDecl = getAction(cachedActionId);
      if (
        cachedDecl?.kind !== 'query' ||
        cachedDecl.cache?.tag !== targetTag
      ) {
        continue;
      }
      const current = q.state.data;
      if (!isListShape(current)) continue;
      const next = {
        ...current,
        rows: current.rows.map((row) =>
          rowId(row) === id ? (result.data as Record<string, unknown>) : row,
        ),
      };
      queryClient.setQueryData(q.queryKey, next);
    }
  }

  // Invalidate downstream caches by tag.
  const tagsToInvalidate = getInvalidationsFor(decl.actionId);
  if (tagsToInvalidate.length > 0) {
    // Find all action queries whose declaration has cache.tag === one of the tags.
    const allQueries = queryClient.getQueryCache().getAll();
    for (const q of allQueries) {
      const key = q.queryKey;
      if (key.length < 2 || key[0] !== 'action') continue;
      const cachedActionId = key[1] as string;
      const cachedDecl = getAction(cachedActionId);
      if (cachedDecl?.kind !== 'query') continue;
      const tag = cachedDecl.cache?.tag;
      if (tag && tagsToInvalidate.includes(tag)) {
        await queryClient.invalidateQueries({ queryKey: q.queryKey });
      }
    }
  }

  fireSuccessToast(decl.onSuccess?.toast, result.data);

  return result;
}

// `executeSurface` and `executeNavigate` are sync internally but the
// dispatcher contract expects every executor to return a Promise. Use
// `Promise.resolve` rather than `async` so we don't trip the require-await
// lint without changing the public contract.
function executeSurface<T>(
  decl: SurfaceActionDeclaration<z.ZodTypeAny>,
  request: Record<string, unknown>,
): Promise<ActionResult<T>> {
  const props = decl.propsFromArgs ? decl.propsFromArgs(request) : request;
  useSurfacesStore.getState().openSurface({
    surfaceId: generateCorrelationId(),
    kind: decl.surfaceKind,
    componentId: decl.componentId,
    props,
  });
  return Promise.resolve({ ok: true, data: undefined as T });
}

function executeNavigate<T>(
  decl: NavigateActionDeclaration<z.ZodTypeAny>,
  request: Record<string, unknown>,
): Promise<ActionResult<T>> {
  const adapter = routerAdapter;
  if (!adapter) {
    return Promise.resolve({
      ok: false,
      error: {
        code: 'NAVIGATE_NO_ADAPTER',
        message:
          'No router adapter configured. Call setRouterAdapter(...) during app boot.',
      },
    });
  }
  const target = decl.to(request);
  adapter.push(target);
  return Promise.resolve({ ok: true, data: undefined as T });
}

// ---------------------------------------------------------------------------
// HTTP — uses authenticatedFetch from @tensaw/runtime
// ---------------------------------------------------------------------------

async function runHttpToData(
  decl:
    | QueryActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>
    | MutationActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>,
  request: Record<string, unknown>,
): Promise<unknown> {
  let resolved;
  try {
    resolved = resolveEndpoint(decl.endpoint, request);
  } catch (e) {
    throw new ApiError(
      'BAD_REQUEST',
      0,
      e instanceof Error ? e.message : String(e),
    );
  }
  const { method, path, remainder } = resolved;
  const timeoutMs = decl.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (method === 'GET' || method === 'DELETE') {
    return authenticatedFetch(`${path}${buildQueryString(remainder)}`, {
      method,
      timeoutMs,
      responseSchema: decl.response,
    });
  }
  return authenticatedFetch(path, {
    method,
    body: remainder,
    timeoutMs,
    responseSchema: decl.response,
  });
}

function errorFromUnknown(err: unknown): ActionError {
  if (err instanceof ApiError) {
    return {
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }
  if (err instanceof Error) {
    return {
      code: PLATFORM_ERROR_CODES.NETWORK_ERROR,
      message: err.message,
    };
  }
  return {
    code: PLATFORM_ERROR_CODES.NETWORK_ERROR,
    message: String(err),
  };
}

// ---------------------------------------------------------------------------
// Toast helpers
// ---------------------------------------------------------------------------

function fireSuccessToast<T>(policy: SuccessToastPolicy<T>, data: T): void {
  if (!policy) return;
  const message = typeof policy === 'function' ? policy(data) : policy;
  useNotificationsStore.getState().pushToast({
    toastId: generateCorrelationId(),
    severity: 'success',
    title: message,
  });
}

function fireErrorToast(policy: ErrorToastPolicy, error: ActionError): void {
  if (!policy) return;
  let message: string;
  if (typeof policy === 'string') {
    message = policy;
  } else if (typeof policy === 'function') {
    message = policy(error);
  } else {
    // policy is narrowed to { kind: 'error-message' } by the union exhaustion
    // (string/function handled above). Assign error.message directly.
    message = error.message;
  }
  useNotificationsStore.getState().pushToast({
    toastId: generateCorrelationId(),
    severity: 'error',
    title: message,
  });
}

// ---------------------------------------------------------------------------
// Local helpers (also used for reconcile path)
// ---------------------------------------------------------------------------

interface ListShape {
  rows: Record<string, unknown>[];
  totalCount: number;
}

function isListShape(value: unknown): value is ListShape {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.rows) && typeof v.totalCount === 'number';
}

function rowId(row: unknown): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const r = row as Record<string, unknown>;
  if (typeof r.id === 'string') return r.id;
  if (typeof r.rowId === 'string') return r.rowId;
  if (typeof r.id === 'number') return String(r.id);
  return undefined;
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${String(Date.now())}-${Math.random().toString(36).slice(2, 10)}`;
}
