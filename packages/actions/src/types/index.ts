/**
 * Action types.
 *
 * The TypeScript shapes that mirror the spec doc (docs/ACTION_CONTRACT.md).
 * Every action in any app is one of these four kinds.
 *
 * Each declaration is constrained at the type level so `defineAction()`
 * catches malformed entries at compile time rather than runtime.
 */

import type { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** All action kinds. New kinds require a platform RFC. */
export type ActionKind = 'query' | 'mutation' | 'surface' | 'navigate';

/** Visual mode for surface actions. */
export type SurfaceKind = 'modal' | 'drawer' | 'popup';

/**
 * Per-call dispatch options. Applies to any action kind.
 */
export interface DispatchOptions {
  /**
   * When true, run validation + permission check + request building, but skip
   * the network call, surface dispatch, navigation, optimistic updates, and
   * toasts. The dispatcher returns `{ ok: true, data: { dryRun: true, ... } }`
   * with the resolved wire-level details so AI generators and tests can verify
   * what would be dispatched without producing observable effects.
   *
   * If validation or permission fails, the dispatcher still returns the
   * predictable failure result — dryRun does not bypass safety checks.
   */
  dryRun?: boolean;
}

/**
 * Shape returned in `data` when `dryRun: true` is passed and the call would
 * have succeeded. Lets callers inspect what the wire-level dispatch would do.
 */
export interface DryRunResult {
  dryRun: true;
  actionId: string;
  kind: ActionKind;
  /** Resolved HTTP details for query/mutation. Undefined for surface/navigate. */
  wouldDispatch?: {
    method: string;
    url: string;
    body?: string;
  };
  /** Surface details for surface actions. */
  wouldOpenSurface?: {
    componentId: string;
    surfaceKind: SurfaceKind;
    props: Record<string, unknown>;
  };
  /** Navigation target for navigate actions. */
  wouldNavigate?: string;
}

/**
 * Result of dispatching an action. Never throws for predictable failures —
 * validation, permission, and backend errors all come back as `{ ok: false }`.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export interface ActionError {
  /** Stable machine-readable code. */
  code: string;
  /** Human-readable, PHI-scrubbed. */
  message: string;
  /** Optional structured detail (field-level validation errors, etc.). */
  details?: unknown;
}

/** Common fields every action declaration carries. */
interface BaseActionDeclaration {
  /** `<domain>.<verb>` form. Permanent once shipped. */
  actionId: string;
  /** Human description. Used by tooling and AI generators. */
  description?: string;
  /** Permission key required to dispatch. Resolved against `auth.user.permissions`. */
  permission?: string;
  /**
   * Per-action timeout in milliseconds. Defaults to 30,000 (30s) when omitted.
   * Override for known long-running actions (bulk mutations, large exports,
   * expensive analytics). Only meaningful for `query` and `mutation`.
   * For requests longer than ~2 minutes, prefer the polling-job pattern (future RFC).
   */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export interface QueryActionDeclaration<TReqSchema extends z.ZodTypeAny, TResSchema extends z.ZodTypeAny>
  extends BaseActionDeclaration {
  kind: 'query';
  /** `'GET /path/{withParams}'` form. */
  endpoint: string;
  /** Zod schema for request input. Path-param fields must be present here. */
  request: TReqSchema;
  /** Zod schema for response data (after envelope unwrap). */
  response: TResSchema;
  /** Cache behavior. */
  cache?: {
    /** Logical group name; queries sharing a tag invalidate together. */
    tag: string;
    /** Action ids that, when fired, invalidate this query's cache. */
    invalidatedBy?: readonly string[];
  };
  /**
   * Explicit cache-key derivation. Default is deterministic-stringify-with-sorted-keys
   * of the request. Override when domain semantics need a non-default equivalence
   * (e.g. ignore a `_localOnly` flag). The returned string is used verbatim as
   * the cache key — include the action id (or equivalent disambiguator) yourself.
   */
  cacheKey?: (request: z.infer<TReqSchema>) => string;
}

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

/** Built-in optimistic-update patterns. New patterns require a platform RFC. */
export type OptimisticPattern =
  | { pattern: 'none' }
  | {
      pattern: 'update-row-field';
      target: string; // cache tag
      rowIdFrom: (request: unknown) => string;
      fields: (request: unknown) => Record<string, unknown>;
    }
  | {
      pattern: 'replace-row';
      target: string;
      rowIdFrom: (request: unknown) => string;
    }
  | {
      pattern: 'append-row';
      target: string;
      rowFrom: (request: unknown) => unknown;
    }
  | {
      pattern: 'prepend-row';
      target: string;
      rowFrom: (request: unknown) => unknown;
    }
  | {
      pattern: 'remove-row';
      target: string;
      rowIdFrom: (request: unknown) => string;
    };

export type SuccessToastPolicy<TResData> =
  | string
  | ((data: TResData) => string)
  | undefined;

export type ErrorToastPolicy =
  | string
  | { kind: 'error-message' } // surface backend's error.message verbatim
  | ((error: ActionError) => string)
  | undefined;

export interface MutationActionDeclaration<TReqSchema extends z.ZodTypeAny, TResSchema extends z.ZodTypeAny>
  extends BaseActionDeclaration {
  kind: 'mutation';
  endpoint: string;
  request: TReqSchema;
  response: TResSchema;
  /**
   * Optimistic update declaration. Defaults to `{ pattern: 'none' }` when omitted.
   *
   * Patterns are intentionally a small fixed set. If a mutation needs custom
   * merge logic, it stops being an action and becomes a widget hook.
   */
  optimistic?: OptimisticPattern;
  /** Cache tags this mutation invalidates (alternative to declaring on the query side). */
  invalidates?: readonly string[];
  /** Toast on successful response. */
  onSuccess?: { toast?: SuccessToastPolicy<z.infer<TResSchema>> };
  /** Toast on failed response. */
  onError?: { toast?: ErrorToastPolicy };
}

// ---------------------------------------------------------------------------
// Surface
// ---------------------------------------------------------------------------

export interface SurfaceActionDeclaration<TReqSchema extends z.ZodTypeAny>
  extends BaseActionDeclaration {
  kind: 'surface';
  surfaceKind: SurfaceKind;
  /** Widget registry id of the component to render inside the surface. */
  componentId: string;
  request: TReqSchema;
  /** Maps args → component props. */
  propsFromArgs?: (args: z.infer<TReqSchema>) => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Navigate
// ---------------------------------------------------------------------------

export interface NavigateActionDeclaration<TReqSchema extends z.ZodTypeAny>
  extends BaseActionDeclaration {
  kind: 'navigate';
  request: TReqSchema;
  /** Returns the target route. */
  to: (args: z.infer<TReqSchema>) => string;
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

/**
 * Any action declaration. The exact subtype is tracked at registration
 * time; consumers usually don't see the union directly because `useActionQuery`
 * and `useActionMutation` are kind-specific.
 */
export type ActionDeclaration =
  | QueryActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>
  | MutationActionDeclaration<z.ZodTypeAny, z.ZodTypeAny>
  | SurfaceActionDeclaration<z.ZodTypeAny>
  | NavigateActionDeclaration<z.ZodTypeAny>;

/** Type helpers for inferring request/response from a declaration. */
export type RequestOf<TDecl> = TDecl extends { request: infer R }
  ? R extends z.ZodTypeAny
    ? z.infer<R>
    : never
  : never;

export type ResponseOf<TDecl> = TDecl extends { response: infer R }
  ? R extends z.ZodTypeAny
    ? z.infer<R>
    : never
  : never;
