/**
 * Operations Console — actions registry (Phase A).
 *
 * Defines every action the operations console can dispatch. Mirrors
 * the patient app's `registerARActions` pattern at
 * `apps/patient/src/pages/ar-mgmt/actions.ts`.
 *
 * Phase A is read-only: 6 query actions, no mutations. Phase B will
 * add 4 mutations (admin.retry-case, admin.close-case, admin.advance-case,
 * admin.reassign-owner) — declarations are NOT included here.
 *
 * Permission strings are mapped to roles in `src/auth/permissions.ts`.
 * Phase A actions all require `console.read` which spans all read-capable
 * roles per frontend tech spec §4.5.
 *
 * Cache invalidation: queries are tagged so Phase B mutations can
 * invalidate without us having to revisit each query declaration. The
 * `invalidatedBy` lists reference Phase B action ids — these resolve
 * to no-ops in Phase A because the actions aren't registered yet
 * (registry treats unknown ids as "never invalidate"), and become
 * active automatically when Phase B registers them.
 *
 * Register at app boot:
 *   import { registerOperationsConsoleActions } from './actions';
 *   registerOperationsConsoleActions();
 */

import { z } from 'zod';
import { defineAction } from '@tensaw/actions';

import {
  AdvanceCaseRequestSchema,
  AdvanceCaseResponseSchema,
  BulkRetryRequestSchema,
  BulkRetryResponseSchema,
  CaseDetailResponseSchema,
  CaseHistoryResponseSchema,
  CASE_GROUP_BY_OPTIONS,
  CASE_SORT_OPTIONS,
  CloseCaseRequestSchema,
  CloseCaseResponseSchema,
  PaginatedAdminCasesResponseSchema,
  ReassignOwnerRequestSchema,
  ReassignOwnerResponseSchema,
  RecentActivityResponseSchema,
  RetryCaseRequestSchema,
  RetryCaseResponseSchema,
  SchedulerHealthSchema,
  StuckCasesResponseSchema,
  UserListResponseSchema,
} from './schemas';

/**
 * Register all Operations Console Phase A actions. Called once from
 * `bootstrap.ts`. Idempotent on the registry side (defineAction throws
 * on duplicate id, which is the right behavior for a single-app boot path).
 */
export function registerOperationsConsoleActions(): void {
  // ---- Admin cases listing (Dashboard, Case List, Activity Stream) -----

  defineAction({
    actionId: 'admin.list-cases',
    kind: 'query',
    endpoint: 'GET /v1/admin/cases',
    permission: 'console.read',
    description:
      'List cases with filters, sort, pagination, optional grouping. ' +
      'Powers the Case List screen and the Dashboard "by state" chart.',
    request: z.object({
      state_code: z.string().optional(),
      case_type: z.string().optional(),
      /** Comma-separated; server enforces user's clinic scope. */
      clinic_ids: z.string().optional(),
      payer_id: z.string().optional(),
      owner_user_id: z.string().optional(),
      created_at_gte: z.string().datetime().optional(),
      created_at_lte: z.string().datetime().optional(),
      include_closed: z.boolean().optional(),
      offset: z.number().int().min(0).optional(),
      limit: z.number().int().min(0).max(200).optional(),
      sort: z.enum(CASE_SORT_OPTIONS).optional(),
      group_by: z.enum(CASE_GROUP_BY_OPTIONS).optional(),
    }),
    response: PaginatedAdminCasesResponseSchema,
    cache: {
      tag: 'admin-cases',
      // Phase B mutations invalidate this. Until they register, these
      // ids resolve to no-ops in the dispatcher.
      invalidatedBy: [
        'admin.retry-case',
        'admin.close-case',
        'admin.advance-case',
        'admin.reassign-owner',
        'admin.bulk-retry-cases',
      ],
    },
  });

  // ---- Recent activity (Dashboard panel + Activity Stream) -------------

  defineAction({
    actionId: 'admin.recent-activity',
    kind: 'query',
    endpoint: 'GET /v1/admin/recent-activity',
    permission: 'console.read',
    description: 'Cross-case timeline of recent state transitions.',
    request: z.object({
      /** ISO-8601 duration. Default PT15M, max P7D server-side. */
      since: z.string().regex(/^P/).optional(),
      state_code_from: z.string().optional(),
      state_code_to: z.string().optional(),
      /**
       * Per backend Phase A handback deviation #1, accepts the actual
       * v0.1.0 schema values: POLL, SIGNAL, MANUAL_ADVANCE, RECLAIM
       * (plus v0.1.2 additions CONSOLE_RETRY, CONSOLE_CLOSE).
       */
      trigger_type: z.string().optional(),
      case_type: z.string().optional(),
      clinic_ids: z.string().optional(),
      offset: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }),
    response: RecentActivityResponseSchema,
    cache: {
      tag: 'recent-activity',
      invalidatedBy: [
        'admin.retry-case',
        'admin.close-case',
        'admin.advance-case',
        'admin.reassign-owner',
        'admin.bulk-retry-cases',
      ],
    },
  });

  // ---- Stuck cases (Stuck Cases screen + Dashboard KPI) ----------------

  defineAction({
    actionId: 'admin.stuck-cases',
    kind: 'query',
    endpoint: 'GET /v1/admin/stuck-cases',
    permission: 'console.read',
    description:
      'Cases needing human attention (overdue, max-attempts, fatal error). ' +
      'Powers the Stuck Cases screen + the Dashboard\'s stuck-count KPI.',
    // NOTE: This schema uses `.default(...)` for `offset` and `limit` — Phase A
    // had stripped the defaults to work around the cache-key parity bug
    // (see Frontend_Phase_A_Handback.md, Issue #1). With the platform fix
    // applied (useActionQuery pre-validates the request), `.default(...)` is
    // safe to use again. The dashboard widget calls this with `{}` and gets
    // the defaults applied; the stuck-cases page passes a `limit` and the
    // default `offset: 0` fills in.
    request: z.object({
      offset: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(500).default(50),
    }),
    response: StuckCasesResponseSchema,
    cache: {
      tag: 'stuck-cases',
      invalidatedBy: [
        'admin.retry-case',
        'admin.close-case',
        'admin.advance-case',
        'admin.bulk-retry-cases',
      ],
    },
  });

  // ---- Case detail (Case Detail screen) --------------------------------

  defineAction({
    actionId: 'admin.case-detail',
    kind: 'query',
    endpoint: 'GET /v1/cases/{case_id}',
    permission: 'console.read',
    description: 'Single case snapshot — case + open tasks + facts.',
    request: z.object({ case_id: z.string() }),
    response: CaseDetailResponseSchema,
    cache: {
      tag: 'case-detail',
      invalidatedBy: [
        'admin.retry-case',
        'admin.close-case',
        'admin.advance-case',
        'admin.reassign-owner',
        'admin.bulk-retry-cases',
      ],
    },
  });

  // ---- Case history (Case Detail screen) -------------------------------

  defineAction({
    actionId: 'admin.case-history',
    kind: 'query',
    endpoint: 'GET /v1/cases/{case_id}/history',
    permission: 'console.read',
    description: 'Step history for a case (the timeline section).',
    request: z.object({
      case_id: z.string(),
      offset: z.number().int().min(0).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
    response: CaseHistoryResponseSchema,
    cache: {
      tag: 'case-history',
      invalidatedBy: [
        'admin.retry-case',
        'admin.close-case',
        'admin.advance-case',
        'admin.bulk-retry-cases',
      ],
    },
  });

  // ---- Scheduler health (Dashboard "Polling lag" KPI) ------------------

  defineAction({
    actionId: 'admin.health-scheduler',
    kind: 'query',
    endpoint: 'GET /v1/health/scheduler',
    permission: 'console.read',
    description: 'Scheduler health — polling lag, active leases, version.',
    request: z.object({}),
    response: SchedulerHealthSchema,
    cache: { tag: 'health-scheduler' },
  });

  // ============================================================
  // Phase B — Tier 2 mutations (single-case actions)
  // ============================================================
  //
  // Cache invalidation is already pre-wired on the query side in Phase A:
  // each query's `cache.invalidatedBy` array references these action ids,
  // and the dispatcher activates them automatically when the mutations
  // register (i.e., right here). No `invalidates` field needed on the
  // mutation declarations themselves.
  //
  // Permissions per BRD §3.8 + backend tech spec §4.2:
  //   - retry:    CONSOLE_RETRY_ROLES   = TENSAW_*, TENANT_ADMIN, RCM_OPS_*
  //   - close:    CONSOLE_CLOSE_ROLES   = retry minus RCM_OPS_REVIEWER
  //   - advance:  CONSOLE_ADVANCE_ROLES = same as retry
  //   - reassign: CONSOLE_REASSIGN_ROLES = retry plus CLINIC_ADMIN
  // (CLINIC_ADMIN's reassign is gated to their own clinic by the backend's
  // enforce_clinic_scope helper; the frontend additionally hides actions
  // outside permission via the action panel's ROLE_ALLOWS map.)

  // ---- Retry: POST /v1/admin/cases/{case_id}/retry ---------------------

  defineAction({
    actionId: 'admin.retry-case',
    kind: 'mutation',
    endpoint: 'POST /v1/admin/cases/{case_id}/retry',
    permission: 'console.retry',
    description:
      'Re-arm a case by clearing the last error and setting next_action_at=now. ' +
      'Preserves attempt_count per spec §3.3. Writes step_history and audit_log.',
    request: RetryCaseRequestSchema,
    response: RetryCaseResponseSchema,
    onSuccess: { toast: 'Retry submitted; case will reprocess shortly.' },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Close: POST /v1/admin/cases/{case_id}/close ---------------------

  defineAction({
    actionId: 'admin.close-case',
    kind: 'mutation',
    endpoint: 'POST /v1/admin/cases/{case_id}/close',
    permission: 'console.close',
    description:
      'Permanently close a case. Sets closed_at, writes close_reason_code into ' +
      'last_error_code (per ADR-OC-3 — state_code is preserved), nulls ' +
      'next_action_at. RCM_OPS_REVIEWER cannot close (BRD §3.8).',
    request: CloseCaseRequestSchema,
    response: CloseCaseResponseSchema,
    onSuccess: { toast: 'Case closed.' },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Force-advance: POST /v1/cases/{case_id}/advance -----------------
  //
  // v0.1.0-carryover endpoint at the case CRUD path (NOT /v1/admin/cases/...).
  // The reason field is optional per kickoff; when supplied it gets the
  // same 10..1000 char validation as retry/close.

  defineAction({
    actionId: 'admin.advance-case',
    kind: 'mutation',
    endpoint: 'POST /v1/cases/{case_id}/advance',
    permission: 'console.advance',
    description:
      'Force-advance a case to its next state synchronously, bypassing ' +
      'the polling cadence. Same role set as retry.',
    request: AdvanceCaseRequestSchema,
    response: AdvanceCaseResponseSchema,
    onSuccess: { toast: 'Case advanced.' },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Reassign owner: PATCH /v1/cases/{case_id}/owner -----------------
  //
  // v0.1.0-carryover endpoint. `new_owner_user_id` of `null` unassigns.
  // The user-picker UI (Phase B step 9) is deferred until the v0.1.3
  // backend ships `GET /v1/admin/users`; for now this takes a free-text
  // owner id (typically email).

  defineAction({
    actionId: 'admin.reassign-owner',
    kind: 'mutation',
    endpoint: 'PATCH /v1/cases/{case_id}/owner',
    permission: 'console.reassign',
    description:
      'Change the owner_user_id on a case. Pass null to unassign. ' +
      'CLINIC_ADMIN can only reassign cases in their own clinic (server-enforced).',
    request: ReassignOwnerRequestSchema,
    response: ReassignOwnerResponseSchema,
    onSuccess: { toast: 'Owner updated.' },
    onError: { toast: { kind: 'error-message' } },
  });

  // ============================================================
  // Phase B slice 2 — v0.1.3-dependent actions
  // ============================================================
  //
  // Real backend now exists (`tensaw-workflow-runtime` v0.1.3 shipped
  // 2026-05-07; see Phase_v0_1_3_Handback.md). MSW handlers in
  // `src/mocks/handlers.ts` mirror the wire shapes so dev/test still
  // works without the runtime running.
  //
  // The slice 2 mutation `admin.bulk-retry-cases` was added to each
  // affected query's `cache.invalidatedBy` array above (admin-cases,
  // recent-activity, stuck-cases, case-detail, case-history) — same
  // 5-query set that `admin.retry-case` invalidates, since bulk retry
  // is N retries cache-wise. No `invalidates` field on the mutation
  // side, mirroring slice 1's discipline.

  // ---- List users (GET /v1/admin/users) --------------------------------
  //
  // Powers the Tier 3 user-picker that swapped in for the slice 1 free-
  // text owner input. v0.1.3 perf-optimization: when a tenant-wide
  // caller passes no `role_filter`, the endpoint skips per-user Cognito
  // group hydration and returns `roles=[]` and `clinic_ids=[]`. Callers
  // who want role badges (like ReassignOwnerModal) pass `role_filter`
  // to force hydration. See Phase_v0_1_3_Handback §6 review item #2.

  defineAction({
    actionId: 'admin.list-users',
    kind: 'query',
    endpoint: 'GET /v1/admin/users',
    permission: 'console.read',
    description:
      'List tenant users for the reassign-owner picker. ' +
      'Cognito-backed; 60-second TTL cache per backend.',
    request: z.object({
      role_filter: z.array(z.string()).optional(),
      search: z.string().max(64).optional(),
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    }),
    response: UserListResponseSchema,
    // No `invalidatedBy` — Cognito mutations happen out-of-band, so
    // there's no in-app action that should invalidate this. The 60-
    // second TTL on the backend (matched by useActionQuery's default
    // 60_000ms `freshFor`) is the only invalidation path. Restart the
    // runtime to force-clear if a new user must propagate sooner.
    cache: { tag: 'admin-users' },
  });

  // ---- Bulk retry: POST /v1/admin/cases/bulk-retry ---------------------
  //
  // Retry up to 100 cases in a single request with partial-success
  // semantics. Each case is its own transaction backend-side; the
  // response is `{items, summary, correlation_id}`. Per-case errors
  // don't roll back the bulk operation. Permission `console.retry`
  // (same as single-retry); the Stuck Cases page renders the multi-
  // select column and "Retry selected" button only when this perm is
  // present.

  defineAction({
    actionId: 'admin.bulk-retry-cases',
    kind: 'mutation',
    endpoint: 'POST /v1/admin/cases/bulk-retry',
    permission: 'console.retry',
    description:
      'Retry up to 100 cases atomically with partial-success semantics. ' +
      'Each case is its own transaction; response surfaces per-case status.',
    request: BulkRetryRequestSchema,
    response: BulkRetryResponseSchema,
    // The toast is fired by the modal based on summary.succeeded /
    // summary.failed; we don't use a static onSuccess.toast here
    // because the message branches on the partial-success state.
    // The dispatcher's onError is still useful for transport-level
    // failures (request validation 400, network).
    onError: { toast: { kind: 'error-message' } },
  });
}
