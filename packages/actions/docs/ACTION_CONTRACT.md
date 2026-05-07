# Tensaw Action Contract — Specification

**Status:** Proposed (Round 1)
**Owner:** Platform team
**Audience:** Frontend developers, backend developers, AI code generators
**Source of truth for:** every backend call the UI makes

---

## Why this exists

Today, every page that calls the backend writes its own fetch logic, its own cache invalidation, its own optimistic update, its own toast wiring, and its own error handling. That makes pages slow to write, inconsistent in behavior, and impossible to audit.

The action contract changes that. **Every backend call the UI makes is declared as a typed Action with a stable id.** Widgets reference actions by id; the runtime handles fetching, caching, invalidation, optimistic updates, permissions, and error normalization. Backend developers and frontend developers negotiate the action registry — not React code.

The contract has hard rules. Actions describe **what to call, what to validate, what to invalidate**. They do not contain business logic, conditional branches, or transformation pipelines. The moment something needs an `if`, it stops being an action and becomes a custom widget hook.

---

## 1. Action kinds

There are exactly four kinds. New kinds require a platform RFC.

| Kind | Purpose | Returns | Example |
|---|---|---|---|
| `query` | Read data from backend | `data` (typed) | Fetch the AR worklist rows |
| `mutation` | Write to backend, possibly with optimistic update | `data` (typed, often the updated entity) | Update an AR row's owner |
| `surface` | Open a modal/drawer/popup | nothing — opens UI | Open the EOB preview drawer |
| `navigate` | Change route | nothing — navigates | Open the claim detail page |

All four share the same declaration surface (`actionId`, `permission`, `description`). They differ in what additional fields they require.

---

## 2. Identification

Every action has a `string` id of the form `<domain>.<verb>` or `<domain>.<verb>-<noun>`:

- `ar.list`
- `ar.update-owner`
- `ar.update-due-date`
- `ar.preview-eob`
- `ar.open-detail`
- `claims.add-to-workflow`
- `notes.list`
- `notes.create`

Domain names are drawn from a controlled vocabulary defined in `@tensaw/actions/domains`. Verbs are drawn from a smaller controlled vocabulary: `list`, `get`, `create`, `update-<field>`, `delete`, `preview-<noun>`, `open-<noun>`, `add-<noun>`, `remove-<noun>`. Verbs outside this vocabulary require a platform review.

The id is permanent. Once an action ships, its id may not change. Renaming is a deprecation cycle.

---

## 3. Endpoint binding

Every `query` and `mutation` action declares its HTTP method and path:

```
endpoint: 'GET /api/v1/worklists/ar-management'
endpoint: 'PATCH /api/v1/ar/{rowId}/owner'
endpoint: 'POST /api/v1/workflow/cases'
```

Path parameters use `{name}` syntax. The action's request schema must include a field of the same name; the dispatcher substitutes them at call time. Unmatched path parameters throw at dispatch time, before any network call.

Query parameters are derived from the request schema. Any field not consumed by a path parameter is sent as a query string for `GET`, or as the JSON body for `POST/PATCH/PUT/DELETE`.

The `baseUrl` is read from the validated config module — actions never hardcode hosts.

---

## 4. Schemas

Every action declares a Zod schema for its request and response:

```ts
const UpdateOwnerRequest = z.object({
  rowId: z.string(),
  ownerId: z.string().nullable(),
});

const UpdateOwnerResponse = z.object({
  rowId: z.string(),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  updatedAt: z.string(),
});
```

Schemas serve four purposes:

1. **TypeScript types** — `z.infer` produces the types that hooks return.
2. **Runtime validation** — in dev mode, request inputs and response data are validated. Schema mismatches throw with a typed error code so the dev sees them immediately. In production, validation runs on a 1% sample to catch drift without paying the perf cost on every call.
3. **OpenAPI generation** — a future tool will emit an OpenAPI spec from the action registry.
4. **AI generator legibility** — when an AI generates a new widget, the schema is the contract it codes against.

For `surface` and `navigate` actions, only the request schema is required; there is no response schema (they don't return data).

---

## 5. The wire envelope

Every backend response conforms to `ApiResponse<T>` from `@tensaw/runtime/api`:

```ts
type ApiSuccess<T> = { success: true; data: T; meta: ApiMeta };
type ApiError      = { success: false; error: ApiErrorBody; meta: ApiMeta };
```

Action consumers never see this envelope directly. The dispatcher unwraps `success: true` into `data` and surfaces `success: false` as a typed error. This isolation matters: the wire format can change without breaking action consumers.

The error body shape is fixed:

```ts
interface ApiErrorBody {
  code: string;       // Stable machine-readable code, e.g. "OWNER_NOT_FOUND"
  message: string;    // Human-readable, PHI-scrubbed by the backend
  details?: unknown;  // Optional structured detail (field-level validation errors)
}
```

The dispatcher additionally produces these client-side error codes when the network layer fails: `PLATFORM_NETWORK_ERROR`, `PLATFORM_TIMEOUT`, `PLATFORM_UNAUTHORIZED`, `PLATFORM_FORBIDDEN`, `PLATFORM_ENVELOPE_INVALID`. These are documented constants in `@tensaw/runtime/api`.

---

## 6. Cache and invalidation (queries only)

Queries are RTK Query endpoints under the hood, but consumers never touch RTK Query directly. The action declares its cache behavior:

```ts
{
  cache: {
    tag: 'ar-list',
    invalidatedBy: ['ar.update-owner', 'ar.update-due-date', 'claims.add-to-workflow'],
  }
}
```

- **`tag`** is a registry-unique cache key. Multiple queries can share a tag (e.g. `ar-list` filtered by clinic and `ar-list` filtered by aging) — they invalidate together.
- **`invalidatedBy`** lists the action ids that, when they fire successfully, trigger a refetch of any in-flight or cached result for this query.

The dispatcher handles invalidation. A mutation completing successfully fires invalidations on every query whose `invalidatedBy` list includes that mutation's id. The list is checked in both directions at registration time — a mutation can also declare `invalidates: ['ar-list']` for symmetric expression. **Both forms are equivalent**; the registry normalizes them.

There is **no manual cache poking** from widget code. If a developer finds themselves wanting to manually invalidate, the right answer is to declare the relationship in the action registry.

The dispatcher also de-duplicates in-flight identical queries — two widgets calling `ar.list` with the same parameters share one network call.

---

## 7. Optimistic updates (mutations only)

Mutations may declare an optimistic-update pattern from a fixed set:

| Pattern | Meaning |
|---|---|
| `update-row-field` | Find the row in the cached query result by id, update one or more fields. Used for inline-edit cells. |
| `replace-row` | Find the row by id, replace it with the response shape. Used when a mutation returns the full updated entity. |
| `append-row` | Add the response to the end of the cached query result. Used for "Add to workflow" and similar create-and-list-it-on-screen flows. |
| `prepend-row` | Same as `append-row` but to the front. Used for chronological lists where new items go on top (notes, messages). |
| `remove-row` | Remove the row by id from the cached query result. Used for delete and remove-from-workflow. |
| `none` (default) | No optimistic update; the UI waits for the network round-trip before reflecting the change. |

Each pattern is declared with the field mapping:

```ts
{
  optimistic: {
    pattern: 'update-row-field',
    target: 'ar-list',                            // which query's cache to mutate
    rowIdFrom: (request) => request.rowId,        // pull id from the request
    fields: (request) => ({ ownerId: request.ownerId }),
  }
}
```

On dispatch, the dispatcher applies the optimistic patch immediately. On network success, it reconciles with the response (typically a no-op since the optimistic update was correct). On network failure, it rolls back.

If the optimistic shape doesn't match the actual cached row shape, the dev-mode runtime warns. Patterns deliberately do not allow arbitrary functions — the moment a mutation needs custom merge logic, it's no longer an action; it's a widget hook.

---

## 8. Permissions

Actions declare a `permission` key:

```ts
{ permission: 'ar.write' }
```

Resolution order:

1. **Action declaration** wins.
2. If the action doesn't declare a permission, **none is required** (signed-in user can dispatch).

The dispatcher checks the permission before any network call. A permission failure throws synchronously with `code: 'PLATFORM_FORBIDDEN'` — the action does not fire, no toast appears, no telemetry is sent. The widget's `<ActionButton>` (in the UI batch) will read the permission from the registry and auto-disable.

The permission key is a string. The auth slice's `permissions: string[]` array is the source of truth. Wildcard permissions are not supported in this iteration.

---

## 9. Toasts

Mutations may declare success and error toast policies:

```ts
{
  onSuccess: { toast: 'Owner updated' },
  onError: {
    toast: {
      // String key → look up message from the error code, fall back to error.message.
      // Or pass a literal string.
      kind: 'error-message',
    },
  },
}
```

Toast text may be a literal string or a function of the response/error. Functions are kept narrow:

```ts
onSuccess: { toast: (response) => `Added ${response.count} claims to workflow` }
```

Functions in `onSuccess.toast` are allowed because they're trivial transformations. Functions in `onError.toast` are also allowed but discouraged — most error toasts should use `'error-message'` to surface the backend's PHI-scrubbed message verbatim.

Toasts default to `none` for both success and error if not declared. Queries have no toast policy (a failed query is rendered as an error state in the consuming widget, not as a toast).

---

## 10. Surface actions

Surface actions open a modal, drawer, or popup. They reference a component by id from the widget registry (Phase 6) and pass props derived from the row or arguments:

```ts
{
  actionId: 'ar.preview-eob',
  kind: 'surface',
  surfaceKind: 'drawer',
  componentId: 'eob.preview-widget',
  propsFromArgs: (args) => ({
    rowId: args.rowId,
    claimNumber: args.claimNumber,
  }),
  permission: 'eob.read',
}
```

The dispatcher:

1. Checks the permission.
2. Verifies the `componentId` is registered.
3. Calls the props mapper.
4. Dispatches `surfaces/openSurface` with the resolved props.

That's it. No network call. The widget being opened owns its own data fetching (which it does via... another action).

---

## 11. Navigate actions

Navigate actions push a route:

```ts
{
  actionId: 'ar.open-detail',
  kind: 'navigate',
  to: (args) => `/ar/${args.rowId}`,
  permission: 'ar.read',
}
```

The dispatcher:

1. Checks the permission.
2. Calls the `to` function.
3. Dispatches navigation through the configured router adapter.

The router adapter is injected at app boot. The default adapter is React Router v6; apps can swap it. The action package does not depend on a specific router.

---

## 12. Dispatcher contract

The dispatcher is the only thing that fires actions. Widgets never call `fetch`, `dispatch(api.endpoints.foo.initiate())`, or any RTK Query primitive directly.

```ts
const dispatchAction = useActionDispatcher();

await dispatchAction('ar.update-owner', { rowId: 'r1', ownerId: 'u1' });
```

The dispatcher returns a `Promise<ActionResult<T>>`:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
```

It never throws for predictable failures (validation, permission, backend errors). It only throws for programmer errors — unknown action id, malformed registry entry, unmatched path parameter. Those should crash loud in dev.

For React consumption, two hooks wrap the dispatcher with state:

```ts
const { data, isLoading, error, refetch } = useActionQuery('ar.list', {
  filters,
  sort,
  pageIndex: 0,
  pageSize: 25,
});

const [updateOwner, { isLoading, error }] = useActionMutation('ar.update-owner');
await updateOwner({ rowId: 'r1', ownerId: 'u1' });
```

These wrappers handle the React lifecycle (subscribe, unsubscribe, suspense if the consumer opts in).

---

## 13. Worked examples

### 13.1 Query — fetch the AR worklist

```ts
defineAction({
  actionId: 'ar.list',
  kind: 'query',
  endpoint: 'GET /api/v1/worklists/ar-management',
  permission: 'ar.read',
  description: 'List AR claims for the active clinic, paginated and filtered.',
  request: z.object({
    clinicIds: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    payerIds: z.array(z.string()).optional(),
    ownerIds: z.array(z.string()).optional(),
    dosFrom: z.string().optional(),
    dosTo: z.string().optional(),
    sort: z.string().optional(),         // e.g. "balance:desc"
    pageIndex: z.number().int().min(0),
    pageSize: z.number().int().min(1).max(100),
  }),
  response: z.object({
    rows: z.array(ARRowSchema),
    totalCount: z.number(),
  }),
  cache: {
    tag: 'ar-list',
    invalidatedBy: [
      'ar.update-owner',
      'ar.update-due-date',
      'claims.add-to-workflow',
    ],
  },
});
```

### 13.2 Mutation — update a row's owner

```ts
defineAction({
  actionId: 'ar.update-owner',
  kind: 'mutation',
  endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
  permission: 'ar.write',
  description: 'Assign or unassign the owner for a single AR row.',
  request: z.object({
    rowId: z.string(),
    ownerId: z.string().nullable(),
  }),
  response: ARRowSchema,
  optimistic: {
    pattern: 'update-row-field',
    target: 'ar-list',
    rowIdFrom: (req) => req.rowId,
    fields: (req) => ({ ownerId: req.ownerId }),
  },
  onSuccess: { toast: 'Owner updated' },
  onError: { toast: { kind: 'error-message' } },
});
```

### 13.3 Mutation — bulk add to workflow

```ts
defineAction({
  actionId: 'claims.add-to-workflow',
  kind: 'mutation',
  endpoint: 'POST /api/v1/workflow/cases:bulk',
  permission: 'workflow.write',
  description: 'Open RCM_CASE in NEW_AR_REVIEW for a set of claim ids.',
  request: z.object({
    claimIds: z.array(z.string()).min(1),
    initialPriority: z.enum(['P1', 'P2', 'P3', 'P4']),
  }),
  response: z.object({
    cases: z.array(WorkflowCaseSchema),
  }),
  optimistic: { pattern: 'none' },           // server-driven; we wait
  onSuccess: {
    toast: (resp) => `Added ${resp.cases.length} claims to workflow`,
  },
  onError: { toast: { kind: 'error-message' } },
});
```

### 13.4 Surface — open EOB preview

```ts
defineAction({
  actionId: 'ar.preview-eob',
  kind: 'surface',
  surfaceKind: 'drawer',
  componentId: 'eob.preview-widget',
  permission: 'eob.read',
  description: 'Open EOB preview drawer for a claim row.',
  request: z.object({
    rowId: z.string(),
    claimNumber: z.string(),
  }),
  propsFromArgs: (args) => ({
    rowId: args.rowId,
    claimNumber: args.claimNumber,
  }),
});
```

### 13.5 Navigate — open detail page

```ts
defineAction({
  actionId: 'ar.open-detail',
  kind: 'navigate',
  permission: 'ar.read',
  description: 'Navigate to the AR row detail page.',
  request: z.object({
    rowId: z.string(),
  }),
  to: (args) => `/ar/${args.rowId}`,
});
```

---

## 14. What the action system does NOT do

Constraints worth stating explicitly so the boundary stays clean:

- **No business logic.** An action does not transform data beyond the schema mappers. If the response needs to be merged with another response, that's a hook, not an action.
- **No conditional dispatch.** An action does not branch on response shape to fire another action. A widget that needs a follow-up call writes that as a chained `await`.
- **No retries beyond auth.** The auth-aware baseQuery already handles 401 refresh-and-retry once. Other failures surface to the caller. Polling and back-off live in the polling slice, not in actions.
- **No pagination state.** Pagination cursors and page indexes are passed by the caller. The dispatcher does not maintain "the next page" state. This keeps the dispatcher stateless and makes pagination predictable.
- **No real-time / push.** Subscriptions, websockets, and SSE are a separate concern that lives in the polling/streaming slice. Actions are request-response only.
- **No file uploads.** File uploads need progress, cancel, and chunking. They get a separate `useFileUpload` hook in a future batch.

---

## 15. Optional declaration fields

Three fields beyond the core kind-specific ones are available on every action declaration where they make sense. None are required; defaults are documented.

### 15.1 `cacheKey` — explicit cache-key override (queries only)

By default, the dispatcher derives a cache key from the action id and a deterministic JSON-stringification of the request (with sorted keys at every nesting level — see §16 *Cache key derivation*). Two requests that are semantically identical hit the same cache slot regardless of property order.

For domain-specific equivalence relations — for example, ignoring a `_localOnly: true` flag, or treating `ownerIds: []` as equivalent to `ownerIds: undefined` — a query may declare an explicit cache-key function:

```ts
defineAction({
  actionId: 'ar.list',
  kind: 'query',
  // ...
  cacheKey: (request) => {
    const { _localOnly, ...rest } = request;
    return `ar.list::${deterministicStringify(rest)}`;
  },
});
```

Whatever string the function returns becomes the cache key verbatim. The action id is **not** automatically prepended in this mode — the function must include it (or some equivalent disambiguator) to avoid collisions across actions.

### 15.2 `timeoutMs` — per-action timeout override

The dispatcher's default timeout is **30 seconds**. For actions known to be long-running — bulk mutations, large exports, expensive analytical queries — declare a per-action override:

```ts
defineAction({
  actionId: 'claims.add-to-workflow',
  kind: 'mutation',
  // ...
  timeoutMs: 120_000,  // 2 minutes
});
```

When the timeout elapses, the dispatcher aborts the in-flight request via `AbortController`, returns an `ActionResult` with code `PLATFORM_TIMEOUT`, and rolls back any optimistic update.

For requests genuinely longer than ~2 minutes, the right answer is the **polling-job pattern** (the mutation returns a `jobId`, the client polls a status endpoint until done). That pattern is deferred to a future RFC and not implemented in this iteration.

### 15.3 `dryRun` — opt-out from side effects

The dispatcher accepts a per-call `dryRun: true` flag that runs the full pipeline — validation, permission check, request building — without firing the network call, dispatching surface/navigate side effects, or applying optimistic updates:

```ts
const result = await dispatchAction('ar.update-owner', { rowId: 'r1', ownerId: 'u9' }, { dryRun: true });
// result.ok = true; result.data = { dryRun: true, wouldDispatch: { method: 'PATCH', url: '...', body: { ownerId: 'u9' } } }
```

`dryRun` is a dispatcher option, not a declaration field — every action supports it. It returns the resolved request shape (URL, body, headers) so AI generators and tests can verify the wire-level call without producing observable effects.

In `dryRun` mode:
- Validation, permission checks, and path-param resolution still run; failures surface normally.
- No `fetch` is made.
- No surface is opened, no navigation occurs.
- No optimistic patch is applied to the cache.
- No toast is fired.

### 15.4 Future work (deferred)

These were considered and explicitly deferred:

- **Permission wildcards** (`ar.*` granting any action in the `ar` namespace). Defer until we have a concrete admin use case. The registry data model can support this without a breaking change.
- **Polling-job pattern** for mutations that exceed reasonable HTTP-response timeouts. Future RFC.
- **OpenAPI emission** — walk the registry, emit `openapi.yaml`. Belongs in Phase 8 code-generation tooling; the schemas are ready.

---

## 16. Cache key derivation

The default cache-key strategy is `<actionId>::<deterministicStringify(request)>` where `deterministicStringify`:

- Sorts object keys lexicographically at every nesting level
- Skips `undefined` fields (so `{a: 1, b: undefined}` collapses to `{a: 1}`)
- Preserves array order (arrays are positional, not sets)
- Emits stable JSON (numbers, strings, booleans, null) for primitives

Two semantically identical requests therefore produce the same cache key regardless of how the calling code constructed the object. This is the right default for the vast majority of actions.

Override per action via `cacheKey` (see §15.1) when domain semantics dictate a non-default equivalence.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| Action | A typed declaration in the registry. Has an id, a kind, a permission, and kind-specific fields. |
| Action id | The stable string identifier (`<domain>.<verb>`) used to dispatch. |
| Action kind | One of `query`, `mutation`, `surface`, `navigate`. |
| Action registry | The set of all defined actions in an app. Loaded at app boot. |
| Action result | `{ ok: true, data } \| { ok: false, error }` — what the dispatcher returns. |
| Cache tag | Logical group name shared by queries that should invalidate together. |
| Cache key | Per-invocation cache slot. Derived from action id + request shape. Override via `cacheKey`. |
| Dry run | Per-call dispatcher flag that runs validation + request building but skips side effects. |
| Optimistic pattern | One of the small fixed-set of cache-mutation patterns mutations may declare. |
| Surface kind | `modal`, `drawer`, `popup` — the visual mode of a surface action. |
| Timeout | Per-request deadline in ms. Default 30,000. Override via action's `timeoutMs`. |
| Wire envelope | The `ApiResponse<T>` shape every backend response uses. |

---

*End of spec. Round 1 is complete when the platform team and a representative backend engineer have read this and agreed to the contract. Code in this package implements this spec and nothing else.*
