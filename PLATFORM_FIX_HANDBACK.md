# Platform Fix Session — Handback

**Status:** Complete
**Date:** 2026-05-06
**Triggered by:** `DESIGN_SYSTEM_PLATFORM_FIX_KICKOFF.md` (kickoff after Operations Console Phase A surfaced two latent platform bugs)

---

## Summary

Two platform bugs identified by the Operations Console Phase A integration are now closed end-to-end. Issue #1 (cache-key mismatch when request schema has `.default(...)`) has a regression test that fails against the unfixed hook and passes with the fix in place. Issue #2 (envelope-wrap requirement undocumented + duplicated locally) is fixed at the platform — both consumers (`@tensaw/mock-server` and `apps/operations-console`) now import the shared builders from `@tensaw/runtime` instead of carrying local copies.

**Test count:** 984 → **1,003** (+19)

| Package | Tests | Δ |
|---|---|---|
| codes | 44 | 0 |
| runtime | **83** | **+12** |
| actions | **76** | **+7** |
| design-system | 567 | 0 |
| visualization | 74 | 0 |
| composition | 45 | 0 |
| worklist | 11 | 0 |
| wired-components | 71 | 0 |
| ops-console | 18 | 0 |
| patient | 14 | 0 |
| **Total** | **1,003** | **+19** |

**All gates green:**

| Gate | Result |
|---|---|
| `pnpm install` | ✅ 16 sec |
| `pnpm typecheck` | ✅ Clean across 11 packages |
| `pnpm test` | ✅ 1,003 passing |
| `pnpm build` | ✅ Clean |
| Per-package `pnpm lint` | ✅ Clean for every touched package |

---

## Honest framing

When I extracted `tensaw-ui-frontend-phase-a.zip`, I discovered the workspace **already contained the fixes** described in the kickoff:

- `useActionQuery` already had the `useMemo`'d `safeParse` pre-validation step
- `buildSuccessEnvelope` and `buildErrorEnvelope` already existed in `packages/runtime/src/api/envelope.ts`
- `apps/operations-console/src/actions/index.ts` already had the `admin.stuck-cases` schema reverted to use `.default(...)`
- Versions were already bumped (`@tensaw/runtime` 0.1.0, `@tensaw/actions` 0.0.1)
- CHANGELOGs already existed for both packages
- The `WIRING_PATTERNS.md` doc snippet about MSW envelope helpers was already in place

The kickoff document, in retrospect, describes the intent of work that had already been completed before zipping — not work to be done.

What was **genuinely outstanding**:

1. **Both consumers still had local `envelope()` helpers** — the platform-side helpers existed in `@tensaw/runtime` but no consumer code imported them. The kickoff's "migration required" steps were real outstanding work.
2. **No regression test existed for Issue #1** — the fix was in the hook but nothing locked it in. A future refactor could quietly break the contract again.
3. **No tests existed for the new envelope builders** — they were exported but only exercised indirectly through integration tests that happened to use them.

This session closes those three gaps.

---

## Issue #1 — Cache-key mismatch with `.default(...)` schemas

### What was already done (carried in the workspace)

`packages/actions/src/hooks/index.ts` — `useActionQuery` pre-validates the request through the action's Zod schema before deriving the cache key:

```ts
const validatedRequest = useMemo(() => {
  const decl = getAction(actionId);
  if (decl?.kind !== 'query') return request;
  const parse = decl.request.safeParse(request);
  return parse.success ? (parse.data as unknown) : request;
}, [actionId, request]);

const cacheKey = resolveCacheKey(actionId, validatedRequest);
```

`validatedRequest` flows into `cacheKey`, the `subscribeToCacheKey` subscription, and `dispatchAction`. All three sides of the cache contract now key off the same shape.

### What I added this session

**`packages/actions/src/hooks/useActionQuery.cacheKey.test.tsx`** — 4 regression tests:

1. **Partial-request case (the original failure mode):** registers an action with `.default(0)` for `offset`, calls `useActionQuery('admin.stuck-cases', { limit: 200 })`, asserts the component receives data after dispatch resolves.
2. **Full-request sanity check:** caller passes both `limit` and `offset` explicitly. Catches the easy mistake of fixing the partial case while breaking the full case.
3. **No-defaults sanity check:** action without any `.default(...)` fields. Catches regressions to the schema-less code path.
4. **Validation-failure fallback:** caller passes a request the schema rejects. Hook reflects the error via `error`, doesn't crash, doesn't deadlock.

### How I verified the test discriminates the bug

I temporarily reverted the fix in `useActionQuery` (replaced `validatedRequest` references with the raw `request`) and ran the test:

- Test 1 (partial): **failed** — `data` stayed `undefined`, just as the kickoff described
- Tests 2, 3, 4: passed — they exercise paths the bug doesn't touch

Then I restored the fix and confirmed all 4 tests pass.

This is the strongest evidence the test isn't a false positive — it actually catches the bug it's designed to catch.

### Test count delta

`@tensaw/actions`: 69 → 76 (+7)
- 4 new tests in `useActionQuery.cacheKey.test.tsx`
- 3 other tests appear to have been added at some prior point (delta vs. kickoff baseline of 69)

---

## Issue #2 — Envelope-wrap requirement undocumented + duplicated locally

### What was already done (carried in the workspace)

`packages/runtime/src/api/envelope.ts` exports two builder helpers:

```ts
export function buildSuccessEnvelope<T>(data: T): ApiSuccess<T>
export function buildErrorEnvelope(code: string, message: string, details?: unknown): ApiError
```

Both attach a fresh `meta` block (`correlationId`, `timestamp`, `apiVersion: 'v1'`) per call. Re-exported from `packages/runtime/src/api/index.ts`. Documented in `packages/design-system/docs/WIRING_PATTERNS.md` under "Mocking the API in tests and dev".

### What I added this session

**Two consumer migrations:**

1. **`packages/mock-server/src/handlers/arHandlers.ts`** — local `envelope()` helper (~10 lines) and `cryptoRandomId()` helper (~6 lines) deleted. `envelope` is now an alias for `buildSuccessEnvelope`. `errorEnvelope(code, message, status)` is a thin wrapper that returns `HttpResponse.json(buildErrorEnvelope(code, message), { status })` — preserves the local convenience of getting an `HttpResponse` back, drops the meta-construction code.

2. **`apps/operations-console/src/mocks/handlers.ts`** — same migration. Local `envelope()` helper (~14 lines) and `errorEnvelope()` helper (~16 lines) deleted, replaced with the alias + thin `HttpResponse` wrapper.

**One workspace dependency added:** `@tensaw/runtime` was missing from `packages/mock-server/package.json`'s dependencies — added it. Ops-console already had it.

**12 new builder unit tests** in `packages/runtime/src/api/envelope.test.ts`:

- `buildSuccessEnvelope` (6 tests): data attachment, meta block shape, schema-validation round-trip, type-guard round-trip, fresh meta per call, primitive payloads
- `buildErrorEnvelope` (6 tests): code/message attachment, details omission when undefined, details attachment when supplied, schema-validation round-trip, type-guard round-trip, meta block shape

### Verification of consumer migrations

- Patient app: **14/14 integration tests still pass** with the migrated `arHandlers.ts`
- Operations console: **18/18 integration tests still pass** with the migrated `handlers.ts`

This is the strongest end-to-end validation the helpers behave identically to the local copies they replaced — the existing integration tests run the full request → MSW → envelope → action-dispatcher → React-component round trip.

### Test count delta

`@tensaw/runtime`: 71 → 83 (+12)
- 12 new tests in `envelope.test.ts`

---

## Files changed this session

| File | Change |
|---|---|
| `packages/runtime/src/api/envelope.test.ts` | +12 tests for `buildSuccessEnvelope` / `buildErrorEnvelope` |
| `packages/mock-server/package.json` | Added `@tensaw/runtime` workspace dep |
| `packages/mock-server/src/handlers/arHandlers.ts` | Replaced local envelope helpers with shared imports (~16 lines deleted) |
| `apps/operations-console/src/mocks/handlers.ts` | Replaced local envelope helpers with shared imports (~30 lines deleted) |
| `packages/actions/src/hooks/useActionQuery.cacheKey.test.tsx` | New test file — 4 regression tests for Issue #1 |
| `packages/actions/src/hooks/testEnvSetup.ts` | Copied from `dispatcher/testEnvSetup.ts` to support the new test file |

**Lines deleted:** ~46 (envelope helper duplication)
**Lines added:** ~330 (16 new tests + their fixtures)

**No production code in `useActionQuery` or any other hot path was modified this session.** Both fixes were already applied to the shipped workspace; this session added the lock-in tests and migrated the consumers to use the platform helpers that already existed.

---

## What's deferred (carried forward)

These are noted in the Phase A handback as separate concerns and remain open. None blocks declaring this session complete.

| Phase A Issue | Status |
|---|---|
| #1 — cache-key mismatch | ✅ Closed (this session) |
| #2 — envelope helpers | ✅ Closed (this session) |
| #3 — `cache.invalidatedBy` accepts unregistered action IDs silently | ❌ Deferred — needs a separate small-scope session |
| #4 — workspace-root `pnpm lint` truncated by ELIFECYCLE in long sessions | ❌ Deferred — environmental constraint, not a code bug; per-package lint runs are clean |

I confirmed Issue #4 again in this session — `pnpm lint` from the workspace root timed out partway through, but per-package lint runs are clean for every package I touched. This is wall-clock budget exhaustion on the serial multi-package run, not a code defect.

---

## Final verification

```bash
pnpm install            # ✅ 16 sec
pnpm typecheck          # ✅ Clean
pnpm build              # ✅ Clean
pnpm -r --workspace-concurrency 1 test
                        # ✅ 1,003 tests passing
```

Per-package lint runs (each clean):
```bash
pnpm --filter @tensaw/runtime lint
pnpm --filter @tensaw/actions lint
pnpm --filter @tensaw/mock-server lint
pnpm --filter @tensaw/app-operations-console lint
pnpm --filter @tensaw/app-patient lint
```

Workspace lint via `pnpm lint` from root reproducibly fails with `ELIFECYCLE` after wall-clock exhaustion — this is the documented Phase A Issue #4 and is out of scope for this session.

---

## Definition of done — checklist

- ✅ `buildSuccessEnvelope` and `buildErrorEnvelope` exported from `@tensaw/runtime` (already present)
- ✅ Both helpers have unit tests (12 new tests added this session)
- ✅ `@tensaw/mock-server`'s arHandlers uses the shared helper (local copy removed this session)
- ✅ `apps/operations-console`'s handlers use the shared helper (local copy removed this session)
- ✅ MSW envelope requirement documented in `WIRING_PATTERNS.md` (already present)
- ✅ `useActionQuery` pre-validates request before deriving cache key (already present)
- ✅ New regression test in `@tensaw/actions` exercises the `.default()` failure mode (4 tests added this session)
- ✅ Test fails against unfixed `useActionQuery`, passes after the fix (verified by temporary revert)
- ✅ All 14 patient app integration tests still pass
- ✅ All 18 operations-console integration tests still pass
- ✅ All 69 existing actions tests still pass (now 76 with the new tests)
- ✅ At least one operations-console action schema reverted to use `.default(...)` to validate the fix end-to-end (already present — `admin.stuck-cases`)
- ✅ Affected package versions bumped + CHANGELOG entries (already present)
- ✅ Brief handback document summarizing what shipped (this file)

---

## Suggested follow-up sessions

**Issue #3** — `cache.invalidatedBy` accepts unregistered action IDs silently. A small enhancement to `defineAction()` that warns (not throws) when an `invalidatedBy` entry references an unknown action ID. Keeps the forward-declaration pattern Phase A uses, catches typos. ~1 hour.

**Issue #4** — investigate the workspace-root `pnpm lint` timeout. Likely needs `--workspace-concurrency` tuning, a `lint:fast` script that skips the slowest packages, or splitting lint into batches. ~1 hour.

Both are independent of each other and of any product feature work. Either can be picked up whenever convenient.
