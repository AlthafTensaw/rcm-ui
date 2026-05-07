# ADR-001: Redux Toolkit → Zustand + TanStack Query

- **Status:** Accepted
- **Date:** 2026-05-03
- **Deciders:** Platform team
- **Supersedes:** None
- **Superseded by:** None

---

## Context

The Tensaw UI platform was originally built on Redux Toolkit (RTK) and RTK Query, with four custom middleware (`eventMiddleware`, `errorListenerMiddleware`, `preferenceMiddleware`, `idleTimeoutMiddleware`) sitting on top of 12 slices. The action contract package (`@tensaw/actions`) layered a registry-driven dispatcher on top of RTK Query's cache.

After eight months of operation, three patterns emerged.

The first was that the slices were either pure data containers (auth, app, context, surfaces, dirtyState, notifications, polling, widgets, pageRuntime) or thin event sinks listening through `extraReducers`. None of them used the time-travel debugger, none subscribed to multiple slices in coordinated reducers, and none relied on the action-history audit trail. The Redux ceremony — `createSlice`, `createAction`, `createSelector`, `useAppSelector`, `useAppDispatch`, `RootState` typing — produced a noticeable per-feature tax without a corresponding capability gain.

The second was that RTK Query, while solid, duplicated work the action dispatcher already did. The dispatcher held its own cache, its own subscription map, its own freshness logic, and its own optimistic-update reconciliation. RTK Query sat underneath but was never the primary cache for the registry. Two cache layers in flight at once made invalidation hard to reason about and made the dispatcher harder to evolve (e.g. adding `dryRun` or `timeoutMs` fields required threading through both layers).

The third was that the four middleware were doing things middleware is bad at. `eventMiddleware` translated a single action type into a side-effect dispatch tree, which is fine in middleware. But `preferenceMiddleware` was effectively a debounced `useEffect` watching multiple slices; `idleTimeoutMiddleware` was a `setTimeout` reset on a single field; `errorListenerMiddleware` was a wrapper over RTK Query's own error events. All three were natural subscription targets with no need for the action-pipeline mental model.

The migration handoff (`Tensaw_UI_Redux_to_Zustand_Migration_Handoff.md`, 972 lines, 15 sections) authorized a rewrite to Zustand for app state and TanStack Query for server state, with a 7-session execution plan budgeted at 4–6 weeks.

## Decision

Replace the Redux stack with two libraries and a small set of subscription-based effects:

- **App state:** Zustand 4.5.x (12 independent stores, no root store)
- **Server state:** TanStack Query 5.59.x (singleton `QueryClient`)
- **Side effects:** Subscriptions and direct event handlers (replacing all four middleware)
- **Action contract:** Preserved as the public API of `@tensaw/actions`. Internals swapped to use `queryClient.fetchQuery` / `setQueryData` / `invalidateQueries` instead of the hand-rolled cache.

All four Redux middleware (`eventMiddleware`, `errorListenerMiddleware`, `preferenceMiddleware`, `idleTimeoutMiddleware`) were removed. Their replacements live in a new `@tensaw/runtime/effects` module: `preferenceAutosave`, `idleTimeout`, `contextEventBindings`, `notificationsEventBindings`. The error-listener role moved into TanStack Query's global `mutations.onError`.

`publishEvent` is no longer a Redux action creator. It is a regular function that synchronously validates against the catalog, records to the events ring buffer, and runs handlers. The `EventHandler` signature changed from `(event, api: MiddlewareAPI) => void` to `(event) => void`.

`bootstrapApp` is no longer a thunk. It is a direct async function whose internals call store setters and return a `BootstrapDisposers` object so tests and HMR can tear down effects.

## Rationale

The two libraries chosen each solve one problem cleanly. Zustand owns app state with one-line stores, no provider, no slice boilerplate, and direct read access via `useStore.getState()` — which the action dispatcher uses extensively. TanStack Query owns server state with a battle-tested cache, dedupe, retry, and invalidation API. Together they leave Redux without a job in this codebase.

Splitting the slices into 12 independent stores rather than building a Zustand "root store" was deliberate. A root store would replicate Redux's global-state shape and reintroduce the cross-slice coupling the migration was meant to undo. Independent stores make each domain's surface area visible at the import site (`useAuthStore.getState()` is unambiguously about auth) and make per-store reset trivial in tests.

The action contract was kept as the integration boundary. `dispatchAction(actionId, request, options)` is unchanged. Optimistic updates, permission checks, request validation, dry-run, timeouts, surface dispatch, navigate, and the four `kind`s all behave exactly as before. The only public-API change is that `setActionStore(store)` is now a no-op (the dispatcher no longer needs a Redux store) — call sites can be removed at the next cleanup pass.

## Deviations from §13 of the handoff

The handoff anticipated several judgment calls. The decisions made are:

**§13.1 — Polling.** The handoff offered three options: drop the dedicated polling registry, keep it as a thin Zustand store, or fold it into TanStack Query's `refetchInterval`. We initially kept it as a thin store but a follow-up review found zero consumers and removed it. TanStack Query's per-query `refetchInterval` handles all polling needs.

**§13.2 — Idle timeout mechanism.** The handoff offered "subscription on `lastActivityAt`" or "RxJS-style stream over auth state." We chose the subscription. Implementation is 60 lines, has no new dependency, and matches the pattern used by `preferenceAutosave`. The RxJS option would have added a 110KB dependency for a single use case.

**§13.5 — `@tensaw/runtime/middleware` export path.** The handoff allowed leaving the path as a deprecated re-export of empty values. We removed it entirely. The new module is `@tensaw/runtime/effects`. Consumers got compile errors at the import site, which surfaced every callsite in one CI run rather than letting deprecation rot accumulate.

**§13.6 — Per-test isolation.** The handoff allowed either per-store reset helpers or a single `resetAllStoresForTesting()` helper. We added both. Each store exports `_resetXStore()` for surgical use; the runtime barrel exports `resetAllStoresForTesting()` which calls all eleven in sequence. The single-call helper is what tests actually use; the per-store helpers exist for debugging.

**Reset semantics.** During implementation we discovered Zustand's `setState({...INITIAL}, true)` replaces the entire state object including methods. Reset functions therefore use `setState({...INITIAL})` (merge mode) so methods survive — only the data fields are reset. This is documented at the top of each `_resetXStore` function. Tests that previously called `resetAllStoresForTesting()` and then `useAuthStore.getState().signIn()` would have failed silently in the strict-replace variant.

**Cache compatibility shims.** The hooks in `@tensaw/actions/hooks` (`useActionQuery`, `useActionMutation`) historically called `subscribeToCacheKey`, `readCacheValue`, and `isCacheFresh` on the dispatcher. Rather than rewrite the hooks to use `useQuery` / `useMutation` directly during this migration, those three functions were reimplemented as thin wrappers around the `queryClient`. The hooks layer stayed unchanged. The shims are marked deprecated in code comments; a follow-up that rewrites the hooks against TanStack Query primitives can remove them and the dispatcher loses ~80 lines.

## Consequences

### What gets better

The codebase loses approximately 1,800 lines of slice and middleware boilerplate. The four middleware files become four effects files at roughly half the line count each. Consumer code shrinks at every call site: `useAppSelector(s => s.ui.panelsByPage[pageId]?.leftPanelWidth)` becomes `useUiStore(s => s.panelsByPage[pageId]?.leftPanelWidth)`, and `dispatch(setLeftPanelWidth({...}))` becomes `useUiStore.getState().setLeftPanelWidth({...})`.

Bundle size drops by approximately 30KB minified, gzipped: `@reduxjs/toolkit` (~21KB) and `react-redux` (~8KB) are replaced by `zustand` (~3KB) and the `@tanstack/react-query` runtime (which the patient app would have shipped anyway once it adopted RTK Query for non-action endpoints, but now is the only cache).

Per-feature ceremony drops. Adding a new piece of UI state goes from "create slice, define actions, define selectors, register reducer in root store, type the slice for `RootState`" to "add a field and a setter to the relevant store, or create a new store." A new store is a 30-line file.

Action declarations in `@tensaw/actions/registry` keep working untouched; the registry is unaware that its cache is now `queryClient` instead of a hand-rolled `Map`.

### What gets worse, and the workarounds

There is no Redux DevTools store-history view. Zustand has its own DevTools middleware (`zustand/middleware/devtools`) that renders each store as a pseudo-Redux store; it can be added per-store if a debugging pain point arises. Given the team has not used the time-travel feature in production debugging, this trade was made knowingly.

There is no global "what changed" log of the kind a Redux logger middleware produces. The events ring buffer in `useEventsStore` partially substitutes — every cataloged event is recorded — but UI store mutations (panel widths, container expansion, grid sort) are not. A `zustand/middleware/devtools` wrapper around `useUiStore` would close the gap if needed.

The action dispatcher's compatibility shims (`subscribeToCacheKey`, `readCacheValue`, `isCacheFresh`, `setActionStore` as a no-op) are technical debt. They are clearly marked and slated for removal in the cleanup pass that rewrites the hooks against `useQuery` / `useMutation`.

Per-test setup got slightly more verbose. Tests that previously did `<Provider store={makeStore()}>` and signed a user in via `dispatch(signedIn(...))` now do `resetAllStoresForTesting()` + `useAuthStore.getState().signIn(...)` + `<QueryClientProvider client={client}>`. This is two more lines per test, in exchange for not having to construct a fake Redux store with the right reducer set.

### Unresolved follow-ups

The hooks layer (`useActionQuery`, `useActionMutation`) should be rewritten against TanStack Query primitives. This removes ~80 lines from the dispatcher (the compat shims) and gives consumers automatic cache integration with TanStack Query DevTools.

`setActionStore` is a no-op call site at every bootstrap point. Track these via a codemod and remove them when convenient — there is no rush, but they are noise.

A future migration of the patient app to a real router (replacing `AppShell`'s tiny pub/sub) is unaffected by this decision. The router adapter pattern in the dispatcher (`setRouterAdapter({push})`) remains unchanged.

## Verification

The migration's definition-of-done was met:

- `grep -r "@reduxjs"` across `packages/` and `apps/` returns zero matches
- `grep -r "react-redux"` returns zero matches
- `grep -r "useAppSelector\|useAppDispatch"` returns zero matches
- `pnpm install` produces a lockfile with zero Redux entries
- `pnpm typecheck` passes across all 16 packages
- `pnpm test` passes: 415 tests across 8 packages
- `pnpm vite build` for the patient app succeeds (1.0MB / 280KB gzipped)
- The patient app's 4 integration tests (`smoke`, `owner-edit`, `mode-toggle`, `bulk-bar`) pass

## References

- Migration handoff: `Tensaw_UI_Redux_to_Zustand_Migration_Handoff.md`
- Action contract spec: `packages/actions/docs/ACTION_CONTRACT.md`
- Zustand docs: <https://zustand.docs.pmnd.rs/>
- TanStack Query docs: <https://tanstack.com/query/latest>
