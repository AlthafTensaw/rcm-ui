/**
 * React hooks for action consumption.
 *
 * `useActionQuery` — fires a query, subscribes to its cache key, returns
 *                    `{ data, isLoading, error, refetch }`.
 * `useActionMutation` — returns `[fire, { isLoading, error, data }]`.
 *                       The fire function returns the ActionResult.
 * `useActionDispatcher` — returns the raw dispatch function. Escape hatch for
 *                         imperative cases (button handlers wiring multiple
 *                         actions in sequence).
 *
 * These are intentionally narrow. Most widget code uses the first two; the
 * dispatcher form exists for the rare imperative case.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  dispatchAction,
  isCacheFresh,
  readCacheValue,
  subscribeToCacheKey,
} from '../dispatcher';
import { resolveCacheKey } from '../utils/cacheKey';
import { getAction } from '../registry';
import type { ActionError, ActionResult, DispatchOptions } from '../types';

// ---------------------------------------------------------------------------
// useActionQuery
// ---------------------------------------------------------------------------

export interface UseActionQueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: ActionError | null;
  refetch: () => Promise<void>;
}

export interface UseActionQueryOptions {
  /** Skip firing while truthy. Useful when the request depends on other state. */
  skip?: boolean;
  /** Cache freshness window (ms). Default 60_000. */
  freshFor?: number;
}

/**
 * Subscribe to a query action's cache. Fires the query if the cache is empty
 * or stale. Returns reactive state.
 *
 * The hook pre-validates the request through the action's Zod schema before
 * deriving the cache key. Without this, schemas with `.default(...)` cause
 * the subscription key (built from the raw request) and the dispatcher's
 * cache key (built from the validated request, with defaults applied) to
 * diverge — the dispatch writes to one entry and the subscription listens
 * on another, so the component never sees data. Pre-validation aligns both
 * sides of the cache contract.
 *
 * If validation fails (or the action is unregistered), we fall back to the
 * raw request — the dispatcher will reject the request with a validation
 * error, which the hook surfaces via `error`.
 */
export function useActionQuery<TData = unknown>(
  actionId: string,
  request: unknown,
  options: UseActionQueryOptions = {},
): UseActionQueryResult<TData> {
  const skip = options.skip === true;
  const freshFor = options.freshFor ?? 60_000;

  // Pre-validate so cache key derivation matches the dispatcher's validated
  // request shape (Issue #1). Memoized on actionId + raw request identity.
  const validatedRequest = useMemo(() => {
    const decl = getAction(actionId);
    if (decl?.kind !== 'query') return request;
    const parse = decl.request.safeParse(request);
    return parse.success ? (parse.data as unknown) : request;
  }, [actionId, request]);

  const cacheKey = resolveCacheKey(actionId, validatedRequest);
  const [data, setData] = useState<TData | undefined>(
    () => readCacheValue(cacheKey),
  );
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const isLoading = data === undefined && isFetching;

  // Subscribe to cache key changes.
  useEffect(() => {
    if (skip) return;
    const unsub = subscribeToCacheKey(cacheKey, (value) => {
      setData(value as TData | undefined);
    });
    return unsub;
  }, [cacheKey, skip]);

  // Fetch if cache is empty or stale.
  const fetchedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (skip) return;
    if (fetchedKeyRef.current === cacheKey && isCacheFresh(cacheKey, freshFor)) {
      return;
    }
    fetchedKeyRef.current = cacheKey;
    let cancelled = false;
    setIsFetching(true);
    setError(null);
    void dispatchAction<TData>(actionId, validatedRequest).then((result) => {
      if (cancelled) return;
      setIsFetching(false);
      if (!result.ok) setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [actionId, cacheKey, skip, freshFor, validatedRequest]);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    const result = await dispatchAction<TData>(actionId, validatedRequest);
    setIsFetching(false);
    if (!result.ok) setError(result.error);
  }, [actionId, validatedRequest]);

  return { data, isLoading, isFetching, error, refetch };
}

// ---------------------------------------------------------------------------
// useActionMutation
// ---------------------------------------------------------------------------

export interface UseActionMutationState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  error: ActionError | null;
  /** Reset internal state without firing. */
  reset: () => void;
}

export type ActionMutationFire<TReq, TRes> = (
  request: TReq,
) => Promise<ActionResult<TRes>>;

/**
 * Fire-a-mutation hook. Returns a `[fire, state]` tuple.
 *
 * The fire function returns the typed ActionResult. The state object reflects
 * the most recent fire.
 */
export function useActionMutation<TReq = unknown, TRes = unknown>(
  actionId: string,
): [ActionMutationFire<TReq, TRes>, UseActionMutationState<TRes>] {
  const [data, setData] = useState<TRes | undefined>(undefined);
  const [error, setError] = useState<ActionError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fire = useCallback<ActionMutationFire<TReq, TRes>>(
    async (request) => {
      setIsLoading(true);
      setError(null);
      const result = await dispatchAction<TRes>(actionId, request);
      setIsLoading(false);
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
      return result;
    },
    [actionId],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  return [fire, { data, isLoading, error, reset }];
}

// ---------------------------------------------------------------------------
// useActionDispatcher
// ---------------------------------------------------------------------------

/**
 * Returns the raw dispatch function. Used for imperative flows (e.g. opening
 * a surface in response to a non-React event, or dry-running an action).
 */
export function useActionDispatcher() {
  return useCallback(
    <TRes = unknown>(
      actionId: string,
      request?: unknown,
      options?: DispatchOptions,
    ): Promise<ActionResult<TRes>> => dispatchAction<TRes>(actionId, request, options),
    [],
  );
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

/**
 * Read the permission required to dispatch an action. Useful for components
 * that want to disable themselves when the user lacks permission, without
 * actually firing the action.
 */
export function getActionPermission(actionId: string): string | undefined {
  return getAction(actionId)?.permission;
}
