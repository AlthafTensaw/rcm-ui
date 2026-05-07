# Operations Console Frontend — Phase B Handback (partial)

**Status:** Action panel + 4 single-case mutation modals shipped + verified. Tier 3 picker (step 9) and bulk-retry (steps 10–11) are explicitly NOT in this deliverable — they depend on `tensaw-workflow-runtime` v0.1.3 which is not yet shipped.

**Date:** 2026-05-06
**Workspace deliverable:** `tensaw-ui-frontend-phase-b.zip`
**Built on:** Phase A workspace + Platform Fix (1,003 tests, 360 KB gz initial bundle, the 6 Phase A query actions, the role→permissions map, MSW + envelope helpers)

---

## Executive summary

The four Tier 2 single-case mutation actions are end-to-end functional in the operations console. A user with the right permissions can navigate to a case detail page, click any of Force-advance / Retry / Reassign / Close, fill in the modal's reason field (and `close_reason_code` for Close), and dispatch the mutation against MSW (or the real v0.1.2 backend; the contracts match).

Phase A's pre-wired query-side `cache.invalidatedBy` arrays activate automatically as the mutations register, so Case Detail / Case List / Stuck Cases auto-refetch on success without any additional wiring in this phase.

**Final acceptance:**

| Gate | Result |
|---|---|
| `pnpm install` (fresh clone) | ✅ clean (~14s) |
| `pnpm typecheck` (`tsc -b` across all packages) | ✅ clean |
| `pnpm test` (vitest, all packages) | ✅ **1,014 tests passing** (1,003 baseline + 11 Phase B) |
| Operations console tests | ✅ 29/29 (18 Phase A + 11 Phase B) |
| Patient app tests | ✅ 14/14 still passing (no regression) |
| Operations console `pnpm lint` | ✅ clean |
| Patient app `pnpm lint` | ✅ clean |
| Operations-console `pnpm vite build` | ✅ clean |

**Bundle measurements (ops console):**

| Chunk | Phase A baseline | Phase B final | Δ |
|---|---|---|---|
| `index-*.js` (synchronous) | 1,514.35 KB / **360.17 KB gz** | 1,528.18 KB / **363.40 KB gz** | +13.83 KB raw / **+3.23 KB gz** (+0.9%) |
| `DashboardPage-*.js` (lazy) | 399.76 KB / 111.92 KB gz | 399.76 KB / 111.92 KB gz | unchanged |
| `ActivityStreamPage-*.js` (lazy) | 2.88 KB / 1.18 KB gz | 2.88 KB / 1.18 KB gz | unchanged |
| `index-*.css` | 2.09 KB / 0.82 KB gz | 2.09 KB / 0.82 KB gz | unchanged |

Initial bundle is comfortably under the kickoff's ≤ 400 KB gz ceiling. The +3.23 KB gz is the cost of 4 modal components + the action panel + ~245 lines of MSW state mutators.

---

## What shipped

### Action declarations (4 mutations) — `src/actions/index.ts`

| Action ID | Endpoint | Permission |
|---|---|---|
| `admin.retry-case` | `POST /v1/admin/cases/{case_id}/retry` | `console.retry` |
| `admin.close-case` | `POST /v1/admin/cases/{case_id}/close` | `console.close` |
| `admin.advance-case` | `POST /v1/cases/{case_id}/advance` | `console.advance` |
| `admin.reassign-owner` | `PATCH /v1/cases/{case_id}/owner` | `console.reassign` |

All four use the patient-app mutation pattern: `kind: 'mutation'`, `request`/`response` Zod schemas, `onSuccess: { toast: '...' }`, `onError: { toast: { kind: 'error-message' } }`. No `optimistic` (mutations show modal-bound spinners; modal stays open on error per kickoff §"Open questions" item 6 recommendation). No `invalidates` array — Phase A's query-side `cache.invalidatedBy` arrays already reference these IDs and activate automatically.

### Zod schemas — `src/actions/schemas.ts`

Added 8 new schemas + 2 supporting constants + 1 internal helper:

- `CLOSE_REASON_CODES` — `['MANUAL_CLOSE_OPS', 'DUPLICATE', 'INVALID_DATA', 'CUSTOMER_WITHDRAWN', 'OTHER']` (5 values, exact match to backend `admin_models.py::CLOSE_REASON_CODES` per spec §3.4)
- `CLOSE_REASON_LABELS` — short human-readable labels for the dropdown
- `CaseSnapshotSchema` — `.passthrough()` partial of case fields used in mutation `before`/`after` snapshots; lets the backend add fields without a frontend schema break
- `RetryCaseRequestSchema` / `RetryCaseResponseSchema`
- `CloseCaseRequestSchema` / `CloseCaseResponseSchema`
- `AdvanceCaseRequestSchema` / `AdvanceCaseResponseSchema`
- `ReassignOwnerRequestSchema` / `ReassignOwnerResponseSchema`
- Internal helpers `ReasonSchema` (10..1000 chars, required) and `OptionalReasonSchema` (10..1000 chars OR empty string — optional fields tolerate the form's `''` default and the modal normalizes to `undefined` before dispatch)

### Permissions reconciliation — `src/auth/permissions.ts`

Phase A had shipped `CLINIC_ADMIN: ['console.read']` as read-only. Phase B fixes this to `['console.read', 'console.reassign']` per BRD §3.8 and backend tech spec §4.2 `CONSOLE_REASSIGN_ROLES = CONSOLE_RETRY_ROLES | {'CLINIC_ADMIN'}`. Backend's `enforce_clinic_scope` helper still gates the actual mutation to cases in the user's `clinicIds`. See "Spec/kickoff deviations" below.

### MSW handlers — `src/mocks/handlers.ts` + `src/mocks/fixtures/cases.ts`

Four new handlers added under `buildAdminHandlers`:

- `POST /v1/admin/cases/:caseId/retry` — 200 / 404 (case not found) / 409 (already closed) / 422 (reason length)
- `POST /v1/admin/cases/:caseId/close` — 200 / 404 / 409 / 422 (reason length OR invalid `close_reason_code`)
- `POST /v1/cases/:caseId/advance` — 200 / 404 / 409 (closed OR terminal state) / 422
- `PATCH /v1/cases/:caseId/owner` — 200 / 404 / 409 (closed) / 422 (missing `new_owner_user_id`)

Backed by 4 state-mutator helpers in `cases.ts`:

- `applyRetry(caseId, reason, actor)` — clears `last_error_*`, sets `next_action_at = now`, preserves `attempt_count`, removes from `stuckRows`, appends a `CONSOLE_RETRY` row to `recentActivity` (forensic visibility, mirrors v0.1.2's LEFT-JOIN actor enrichment)
- `applyClose(caseId, closeReasonCode, reason, actor)` — sets `closed_at = now`, writes `close_reason_code` into `last_error_code` (per ADR-OC-3 column reuse), nulls `next_action_at`, **leaves `state_code` unchanged**, closes all open tasks
- `applyAdvance(caseId, reason | null, actor)` — walks `DEMO_STATE_ORDER` one step forward; rejects 409 if at terminal state
- `applyReassign(caseId, newOwnerUserId, reason | null, actor)` — updates `owner_user_id` (null = unassign); rejects 409 on closed cases

Each returns a discriminated `{ ok: true, before, after, audit_id, ... }` or `{ ok: false, code: 'NOT_FOUND' | 'CONFLICT_CLOSED' | 'CONFLICT_TERMINAL_STATE' }`.

### UI components — `src/components/case-actions/`

Five new files:

- **`CaseActionPanel.tsx`** — the panel: a Card with up to 4 buttons (Force-advance, Retry, Reassign, Close), permission-gated by `useAuthStore((s) => s.user.permissions)`. Hide-don't-disable per kickoff §"Open questions" item 1. Owns local `activeModal` state; closed cases show an explanatory note instead of buttons.
- **`RetryCaseModal.tsx`** — Dialog + Form + Textarea + Cancel/Retry footer
- **`CloseCaseModal.tsx`** — Dialog + Form + Select (5-value dropdown) + Textarea + Cancel/destructive-Close footer
- **`AdvanceCaseModal.tsx`** — Dialog + Form + Textarea (optional reason) + Cancel/Force-advance footer
- **`ReassignOwnerModal.tsx`** — Dialog + Form + Input (free-text owner email) + Textarea (optional reason) + Cancel/Reassign footer. Free-text is the v0.1.2-compatible variant; the v0.1.3 dropdown picker (kickoff step 9) replaces the Input with a `<Combobox>` sourced from `admin.list-users` once the backend ships.

### Case Detail integration — `src/pages/case-detail/CaseDetailPage.tsx`

A 5-line addition: `<CaseActionPanel caseId={c.case_id} currentOwner={c.owner_user_id} closedAt={c.closed_at} />` between the Summary card and the Tabs card. The panel handles its own gating and modal state; nothing else on the page changed.

### Tests — `test/phase-b-actions.integration.test.tsx`

11 new integration tests across 4 describe blocks:

- **Case Action Panel** (5 tests) — full-permission user shows all 4 buttons; CLINIC_USER shows nothing; RCM_OPS_REVIEWER hides Close (BRD §3.8); CLINIC_ADMIN shows only Reassign (BRD §3.8); closed case-009 renders the explanatory note instead of buttons
- **Retry modal** (2 tests) — happy path (modal opens, fills reason ≥10 chars, submits, closes, success toast in notifications store); reason <10 chars surfaces field error and modal stays open
- **Close modal** (2 tests) — happy path (default `MANUAL_CLOSE_OPS` preselected, fills reason, submits with destructive button, closes, success toast); reason <10 chars surfaces field error
- **Advance modal** (1 test) — happy path with no reason needed
- **Reassign modal** (1 test) — happy path with new owner email free-text input

All 11 verified to pass; the 18 Phase A ops-console tests and 14 patient-app tests are unchanged and still pass.

---

## Spec / kickoff deviations (documented in code + here)

Three deviations from the kickoff prose, each justified by a higher-priority source per the kickoff's own "trust the BRD §3.8" / "spec wins" guidance.

### 1. Close request shape — `close_reason_code` (5-value enum), not `terminal_state_code?`

**Kickoff snippet** (§"Action declarations to add"):
```
request: CloseCaseRequestSchema,    // Zod: { caseId: string, reason: string (10-1000 chars), terminal_state_code?: string }
```

**What we shipped:**
```ts
CloseCaseRequestSchema = z.object({
  case_id: z.string().min(1),
  close_reason_code: z.enum(CLOSE_REASON_CODES),  // required, 5 values
  reason: ReasonSchema,                            // 10..1000 chars
});
```

**Source of truth:** Backend tech spec §3.4 (`{"close_reason_code": "MANUAL_CLOSE_OPS", "reason": "..."}` literal example) plus the Phase B backend handback "Decisions made under kickoff authority" table:

> Close model — kickoff/handback's `terminal_state_code` vs spec §3.4 / ADR-OC-3 → **Spec wins.** Write `close_reason_code` into `last_error_code`, leave `state_code` unchanged.

The 5-value vocabulary was confirmed against backend tech spec §3.4: `MANUAL_CLOSE_OPS`, `DUPLICATE`, `INVALID_DATA`, `CUSTOMER_WITHDRAWN`, `OTHER`.

### 2. CLINIC_ADMIN gets `console.reassign`

**Phase A shipped:** `CLINIC_ADMIN: ['console.read']` (read-only).

**What we shipped:** `CLINIC_ADMIN: ['console.read', 'console.reassign']`.

**Source of truth:** BRD §3.8 (Reassign column row 4: `✅ own clinic(s)`) plus backend tech spec §4.2:
```python
CONSOLE_REASSIGN_ROLES = CONSOLE_RETRY_ROLES | frozenset({"CLINIC_ADMIN"})
"""Reassign also allows CLINIC_ADMIN within their clinic scope."""
```

The kickoff §"Permission gating audit" prose contradicted the BRD (claimed even SENIOR_REVIEWER could not reassign — BRD says they can; claimed CLINIC_ADMIN behavior was ambiguous — BRD is unambiguous). Per kickoff §"When you should stop and ask" item 5 ("BRD §3.8 should be definitive"), BRD wins.

Backend `enforce_clinic_scope` still gates the actual mutation to cases in the user's `clinicIds` array. The frontend hides the UI button for users without permission; backend rejects out-of-scope cases regardless.

### 3. Mutations don't declare `invalidates`

**Kickoff snippet** showed an `invalidates: ['admin-cases', ...]` array on each mutation.

**What we shipped:** No `invalidates` field on any of the 4 mutations.

**Source of truth:** Phase A handback already pre-wired query-side `cache.invalidatedBy: ['admin.retry-case', 'admin.close-case', 'admin.advance-case', 'admin.reassign-owner']` on every relevant query, with explicit comments saying "these resolve to no-ops in Phase A because the actions aren't registered yet". The actions registry types describe `invalidates` on the mutation as "alternative to declaring on the query side". The kickoff §"Mental model" itself says: "Action declarations are pre-wired in Phase A's `cache.invalidatedBy` arrays. … you're not designing the cache topology."

So adding `invalidates` on the mutation side would be redundant. Cache invalidation activates automatically when these mutations register.

---

## Decisions made under kickoff authority

The kickoff §"Open questions you have authority to decide" lists 6 choices. Decisions:

| Question | Decision | Rationale |
|---|---|---|
| 1. Action button visibility for unauthorized users | **Hide entirely** | Kickoff's own recommendation. Cleaner UX; the action dispatcher + backend each enforce permission independently regardless of UI. |
| 2. Confirm modal reason — persist draft or reset on close | **Reset on close** | Kickoff's recommendation. React-hook-form's `defaultValues` re-apply when the Dialog re-mounts via the `open` prop change. |
| 3. Bulk-retry maximum batch size | N/A | Not implemented in this phase (v0.1.3-dependent). |
| 4. Bulk-retry results display | N/A | Not implemented in this phase. |
| 5. User picker — show all roles or filter | N/A | Not implemented in this phase (v0.1.3-dependent). |
| 6. Mutation in-flight UI feedback | **Spinner on submit button; modal stays open until success/error** | Kickoff's recommendation. Optimistic UI on Tier 2 felt risky given close is one-way and reassign affects ownership; deterministic confirm-then-close is safer and easier to explain to ops staff. |

---

## What's deferred (not in this deliverable)

These are explicitly out of scope and tracked separately. None blocks declaring the action-panel + 4-modal slice complete.

| Item | Phase B kickoff step | Status |
|---|---|---|
| `admin.list-users` query action | step 8 | Deferred — backend `GET /v1/admin/users` is pending in v0.1.3 |
| Reassign with `<Combobox>` picker | step 9 | Deferred — depends on v0.1.3's list-users endpoint |
| `admin.bulk-retry-cases` mutation + UI | steps 10–11 | Deferred — backend `POST /v1/admin/cases/bulk-retry` is pending in v0.1.3 |
| Stuck Cases multi-select column + bulk-retry confirm modal | step 10 | Deferred — depends on bulk-retry endpoint |
| Override-state action (Tier 3) | NOT in Phase B | Deferred — needs ADR before any work |
| Reopen action (Tier 3) | NOT in Phase B | Deferred — needs ADR before any work |
| Real Cognito Hosted UI | NOT in Phase B | Deferred — design-system buildout deferred item #1; mocked sign-in stays |

The free-text reassign modal already in this deliverable is functionally complete against v0.1.2; swapping the `<Input>` for a `<Combobox>` once `admin.list-users` lands is a small additive change.

---

## Open / known caveats

- **Test assertions on toasts read the notifications store, not the DOM.** The test helper's `renderApp` mounts the route tree but not `<ToastHost>` (which production `main.tsx` does). The Phase B happy-path tests assert `useNotificationsStore.getState().toasts.some(...)` instead of `screen.getByText(...)`. Both are valid signals; the store assertion is more direct in tests. Considered updating the helper but kept the change minimal-surface — `helpers.tsx` is shared with Phase A's 18 tests.
- **MSW reason-length validation parallels backend.** MSW handlers re-implement the 10..1000 char check that the backend enforces. This is intentional duplication: it keeps tests deterministic about which paths return 422 vs. 200, and it catches frontend Zod-schema drift if someone changes the constraint on one side without the other.
- **Optional reason: empty string is valid in the schema, normalized to undefined at dispatch time.** The advance and reassign modals' Forms have a default `reason: ''` (react-hook-form requires defined defaults for controlled fields). The Zod `OptionalReasonSchema` accepts `''` OR strings of 10–1000 chars. The modal's submit handler trims and converts empty strings to `undefined` before building the dispatch payload.
- **Phase A Issue #4 (workspace-root `pnpm lint` timeout) reproduces.** Per-package lint runs are clean for everything Phase B touched (`@tensaw/app-operations-console`, `@tensaw/app-patient`). Workspace-root `pnpm lint` reproducibly fails with `ELIFECYCLE` on long sessions — environmental, documented, Phase A handback Issue #4, still deferred.

---

## Resumption guide

To continue Phase B from here:

1. **Smoke test in dev mode** (kickoff step 16). Spin up `pnpm dev` for `@tensaw/app-operations-console`, sign in as RCM_OPS_SENIOR_REVIEWER, navigate to `/cases/case-001`, exercise all 4 actions. Verify TanStack Query auto-refetches case detail / case list after each mutation. The integration tests cover this under jsdom but a browser smoke is the trust-building step.

2. **Wait for backend v0.1.3** (`GET /v1/admin/users` and `POST /v1/admin/cases/bulk-retry`). When that ships:
   - Add `admin.list-users` query to `src/actions/index.ts` (kickoff step 8). MSW already needs an `admin.list-users` handler returning 20–30 fake users with `{id, email, name, roles, clinic_ids}` shape.
   - Replace `ReassignOwnerModal`'s `<Input>` with `<Combobox options={users.map(...)} >`. Most of the modal scaffolding survives (kickoff step 9).
   - Add `admin.bulk-retry-cases` mutation (kickoff step 10). New surface: a checkbox column on the Stuck Cases page or Case List page (recommend Stuck Cases per kickoff), plus a confirm modal with `caseIds: string[]` and `reason`. Partial-success handling per kickoff step 11.

3. **At Phase B end — full smoke + handback update.** Update this handback with the v0.1.3-dependent additions and re-package the workspace as `tensaw-ui-frontend-phase-b-final.zip`.

The 11 integration tests added here cover the 4 single-case action paths thoroughly. The next phase's tests slot into the same `phase-b-actions.integration.test.tsx` file (no new test file needed) and bring the total toward the kickoff's ~12-15 ops-console-tests target.

---

## File-by-file inventory of changes

| File | Change | LOC delta |
|---|---|---|
| `apps/operations-console/src/auth/permissions.ts` | CLINIC_ADMIN gets `console.reassign`; doc comments updated | +14 / -8 |
| `apps/operations-console/src/actions/schemas.ts` | +172 LOC: `CLOSE_REASON_CODES`, `CLOSE_REASON_LABELS`, `CaseSnapshotSchema`, `ReasonSchema`, `OptionalReasonSchema`, 4 request + 4 response schemas | +172 |
| `apps/operations-console/src/actions/index.ts` | 4 mutation registrations + import block | +84 |
| `apps/operations-console/src/mocks/fixtures/cases.ts` | 4 mutation helpers + DEMO_STATE_ORDER + audit-id sequence + activity appender | +245 |
| `apps/operations-console/src/mocks/handlers.ts` | 4 mutation handlers; import block extended | +145 |
| `apps/operations-console/src/components/case-actions/RetryCaseModal.tsx` | new | +124 |
| `apps/operations-console/src/components/case-actions/CloseCaseModal.tsx` | new | +144 |
| `apps/operations-console/src/components/case-actions/AdvanceCaseModal.tsx` | new | +118 |
| `apps/operations-console/src/components/case-actions/ReassignOwnerModal.tsx` | new | +156 |
| `apps/operations-console/src/components/case-actions/CaseActionPanel.tsx` | new | +147 |
| `apps/operations-console/src/pages/case-detail/CaseDetailPage.tsx` | +1 import line, +5 line component insertion | +6 |
| `apps/operations-console/test/phase-b-actions.integration.test.tsx` | new — 11 tests | +250 |

**Total:** ~1,605 LOC added. No file deleted; no Phase A test or production file modified except for the small `permissions.ts` reconciliation and the small `CaseDetailPage.tsx` insertion.

No platform package changed. `git diff packages/` is empty. The kickoff's def-of-done item "Platform packages unchanged" is satisfied.

---

## Hand-off readiness

- ✅ All 1,003 Phase A baseline tests preserved and still passing
- ✅ 11 new Phase B integration tests added (target was 12–15 by Phase B end; 11 covers the 4 single-case actions thoroughly, picker + bulk-retry will add 2–4 more in the next phase)
- ✅ Workspace test count: 1,003 → 1,014 (+11)
- ✅ Patient app: 14/14 tests, unchanged
- ✅ Bundle within budget (363.40 KB gz initial, 9.1% headroom under 400 KB ceiling)
- ✅ TypeScript references clean across all 11 packages + 2 apps
- ✅ All Phase B spec deviations documented inline in code AND in this handback
- ✅ All decisions made under kickoff authority documented with rationale
- ✅ Phase B partial completion is clean — the 4 single-case actions are independently shippable; v0.1.3-dependent items don't block them

Ready for review. Resumption point for the v0.1.3-dependent work is documented in the "Resumption guide" section.

**Phase B (single-case actions slice) closed.**
