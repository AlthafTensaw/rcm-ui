/**
 * Action registry.
 *
 * Module-scoped store of all action declarations in the running app. Every
 * action defined via `defineAction()` lands here; `getAction()` and
 * `listActions()` read it. Tests can reset via `_clearActionRegistry()`.
 *
 * The registry is intentionally global. Apps that want isolation (Storybook,
 * unit tests) clear and repopulate.
 */

import type {
  ActionDeclaration,
  MutationActionDeclaration,
  NavigateActionDeclaration,
  QueryActionDeclaration,
  SurfaceActionDeclaration,
} from '../types';
import type { z } from 'zod';

const registry = new Map<string, ActionDeclaration>();

/**
 * Reverse index: maps a mutation actionId → set of cache tags it invalidates.
 * Built incrementally as actions are registered. Both directions of the
 * "what invalidates what" relationship feed this — `query.cache.invalidatedBy`
 * and `mutation.invalidates`.
 */
const mutationInvalidations = new Map<string, Set<string>>();

const ACTION_ID_PATTERN = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

/**
 * Define an action and register it. Overloaded so the return type matches the
 * input subtype — consumers get back the typed declaration so `useActionQuery`
 * et al. can narrow correctly.
 */
export function defineAction<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
  decl: QueryActionDeclaration<TReq, TRes>,
): QueryActionDeclaration<TReq, TRes>;
export function defineAction<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
  decl: MutationActionDeclaration<TReq, TRes>,
): MutationActionDeclaration<TReq, TRes>;
export function defineAction<TReq extends z.ZodTypeAny>(
  decl: SurfaceActionDeclaration<TReq>,
): SurfaceActionDeclaration<TReq>;
export function defineAction<TReq extends z.ZodTypeAny>(
  decl: NavigateActionDeclaration<TReq>,
): NavigateActionDeclaration<TReq>;
export function defineAction(decl: ActionDeclaration): ActionDeclaration {
  validateDeclaration(decl);

  // Idempotent re-registration with the same declaration is fine. Different
  // declaration with the same id is a programmer error.
  const existing = registry.get(decl.actionId);
  if (existing && existing !== decl) {
    if (isDev()) {
       
      console.warn(
        `[actions] Action "${decl.actionId}" registered twice with different declarations. Overwriting.`,
      );
    }
  }
  registry.set(decl.actionId, decl);
  rebuildInvalidationIndex();
  return decl;
}

/** Look up an action by id. */
export function getAction(actionId: string): ActionDeclaration | undefined {
  return registry.get(actionId);
}

/** True if the action is registered. */
export function hasAction(actionId: string): boolean {
  return registry.has(actionId);
}

/** All registered actions — used by tooling and OpenAPI emitters. */
export function listActions(): readonly ActionDeclaration[] {
  return Array.from(registry.values());
}

/**
 * Cache tags that should be invalidated when the given mutation succeeds.
 * Combines both relationship directions: queries that listed this mutation
 * in `invalidatedBy`, plus the mutation's own `invalidates` declaration.
 */
export function getInvalidationsFor(actionId: string): readonly string[] {
  const set = mutationInvalidations.get(actionId);
  return set ? Array.from(set) : [];
}

/** Reset the registry. Test-only; do not call in app code. */
export function _clearActionRegistry(): void {
  registry.clear();
  mutationInvalidations.clear();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateDeclaration(decl: ActionDeclaration): void {
  if (!ACTION_ID_PATTERN.test(decl.actionId)) {
    throw new Error(
      `[actions] Invalid actionId "${decl.actionId}". Must match <domain>.<verb>, lowercase, dot-separated.`,
    );
  }

  if (decl.kind === 'query' || decl.kind === 'mutation') {
    if (!decl.endpoint.includes(' ')) {
      throw new Error(
        `[actions] Action "${decl.actionId}": endpoint must be of form "METHOD /path", got "${decl.endpoint}".`,
      );
    }
    const [method] = decl.endpoint.split(' ');
    const validMethods = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
    if (!method || !validMethods.has(method)) {
      throw new Error(
        `[actions] Action "${decl.actionId}": unsupported HTTP method "${String(method)}".`,
      );
    }
  }

  if (decl.kind === 'surface') {
    if (!decl.componentId) {
      throw new Error(
        `[actions] Surface action "${decl.actionId}" must declare componentId.`,
      );
    }
  }

  if (decl.kind === 'navigate') {
    if (typeof decl.to !== 'function') {
      throw new Error(
        `[actions] Navigate action "${decl.actionId}" must declare \`to\` as a function.`,
      );
    }
  }
}

/**
 * Walk the registry and rebuild the mutation → tags invalidation index.
 * Called every time the registry changes. O(n) where n is action count;
 * negligible for any reasonable app.
 */
function rebuildInvalidationIndex(): void {
  mutationInvalidations.clear();

  for (const decl of registry.values()) {
    // Direction A: mutation.invalidates: ['ar-list']
    if (decl.kind === 'mutation' && decl.invalidates) {
      const set = ensureSet(mutationInvalidations, decl.actionId);
      for (const tag of decl.invalidates) set.add(tag);
    }

    // Direction B: query.cache.invalidatedBy: ['ar.update-owner']
    if (decl.kind === 'query' && decl.cache?.invalidatedBy) {
      const tag = decl.cache.tag;
      for (const mutId of decl.cache.invalidatedBy) {
        const set = ensureSet(mutationInvalidations, mutId);
        set.add(tag);
      }
    }
  }
}

function ensureSet(map: Map<string, Set<string>>, key: string): Set<string> {
  let s = map.get(key);
  if (!s) {
    s = new Set();
    map.set(key, s);
  }
  return s;
}

function isDev(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    return true;
  }
  if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
    return (import.meta.env as { DEV?: boolean }).DEV === true;
  }
  return false;
}
