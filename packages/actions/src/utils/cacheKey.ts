/**
 * Cache key derivation.
 *
 * Two requests that are semantically identical should hit the same cache slot
 * regardless of property order. The default derivation does a deterministic
 * stringify with sorted keys at every nesting level.
 *
 * Per spec §15 open question: this is the recommended default. Actions can
 * override per-instance later if a domain has a non-trivial equivalence
 * relation (e.g. ignoring a `_localOnly` flag).
 */

/**
 * Stable stringify with deterministic key order.
 * Skips undefined values (so `{a: 1, b: undefined}` === `{a: 1}`).
 */
export function deterministicStringify(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'null'; // shouldn't appear at top level; defensive
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => deterministicStringify(v)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${deterministicStringify(obj[k])}`);
    return `{${parts.join(',')}}`;
  }
  // Functions / symbols / bigint — should never appear in a request, but be defensive.
  // Use JSON to avoid relying on default object stringification.
  return JSON.stringify(`[${typeof value}]`);
}

/**
 * Derive a cache key for an action invocation. Combines the action id with a
 * deterministic stringification of the request.
 */
export function deriveCacheKey(actionId: string, request: unknown): string {
  return `${actionId}::${deterministicStringify(request)}`;
}

/**
 * Resolve the effective cache key for an action invocation, consulting the
 * registry. If the action is a query that declared a custom `cacheKey`
 * function (§15.1 of the action contract), the function's return value is
 * used verbatim. Otherwise falls back to the default derivation.
 *
 * The dispatcher uses this when reading/writing the cache; hooks use this
 * to ensure their subscription key matches the dispatcher's write key.
 */
export function resolveCacheKey(actionId: string, request: unknown): string {
  // Lazy import via top-level relative path would create a circular dep
  // (registry imports utils, utils would re-import registry). Instead we
  // accept the registry as a runtime accessor passed in by the dispatcher.
  // This module exposes only the pure derivation; registry-aware resolution
  // lives in the resolver below — wired by the dispatcher and hooks.
  const fn = customCacheKeyFnGetter?.(actionId);
  if (fn) {
    try {
      return fn(request);
    } catch {
      // If the user-supplied function throws, fall back to the default.
    }
  }
  return deriveCacheKey(actionId, request);
}

// Registry-aware getter. Set once at module load by the dispatcher (which
// owns the registry import). Avoids a hard circular dependency between
// `utils/cacheKey.ts` and `registry/index.ts`.
type CustomCacheKeyFnGetter = (actionId: string) => ((request: unknown) => string) | undefined;
let customCacheKeyFnGetter: CustomCacheKeyFnGetter | null = null;

/** Wired by the package root once the registry module is loaded. */
export function setCustomCacheKeyFnGetter(getter: CustomCacheKeyFnGetter | null): void {
  customCacheKeyFnGetter = getter;
}
