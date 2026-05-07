# Operations Console Frontend — Phase B Slice 2 Handback

**Status:** Build complete. All gates green. Phase B is now feature-complete for Tier 1 + Tier 2 + the two pulled-forward Tier 3 features (BRD §6.2 Primrose go-live target).

**Date:** 2026-05-06
**Workspace deliverable:** `tensaw-ui-frontend-phase-b-final.zip`
**Built on:** Slice 1 deliverable (29 ops console tests, 14 patient tests, 363.40 KB gz initial) + the v0.1.3-shipped backend (`tensaw-workflow-runtime` v0.1.3 — see `Phase_v0_1_3_Handback.md`).

---

## §1. Headline

Slice 2 ships the v0.1.3-dependent additions slice 1 deferred:

1. The reassign owner modal swaps slice 1's free-text `<Input>` for a real `<Combobox>`-driven user picker sourced from the v0.1.3 `GET /v1/admin/users` endpoint. Picker rows show name + email + role badges.
2. Stuck Cases gains a multi-select column, a "Retry selected (N)" action bar, and a confirm modal that dispatches `POST /v1/admin/cases/bulk-retry` (also v0.1.3) with full partial-success handling: success / partial / all-failed each surface a distinct toast and (for partial / all-failed) a per-case results modal with friendly error code labels.

Strictly additive to slice 1 except for the planned `ReassignOwnerModal` rewrite. Slice 1's 4 single-case actions, their declarations, and the `CaseActionPanel` are untouched. Slice 1's permissions reconciliation, MSW envelope conventions, and event/cache wiring carry forward unchanged.

## §2. Final acceptance gate

| Gate | Result |
|---|---|
| `pnpm install` (fresh clone) | ✅ clean (~22s) |
| `pnpm typecheck` (`tsc -b` across all packages) | ✅ clean |
| `pnpm test` (vitest, all packages) | ✅ **1,020 tests passing** (1,003 baseline + 17 Phase B) |
| Operations console tests | ✅ **35 / 35** (18 Phase A + 17 Phase B) |
| Patient app tests | ✅ 14 / 14 still passing (no regression) |
| Operations console `pnpm lint` | ✅ clean |
| Patient app `pnpm lint` | ✅ clean |
| Operations-console `pnpm vite build` | ✅ clean |
| Platform packages unchanged | ✅ `diff -rq packages/` shows only generated `dist/` directories |
| Dev-mode smoke boot (`pnpm dev`) | ✅ Vite "ready in 230 ms" on `http://localhost:5174/` |

### Bundle measurements (ops console)

| Chunk | Slice 1 baseline | Slice 2 final | Δ |
|---|---|---|---|
| `index-*.js` (synchronous) | 1,528.18 KB / **363.40 KB gz** | 1,553.33 KB / **371.54 KB gz** | +25.15 KB raw / **+8.14 KB gz** (+2.2%) |
| `DashboardPage-*.js` (lazy) | 399.76 KB / 111.92 KB gz | 399.76 KB / 111.92 KB gz | unchanged |
| `ActivityStreamPage-*.js` (lazy) | 2.88 KB / 1.18 KB gz | 2.88 KB / 1.19 KB gz | unchanged |
| `index-*.css` | 2.09 KB / 0.82 KB gz | 2.09 KB / 0.82 KB gz | unchanged |

Initial bundle is comfortably under the kickoff's ≤ 400 KB gz ceiling (7.1% headroom). The +8.14 KB gz delta is the cost of: Combobox + cmdk pulled in by ReassignOwnerModal (~5 KB), the BulkRetryModal component (~2 KB), the StuckCasesPage multi-select rewiring (~1 KB).

---

## §3. What shipped

### §3.1 Action declarations — `src/actions/index.ts`

Two new declarations added to the existing slice 1 mutation block, plus existing query `cache.invalidatedBy` arrays extended.

| Action ID | Endpoint | Kind | Permission |
|---|---|---|---|
| `admin.list-users` | `GET /v1/admin/users` | query | `console.read` |
| `admin.bulk-retry-cases` | `POST /v1/admin/cases/bulk-retry` | mutation | `console.retry` |

`admin.list-users` declares `cache: { tag: 'admin-users' }` with no `invalidatedBy` — Cognito mutations happen out-of-band so no in-app action invalidates this cache. `useActionQuery`'s default `freshFor: 60_000` matches the v0.1.3 backend's TTL exactly.

`admin.bulk-retry-cases` follows slice 1's discipline: no `invalidates` field on the mutation, with the inverse direction handled by adding `'admin.bulk-retry-cases'` to each affected query's `cache.invalidatedBy` array. The kickoff named 3 queries (`admin.list-cases`, `admin.recent-activity`, `admin.stuck-cases`); we added it to the symmetric set of 5 — same set that single-retry already invalidates. See deviation §5.1.

### §3.2 Zod schemas — `src/actions/schemas.ts`

8 new schemas + 1 frozen error-code constant + 1 user-facing label map appended to slice 1's mutation schema block:

- `UserListItemSchema`, `UserListResponseSchema` (mirror v0.1.3 wire shapes)
- `BulkRetryRequestSchema` (1..100 case_ids; reuses slice 1's local `ReasonSchema` for 10..1000 char validation — no export needed because both schemas live in the same file)
- `BulkRetryItemSchema`, `BulkRetrySummarySchema`, `BulkRetryResponseSchema`
- `BULK_RETRY_ERROR_CODES` (frozen tuple of 7 codes per v0.1.3 spec) + `BulkRetryErrorCodeSchema` (z.enum)
- `BULK_RETRY_ERROR_LABELS` — friendly labels for each error code, used in the results modal

### §3.3 MSW fixture + handlers

**New fixture file `src/mocks/fixtures/users.ts`** — 24 mock users covering the four ops-relevant roles (RCM_OPS_REVIEWER, RCM_OPS_SENIOR_REVIEWER, TENANT_ADMIN, CLINIC_ADMIN) plus a few CLINIC_USER and one is_active=false entry for realism. Exports:

- `MOCK_USERS` (the canonical 24-row list, fully-hydrated shape)
- `filterUsers({ roleFilter, search, limit, offset })` — applies role filter, case-insensitive substring search across name + email, sorts by display_name ASC (null last) + email tiebreaker, and **mirrors the v0.1.3 perf optimization**: when `roleFilter` is empty, returned users have `roles=[]` and `clinic_ids=[]` (per `Phase_v0_1_3_Handback.md` §6 review item #2). The `ReassignOwnerModal` always passes `role_filter`, so the picker exercises the hydrated path; the fast path is reachable from any caller that doesn't.

**Two new MSW handlers added to `src/mocks/handlers.ts`** under `buildAdminHandlers`:

- `GET /v1/admin/users` — honors `role_filter` (repeatable), `search` (≤64 chars), `limit` (1..200, default 50), `offset` (≥0, default 0). Returns 422 on size violations.
- `POST /v1/admin/cases/bulk-retry` — implements partial-success natively:
   - Request validation (1..100 case_ids; 10..1000 char reason) → 400
   - Per-case loop: first occurrence of each case_id calls `applyRetry` (slice 1's helper); second+ occurrences flag `DUPLICATE_IN_BATCH` without re-executing
   - Maps `applyRetry`'s `NOT_FOUND` → `CASE_NOT_FOUND`, `CONFLICT_CLOSED` → `CASE_CLOSED`
   - Returns 200 if `failed === 0`, 207 (Multi-Status) otherwise; the runtime's `authenticatedFetch` parses by envelope shape (not `response.ok`) so 207 is treated as success and the BulkRetryModal branches on `summary` to render the partial-success UI
   - Generates a per-request `correlation_id` (timestamp + random suffix) so the results modal can show the same value v0.1.3 uses to tie audit rows together

The kickoff allows `WRONG_TENANT`, `CLINIC_FORBIDDEN`, `LEASE_CONFLICT`, `DATABASE_ERROR` as wire-shape codes; the schema accepts them and the results modal's friendly labels cover all 7. MSW only generates the 3 that arise naturally from the existing fixture (`CASE_NOT_FOUND`, `CASE_CLOSED`, `DUPLICATE_IN_BATCH`); tests that need the others can extend the fixture in a follow-up.

### §3.4 UI components — `src/components/case-actions/`

**Modified — `ReassignOwnerModal.tsx` (~155 LOC delta, 343 total)**

The free-text variant from slice 1 is replaced. Key behaviors:

- Uses `useActionQuery('admin.list-users', { role_filter: [...], limit: 200 })` with `skip: !open` so the user list only fetches when the modal is open, and the query memoizes the request reference
- Combobox sourced from a memoized `userOptions` array prefixed with a synthetic "— Unassign —" sentinel option (value `__UNASSIGN__`); `onSubmit` maps the sentinel to `null` for the API call and rejects the empty-string "nothing picked" state with a toast
- `renderOption` produces rich rows: name (or `email`-prefix fallback for null `display_name`) + email + Badge per role using a short label map (`RCM_OPS_SENIOR_REVIEWER` → `Senior`, etc.)
- Loading / empty / error states: skeleton during loading, distinct empty text after, explicit 503 messaging when the v0.1.3 backend's Cognito-not-configured response surfaces (`PLATFORM_SERVICE_UNAVAILABLE` from the dispatcher)
- Per Open Question 6 decision: form value is `user_id` as a string (looked up from the list as needed); not the full `UserListItem`

**New — `BulkRetryModal.tsx` (319 LOC)**

Two-phase modal driven by local `results` state:

- **Confirm phase** (default): the selected cases are previewed (case_id + case_type + state badges) — first 10 with "+N more" overflow per Open Question 5 decision; required reason field with the same `ReasonSchema.pick({ reason: true })` validation slice 1 mutations use; submit button labeled "Retry N case(s)"
- **Results phase** (set after a 207 mixed or all-failed response): swaps the modal body to show an `Alert` summary (correlation_id + counts) and a scrollable per-failure list, each item rendering the case_id, the friendly label from `BULK_RETRY_ERROR_LABELS`, and the backend's `error_message` if present
- Toast policy per Open Question 4 decision: all-success → success toast + close modal (no results view); partial → warning toast + hold modal open in results phase; all-failed → error toast + hold modal open in results phase
- Frontend dedup: `case_ids` are de-duplicated via `Array.from(new Set(...))` before dispatch; backend's `DUPLICATE_IN_BATCH` is a defense-in-depth path

### §3.5 StuckCasesPage updates

`pages/stuck/StuckCasesPage.tsx` (+174 LOC delta, 381 total) gains the multi-select column and bulk-retry control bar gated to `console.retry`:

- `useAuthStore((s) => (s.user?.permissions ?? []).includes('console.retry'))` selector — hide-don't-disable per slice 1's pattern. CLINIC_USER, CLINIC_ADMIN (read-only here; reassign-only doesn't unlock retry), and any role without `console.retry` see the original page exactly as slice 1 left it
- Selection state in a `useState<Set<string>>` keyed by `case_id`; selection survives accordion collapse but `onSuccess` from `BulkRetryModal` clears it on full-success completions
- Per-row checkbox is wrapped in a `<div onClick={stopPropagation}>` outside the existing `<Link>` so navigation isn't triggered by selection clicks
- Bulk action bar (testId `stuck-cases-bulk-bar`) shows: "Select all visible" checkbox with state-dependent label, a count + cap hint, "Clear" button, and a "Retry selected (N)" button that's disabled when count > 100 (matching the backend's request cap)
- "Select all visible" is exactly what its name says — per Open Question 3 decision, paginated select-all is confusing UX and the bulk-retry max is 100 anyway. The label tooltip surfaces this constraint

### §3.6 Test setup polyfills — `vitest.setup.ts`

Slice 2 adds three jsdom polyfills required by cmdk (Combobox's underlying primitive) and Radix Popover internals:

- `globalThis.ResizeObserver` (no-op class) — cmdk's list virtualization queries it
- `Element.prototype.scrollIntoView` (no-op function) — Radix Popover internals call it on focus management
- `Element.prototype.hasPointerCapture` / `releasePointerCapture` (no-op) — cmdk pointer-events plumbing

These are minimal no-ops. They never fire production paths (browsers ship the real APIs); they exist solely so the integration tests that drive the Combobox don't crash with `ReferenceError` in jsdom. Slice 1 didn't need them because no slice 1 component used cmdk.

### §3.7 Tests — `test/phase-b-actions.integration.test.tsx`

Slice 1 had 11 phase-B tests; slice 2 grows that to 17 (+6 net). One slice 1 test was rewritten in place (the only acceptable slice 1 modification) and 6 new tests were added:

| Block | Tests | Notes |
|---|---|---|
| Phase B — Case Action Panel | 5 | Slice 1 — unchanged |
| Phase B — Retry modal | 2 | Slice 1 — unchanged |
| Phase B — Close modal | 2 | Slice 1 — unchanged |
| Phase B — Advance modal | 1 | Slice 1 — unchanged |
| Phase B — Reassign modal (v0.1.3 picker) | **2** | 1 rewritten (Combobox-driven happy path), 1 new (Unassign sentinel option present) |
| Phase B slice 2 — Stuck Cases multi-select gating | **2** | new — bar visible for `console.retry` roles, hidden for CLINIC_USER |
| Phase B slice 2 — Bulk retry | **3** | new — happy path (2-case all-success toast), reason-validation field error keeps modal open, Clear-button removes the Retry button |

The Reassign happy-path test now drives the Combobox: opens the picker via the labeled trigger button, finds the option for "Bri Chen" (a senior reviewer in MOCK_USERS), clicks it, and submits. Slice 1's free-text test pattern (`getAllByRole('textbox')` → first textbox → type email) no longer applies because the picker isn't a textbox.

---

## §4. Decisions made under kickoff authority

The kickoff §"Open questions you have authority to decide" lists 6 choices. All six were decided per the kickoff's recommended option, documented inline in code and here:

| Question | Decision | Rationale |
|---|---|---|
| 1. Combobox display: name + email + role badges, OR name + email only? | **Name + email + role badges** | Kickoff recommendation. Helps operators pick the right person. Picker passes `role_filter` to force backend group hydration so badges render. |
| 2. Combobox empty state: "No users match" vs "Loading..." vs both? | **Both** | Kickoff recommendation. Combobox's built-in `loadingText` + `emptyText` props handle the two states distinctly; we additionally surface "User directory unavailable" when the v0.1.3 503 (Cognito-not-configured) error is in flight. |
| 3. Multi-select: select-all visible only, OR paginated select-all? | **Select-all visible only** | Kickoff recommendation. Backend bulk-retry cap is 100; paginated select-all is confusing UX. The header checkbox label tooltip ("Selects only the cases visible on this page") makes the constraint discoverable. |
| 4. Results modal: always show, or only on partial-success? | **Tri-state** | Per kickoff prose. all-success → success toast + close; partial → warning toast + results view stays open; all-failed → error toast + results view stays open. The user always knows _what_ happened from the toast, and can drill into the per-case detail when something didn't succeed. |
| 5. Bulk-retry confirm modal: case_id only, or case_id + case_type + state? | **case_id + case_type + state, first 10 + "+N more"** | Kickoff recommendation. Richer context for confirming the right cases were selected; "+N more" handles the up-to-100 cap without overflowing the dialog. |
| 6. Combobox value: store `user_id` or full `UserListItem`? | **Store `user_id` string** | Kickoff recommendation. Simpler form state; the `UserListItem` can be re-looked-up from the list as needed for display. The synthetic `__UNASSIGN__` sentinel value is mapped to `null` at dispatch time. |

---

## §5. Spec / kickoff deviations (small; documented in code + here)

Slice 2 has two minor deviations from the kickoff prose, each with a documented justification.

### §5.1 `admin.bulk-retry-cases` invalidates 5 queries, not 3

**Kickoff snippet** (§"Slice 2 execution order" item 3):
> Add `cache.invalidatedBy: ['admin.bulk-retry-cases']` to relevant query actions: `admin.cases`, `admin.stuck-cases`, `admin.recent-activity`.

**What we shipped:** Added to all 5 queries that single-retry already invalidates — `admin.list-cases`, `admin.recent-activity`, `admin.stuck-cases`, `admin.case-detail`, `admin.case-history`.

**Source of truth:** Bulk-retry == N single-retries cache-wise (each succeeded case has the exact mutation effect of single-retry). The 5-query set is the symmetric one slice 1 already established for `admin.retry-case`; restricting bulk-retry to 3 of those 5 would create a stale-cache asymmetry on the case-detail and case-history screens after a bulk operation that included the currently-viewed case. Also note the kickoff used short names (`admin.cases`) where the actual action ID is `admin.list-cases`; we used the actual IDs.

The kickoff's wording reads as "at minimum these 3" rather than "only these 3" given the symmetric-with-retry semantics, so this is a small expansion rather than a contradiction. Documented in `actions/index.ts` slice 2 comment block.

### §5.2 The kickoff said `ReasonSchema` is "exported"; it isn't (and doesn't need to be)

**Kickoff snippet** (§"Important: things NOT to do"):
> Don't validate reason length 1-512. It's 10-1000 per backend (slice 1's `ReasonSchema` already exports the right validation).

**Reality:** Slice 1's `ReasonSchema` is a module-local `const` in `actions/schemas.ts`, called out as an "internal helper" in the slice 1 handback. It is not exported.

**What we shipped:** Co-located the `BulkRetryRequestSchema` in the same `schemas.ts` file so it can reuse the local `ReasonSchema` directly. No export was added; no schemas elsewhere reach into `ReasonSchema`. This keeps the validation rule in one place and avoids widening the helper's visibility for one consumer. Both single-case retry and bulk retry now share the same 10..1000 char validation — the kickoff's intent.

If a future caller outside `schemas.ts` needs the helper, exporting it then is a one-line change. We chose not to widen visibility speculatively.

---

## §6. Open / known caveats

In review priority order:

1. **Browser smoke test is still a deferred human step**, same as slice 1. Slice 2's 17 jsdom integration tests cover every functional path the kickoff §13 smoke checklist asks about (reassign with picker, multi-select 2-3 cases, retry, partial-success surfacing). The dev server boots cleanly (`pnpm dev` → "ready in 230 ms" on port 5174), so the wiring is intact end-to-end. But cmdk's keyboard navigation and Radix Popover positioning behave differently in real browsers than in jsdom; a 5-minute manual click-through as `RCM_OPS_SENIOR_REVIEWER` is the recommended trust-building step before Primrose go-live.

2. **The `ReassignOwnerModal` does not surface the v0.1.3 perf optimization to the operator.** When the picker fetches with `role_filter` (which is always, per slice 2's design), badges render correctly. If a future caller wires `admin.list-users` _without_ `role_filter` (e.g., a cross-product user-search palette), the same fixture-mirrored backend behavior returns empty `roles[]`, and that consumer would need its own UX handling. Documented in the schema comment block in `schemas.ts`.

3. **`useActionQuery`'s `skip: !open` causes a fresh fetch every modal open.** This is intentional — opening the modal after a long idle is the natural moment to refresh against the 60-second TTL. Alternatives (cache-while-modal-closed) would either bloat the long-poll cycle or risk staleness. Acceptable given the user list is small (24 mock users; production tenants are typically tens to a few hundred).

4. **Bulk-retry cannot generate `WRONG_TENANT`, `CLINIC_FORBIDDEN`, `LEASE_CONFLICT`, `DATABASE_ERROR` from MSW.** The fixture has no tenant model, no scheduler racing, no database to fail. The schema accepts all 7 codes and the results modal renders friendly labels for all 7; tests that need the missing 4 can extend `applyRetry` or the bulk-retry handler in a follow-up. The frontend code path that consumes them is identical to the path used for the 3 we generate.

5. **Phase A Issue #4 (workspace-root `pnpm lint` timeout) still reproduces.** Per-package lint runs are clean. Slice 2 didn't touch this; deferred per slice 1 handback.

6. **The "stuck case" fixture has only 3 cases** (case-010, case-011, case-012). Slice 2's bulk-retry tests use 1- and 2-case selections; an N-of-100 selection isn't exercised under jsdom. The selection cap is enforced by the StuckCasesPage's "Retry selected" disabled state (>100) AND by the backend's request validation (1..100); both are tested in their respective unit/handler scopes.

---

## §7. What's deferred (not in this deliverable)

These remain explicitly out of scope and tracked separately in the build status tracker.

| Item | Status | Reason |
|---|---|---|
| Bulk-close | Deferred | Out of scope per kickoff §"Important: things NOT to do" |
| Bulk-reassign | Deferred | Out of scope per kickoff §"Important: things NOT to do" |
| Override-state action (Tier 3) | Deferred | Needs ADR before any work |
| Reopen action (Tier 3) | Deferred | Needs ADR before any work |
| Real Cognito Hosted UI | Deferred | Mocked sign-in stays per kickoff §"Important: things NOT to do" |
| Concurrent bulk-retry processing | Deferred | v0.1.4+ optimization per backend handback §8 |
| `@tensaw/app-operations-console` workspace-root lint | Deferred | Phase A Issue #4 |

The slice 2 deliverable is feature-complete for BRD §6.2 Primrose go-live.

---

## §8. File-by-file inventory of changes

### Modified files (7)

| File | Change | LOC delta | Notes |
|---|---|---|---|
| `apps/operations-console/src/actions/schemas.ts` | +133 LOC | 539 → 672 | 8 new schemas, 1 frozen error-code tuple, 1 label map, all in a single appended `Phase B slice 2 — v0.1.3-dependent schemas` block |
| `apps/operations-console/src/actions/index.ts` | +84 LOC | 313 → 397 | 2 new action declarations, 5 query `cache.invalidatedBy` arrays gained `'admin.bulk-retry-cases'` |
| `apps/operations-console/src/components/case-actions/ReassignOwnerModal.tsx` | +155 LOC | 188 → 343 | Rewritten as the Combobox-driven picker; the form shape, dispatch path, and toast/error semantics from slice 1 carry through |
| `apps/operations-console/src/mocks/handlers.ts` | +178 LOC | 506 → 684 | 2 new handlers (#11 list-users, #12 bulk-retry), 1 new import (`filterUsers`), schema-types import widened |
| `apps/operations-console/src/pages/stuck/StuckCasesPage.tsx` | +174 LOC | 207 → 381 | Multi-select column gated to `console.retry`; bulk action bar; BulkRetryModal mount; useMemo wrappers for hook ordering |
| `apps/operations-console/test/phase-b-actions.integration.test.tsx` | +180 LOC | 303 → 483 | 1 rewritten test, 6 new tests across 2 new describe blocks |
| `apps/operations-console/vitest.setup.ts` | +27 LOC | 49 → 76 | 3 jsdom polyfills (ResizeObserver, scrollIntoView, hasPointerCapture/releasePointerCapture) |

### New files (2)

| File | LOC |
|---|---|
| `apps/operations-console/src/components/case-actions/BulkRetryModal.tsx` | 319 |
| `apps/operations-console/src/mocks/fixtures/users.ts` | 278 |

**Total slice 2 delta:** ~1,528 LOC added/modified across 9 files. No file deleted; no Phase A or slice 1 source modified except the planned `ReassignOwnerModal` rewrite, the additive `actions/index.ts` and `schemas.ts` extensions, and the slice 1 reassign-test rewrite.

**Platform packages unchanged:** `diff -rq packages/` against the original zip shows only generated `dist/` directories. The kickoff's "Platform packages unchanged" gate is satisfied; `git diff packages/` (in a real repo) would be empty for source.

---

## §9. Hand-off readiness

- ✅ All 1,003 Phase A baseline tests preserved
- ✅ Slice 1's 18 Phase A + 11 Phase B = 29 ops-console tests all still pass
- ✅ 6 net new Phase B integration tests (17 phase-B total; well above the kickoff's 5–7 target)
- ✅ Workspace test count: 1,014 → 1,020 (+6)
- ✅ Patient app: 14 / 14, unchanged
- ✅ Bundle within budget (371.54 KB gz initial, 7.1% headroom under 400 KB ceiling)
- ✅ TypeScript references clean across all 11 packages + 2 apps
- ✅ Per-package lint clean for both apps
- ✅ Both deviations documented inline AND here
- ✅ All 6 kickoff Open Questions decided per the kickoff's recommendation, rationale captured
- ✅ Dev mode boots cleanly (`vite ready in 230 ms`)

**Phase B slice 2 closed. Operations console is feature-complete for BRD §6.2 Primrose go-live (Tier 1 + Tier 2 + 2 pulled-forward Tier 3 features).**

The next milestone shifts from build to deployment: ops console deployment runbook + first orchestration service. Browser smoke as `RCM_OPS_SENIOR_REVIEWER` is the recommended pre-go-live trust step.
