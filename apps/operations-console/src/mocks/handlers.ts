/**
 * MSW handlers for the Operations Console Phase A endpoints.
 *
 * Six endpoints:
 *   1. GET /v1/admin/cases             — paginated case listing
 *   2. GET /v1/admin/recent-activity   — cross-case timeline
 *   3. GET /v1/admin/stuck-cases       — stuck cases dashboard
 *   4. GET /v1/cases/{case_id}         — case detail snapshot
 *   5. GET /v1/cases/{case_id}/history — case history timeline
 *   6. GET /v1/health/scheduler        — scheduler health KPI
 *
 * Handlers return shapes that match what the real backend actually
 * returns per `Phase_A_Handback.md` deviations:
 *
 *   - `groups` is `{value: count}` flat map (NULL bucket = literal "<null>")
 *   - `trigger_type` accepts POLL, SIGNAL, MANUAL_ADVANCE, RECLAIM, CONSOLE_RETRY, CONSOLE_CLOSE
 *   - Phase A leaves recent-activity actor fields (`actor_subject`,
 *     `actor_email`, `console_action_type`, `reason`) null EXCEPT for
 *     the one demo CONSOLE_RETRY entry (visual reference for Phase B)
 *   - Closed cases keep their `state_code`; `closed_at IS NOT NULL` is
 *     the indicator. The `include_closed` query param controls whether
 *     they're in the list.
 *
 * The handler registers against a base URL passed in at build time
 * (mirrors `buildARHandlers(baseUrl)` in `@tensaw/mock-server`).
 */

import { http, HttpResponse } from 'msw';
import { buildErrorEnvelope, buildSuccessEnvelope } from '@tensaw/runtime';
import {
  applyAdvance,
  applyClose,
  applyRetry,
  applyReassign,
  getMockState,
  resetMockState,
  FIXTURE_NOW_ISO,
} from './fixtures/cases';
import { filterUsers } from './fixtures/users';
import {
  CLOSE_REASON_CODES,
  type AdminCaseRow,
  type AdvanceCaseResponse,
  type BulkRetryItem,
  type BulkRetryResponse,
  type CaseDetailResponse,
  type CaseHistoryResponse,
  type CloseCaseResponse,
  type PaginatedAdminCasesResponse,
  type ReassignOwnerResponse,
  type RecentActivityResponse,
  type RetryCaseResponse,
  type SchedulerHealth,
  type StuckCasesResponse,
  type UserListResponse,
} from '../actions/schemas';

/** Reset all in-memory mock state. Called by vitest.setup.ts afterEach. */
export function resetMockAdminState(): void {
  resetMockState();
}

// ---- Envelope helpers -----------------------------------------------------

/**
 * Thin local adapters over `@tensaw/runtime`'s envelope builders. Existing
 * call sites use:
 *   - `envelope(data)` — returns the plain ApiSuccess envelope (callers wrap
 *     with HttpResponse.json themselves).
 *   - `errorEnvelope(code, message, status)` — returns a fully-formed
 *     HttpResponse with status set, used as a return value.
 */
const envelope = buildSuccessEnvelope;

function errorEnvelope(code: string, message: string, status: number) {
  return HttpResponse.json(buildErrorEnvelope(code, message), { status });
}

// ---- Helpers --------------------------------------------------------------

function readNumberParam(
  url: URL,
  key: string,
  defaultValue: number,
): number {
  const raw = url.searchParams.get(key);
  if (raw === null || raw === '') return defaultValue;
  const n = Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}

function parseIsoDuration(spec: string | null): number {
  // Minimal parser for PT15M, PT1H, P7D, etc.
  if (!spec) return 15 * 60_000;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(spec);
  if (!m) return 15 * 60_000;
  const [, d, h, mins, s] = m;
  let ms = 0;
  if (d) ms += Number(d) * 86_400_000;
  if (h) ms += Number(h) * 3_600_000;
  if (mins) ms += Number(mins) * 60_000;
  if (s) ms += Number(s) * 1000;
  return ms || 15 * 60_000;
}

function applyClinicScopeFilter(
  rows: AdminCaseRow[],
  clinicIdsParam: string | null,
): AdminCaseRow[] {
  if (!clinicIdsParam) return rows;
  const allowed = new Set(clinicIdsParam.split(',').map((s) => s.trim()));
  return rows.filter((r) => r.clinic_id !== null && allowed.has(r.clinic_id));
}

// ---- Handlers builder -----------------------------------------------------

export function buildAdminHandlers(baseUrl: string) {
  const u = (path: string) => `${baseUrl.replace(/\/$/, '')}${path}`;

  return [
    // ---- 1. GET /v1/admin/cases ------------------------------------------
    http.get(u('/v1/admin/cases'), ({ request }) => {
      const url = new URL(request.url);
      const stateCode = url.searchParams.get('state_code');
      const caseType = url.searchParams.get('case_type');
      const clinicIds = url.searchParams.get('clinic_ids');
      const payerId = url.searchParams.get('payer_id');
      const ownerUserId = url.searchParams.get('owner_user_id');
      const includeClosed = url.searchParams.get('include_closed') === 'true';
      const offset = readNumberParam(url, 'offset', 0);
      const limit = readNumberParam(url, 'limit', 50);
      const sort = url.searchParams.get('sort') ?? 'age_desc';
      const groupBy = url.searchParams.get('group_by');

      const { adminRows } = getMockState();
      let rows = [...adminRows];

      // Closed-case gate (BRD: closed cases keep state_code; closed_at IS NOT NULL is the indicator)
      if (!includeClosed) {
        rows = rows.filter((r) => r.closed_at === null);
      }

      if (stateCode) rows = rows.filter((r) => r.state_code === stateCode);
      if (caseType) rows = rows.filter((r) => r.case_type === caseType);
      if (payerId) rows = rows.filter((r) => r.payer_id === payerId);
      if (ownerUserId) rows = rows.filter((r) => r.owner_user_id === ownerUserId);
      rows = applyClinicScopeFilter(rows, clinicIds);

      // Sort
      switch (sort) {
        case 'age_asc':
          rows.sort((a, b) => (a.opened_at ?? '').localeCompare(b.opened_at ?? ''));
          break;
        case 'last_activity_desc':
          rows.sort((a, b) =>
            (b.state_updated_at ?? '').localeCompare(a.state_updated_at ?? ''),
          );
          break;
        case 'case_id_asc':
          rows.sort((a, b) => a.case_id.localeCompare(b.case_id));
          break;
        case 'age_desc':
        default:
          rows.sort((a, b) => (a.opened_at ?? '').localeCompare(b.opened_at ?? ''));
          break;
      }

      const total = rows.length;
      const page = rows.slice(offset, offset + limit);

      let groups: Record<string, number> | null = null;
      if (groupBy) {
        const acc: Record<string, number> = {};
        for (const r of rows) {
          const key =
            groupBy === 'state_code'
              ? r.state_code
              : groupBy === 'case_type'
                ? r.case_type
                : groupBy === 'clinic_id'
                  ? r.clinic_id ?? '<null>'
                  : groupBy === 'payer_id'
                    ? r.payer_id ?? '<null>'
                    : '<null>';
          acc[key] = (acc[key] ?? 0) + 1;
        }
        groups = acc;
      }

      const body: PaginatedAdminCasesResponse = {
        items: page,
        total,
        offset,
        limit,
        ...(groups ? { groups } : {}),
      };
      return HttpResponse.json(envelope(body));
    }),

    // ---- 2. GET /v1/admin/recent-activity --------------------------------
    http.get(u('/v1/admin/recent-activity'), ({ request }) => {
      const url = new URL(request.url);
      const sinceSpec = url.searchParams.get('since');
      const since = parseIsoDuration(sinceSpec);
      const stateFrom = url.searchParams.get('state_code_from');
      const stateTo = url.searchParams.get('state_code_to');
      const triggerType = url.searchParams.get('trigger_type');
      const caseType = url.searchParams.get('case_type');
      const clinicIds = url.searchParams.get('clinic_ids');
      const offset = readNumberParam(url, 'offset', 0);
      const limit = readNumberParam(url, 'limit', 100);

      const { recentActivity } = getMockState();
      const cutoffMs = Date.parse(FIXTURE_NOW_ISO) - since;
      let rows = recentActivity.filter(
        (r) => r.occurred_at !== null && Date.parse(r.occurred_at) >= cutoffMs,
      );

      if (stateFrom) rows = rows.filter((r) => r.state_code_from === stateFrom);
      if (stateTo) rows = rows.filter((r) => r.state_code_to === stateTo);
      if (triggerType) rows = rows.filter((r) => r.trigger_type === triggerType);
      if (caseType) rows = rows.filter((r) => r.case_type === caseType);
      if (clinicIds) {
        const allowed = new Set(clinicIds.split(',').map((s) => s.trim()));
        rows = rows.filter((r) => r.clinic_id !== null && allowed.has(r.clinic_id));
      }

      const total = rows.length;
      const page = rows.slice(offset, offset + limit);

      const body: RecentActivityResponse = {
        items: page,
        total,
        offset,
        limit,
        since: new Date(cutoffMs).toISOString(),
      };
      return HttpResponse.json(envelope(body));
    }),

    // ---- 3. GET /v1/admin/stuck-cases ------------------------------------
    http.get(u('/v1/admin/stuck-cases'), ({ request }) => {
      const url = new URL(request.url);
      const offset = readNumberParam(url, 'offset', 0);
      const limit = readNumberParam(url, 'limit', 50);

      const { stuckRows } = getMockState();
      const total = stuckRows.length;
      const page = stuckRows.slice(offset, offset + limit);

      const body: StuckCasesResponse = {
        items: page,
        total,
        offset,
        limit,
      };
      return HttpResponse.json(envelope(body));
    }),

    // ---- 4. GET /v1/cases/{case_id} --------------------------------------
    http.get(u('/v1/cases/:caseId'), ({ params }) => {
      const caseId = params.caseId as string;
      const { caseDetails } = getMockState();
      const detail = caseDetails.get(caseId);
      if (!detail) {
        return errorEnvelope('NOT_FOUND', `Case ${caseId} not found`, 404);
      }
      const body: CaseDetailResponse = detail;
      return HttpResponse.json(envelope(body));
    }),

    // ---- 5. GET /v1/cases/{case_id}/history ------------------------------
    http.get(u('/v1/cases/:caseId/history'), ({ params, request }) => {
      const caseId = params.caseId as string;
      const url = new URL(request.url);
      const offset = readNumberParam(url, 'offset', 0);
      const limit = readNumberParam(url, 'limit', 50);

      const { caseHistories } = getMockState();
      const rows = caseHistories.get(caseId) ?? [];
      const total = rows.length;
      const page = rows.slice(offset, offset + limit);

      const body: CaseHistoryResponse = {
        items: page,
        total,
        offset,
        limit,
      };
      return HttpResponse.json(envelope(body));
    }),

    // ---- 6. GET /v1/health/scheduler -------------------------------------
    http.get(u('/v1/health/scheduler'), () => {
      const body: SchedulerHealth = {
        last_poll_at: FIXTURE_NOW_ISO,
        polling_lag_seconds: 4,
        active_lease_count: 7,
        version: '0.1.2',
        status: 'healthy',
      };
      return HttpResponse.json(envelope(body));
    }),

    // ============================================================
    // Phase B — Tier 2 mutations
    // ============================================================
    //
    // The dispatcher already gated permission before reaching MSW (it
    // checks AuthUser.permissions against decl.permission and emits
    // PLATFORM_FORBIDDEN locally). So MSW only models the backend's
    // 200/404/409/422 paths — never 401/403, which the dispatcher
    // produces synthetically.
    //
    // MOCK_ACTOR is the email written into audit/activity rows. In
    // production this comes from the JWT subject; mocked sign-in puts
    // the chosen email into useAuthStore which the request middleware
    // attaches as Bearer. MSW doesn't read the header here — we just
    // stamp a fixed value.

    // ---- 7. POST /v1/admin/cases/{case_id}/retry -------------------------
    http.post(u('/v1/admin/cases/:caseId/retry'), async ({ params, request }) => {
      const caseId = params.caseId as string;
      const body = (await request.json().catch(() => ({}))) as {
        reason?: unknown;
      };
      const reason = typeof body.reason === 'string' ? body.reason : '';
      if (reason.length < 10 || reason.length > 1000) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'reason must be 10..1000 characters',
          422,
        );
      }
      const actor = 'mock-ops@primrose.health';
      const res = applyRetry(caseId, reason, actor);
      if (!res.ok) {
        if (res.code === 'NOT_FOUND') {
          return errorEnvelope('NOT_FOUND', `Case ${caseId} not found`, 404);
        }
        // CONFLICT_CLOSED
        return errorEnvelope(
          'CONFLICT',
          `Case ${caseId} is already closed`,
          409,
        );
      }
      const responseBody: RetryCaseResponse = {
        case_id: caseId,
        before: res.before,
        after: res.after,
        audit_id: res.audit_id,
        retried_at: res.retried_at,
        retried_by: actor,
      };
      return HttpResponse.json(envelope(responseBody));
    }),

    // ---- 8. POST /v1/admin/cases/{case_id}/close -------------------------
    http.post(u('/v1/admin/cases/:caseId/close'), async ({ params, request }) => {
      const caseId = params.caseId as string;
      const body = (await request.json().catch(() => ({}))) as {
        close_reason_code?: unknown;
        reason?: unknown;
      };
      const reason = typeof body.reason === 'string' ? body.reason : '';
      const closeReasonCode =
        typeof body.close_reason_code === 'string'
          ? body.close_reason_code
          : '';
      if (reason.length < 10 || reason.length > 1000) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'reason must be 10..1000 characters',
          422,
        );
      }
      if (!CLOSE_REASON_CODES.includes(closeReasonCode as never)) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          `close_reason_code must be one of: ${CLOSE_REASON_CODES.join(', ')}`,
          422,
        );
      }
      const actor = 'mock-ops@primrose.health';
      const res = applyClose(caseId, closeReasonCode, reason, actor);
      if (!res.ok) {
        if (res.code === 'NOT_FOUND') {
          return errorEnvelope('NOT_FOUND', `Case ${caseId} not found`, 404);
        }
        return errorEnvelope(
          'CONFLICT',
          `Case ${caseId} is already closed`,
          409,
        );
      }
      const responseBody: CloseCaseResponse = {
        case_id: caseId,
        before: res.before,
        after: res.after,
        audit_id: res.audit_id,
        closed_at: res.closed_at,
        closed_by: actor,
      };
      return HttpResponse.json(envelope(responseBody));
    }),

    // ---- 9. POST /v1/cases/{case_id}/advance -----------------------------
    //
    // Path is /v1/cases/, NOT /v1/admin/cases/ — this is the v0.1.0-carryover
    // case CRUD endpoint. Reason is optional; when present it must still
    // be 10..1000 chars.
    http.post(u('/v1/cases/:caseId/advance'), async ({ params, request }) => {
      const caseId = params.caseId as string;
      const body = (await request.json().catch(() => ({}))) as {
        reason?: unknown;
      };
      const reason = typeof body.reason === 'string' ? body.reason : null;
      if (reason !== null && (reason.length < 10 || reason.length > 1000)) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'reason must be 10..1000 characters when provided',
          422,
        );
      }
      const actor = 'mock-ops@primrose.health';
      const res = applyAdvance(caseId, reason, actor);
      if (!res.ok) {
        if (res.code === 'NOT_FOUND') {
          return errorEnvelope('NOT_FOUND', `Case ${caseId} not found`, 404);
        }
        if (res.code === 'CONFLICT_CLOSED') {
          return errorEnvelope(
            'CONFLICT',
            `Case ${caseId} is already closed`,
            409,
          );
        }
        return errorEnvelope(
          'CONFLICT',
          `Case ${caseId} is at terminal state and cannot advance`,
          409,
        );
      }
      const responseBody: AdvanceCaseResponse = {
        case_id: caseId,
        before: res.before,
        after: res.after,
        audit_id: res.audit_id,
        advanced_at: res.advanced_at,
        advanced_by: actor,
      };
      return HttpResponse.json(envelope(responseBody));
    }),

    // ---- 10. PATCH /v1/cases/{case_id}/owner -----------------------------
    //
    // Same path family as advance. `new_owner_user_id` is required (as
    // a body field); pass null to unassign. Reason optional.
    http.patch(u('/v1/cases/:caseId/owner'), async ({ params, request }) => {
      const caseId = params.caseId as string;
      const body = (await request.json().catch(() => ({}))) as {
        new_owner_user_id?: unknown;
        reason?: unknown;
      };
      const newOwner =
        typeof body.new_owner_user_id === 'string'
          ? body.new_owner_user_id
          : body.new_owner_user_id === null
            ? null
            : undefined;
      if (newOwner === undefined) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'new_owner_user_id is required (string or null)',
          422,
        );
      }
      const reason = typeof body.reason === 'string' ? body.reason : null;
      if (reason !== null && (reason.length < 10 || reason.length > 1000)) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'reason must be 10..1000 characters when provided',
          422,
        );
      }
      const actor = 'mock-ops@primrose.health';
      const res = applyReassign(caseId, newOwner, reason, actor);
      if (!res.ok) {
        if (res.code === 'NOT_FOUND') {
          return errorEnvelope('NOT_FOUND', `Case ${caseId} not found`, 404);
        }
        return errorEnvelope(
          'CONFLICT',
          `Case ${caseId} is already closed and cannot be reassigned`,
          409,
        );
      }
      const responseBody: ReassignOwnerResponse = {
        case_id: caseId,
        before: res.before,
        after: res.after,
        audit_id: res.audit_id,
        reassigned_at: res.reassigned_at,
        reassigned_by: actor,
      };
      return HttpResponse.json(envelope(responseBody));
    }),

    // ============================================================
    // Phase B slice 2 — v0.1.3 endpoints
    // ============================================================
    //
    // Two endpoints that became real in `tensaw-workflow-runtime` v0.1.3:
    //   11. GET  /v1/admin/users         — Cognito user listing (picker)
    //   12. POST /v1/admin/cases/bulk-retry — partial-success batch retry
    //
    // Wire shapes per Phase_v0_1_3_Handback.md §3.

    // ---- 11. GET /v1/admin/users -----------------------------------------
    //
    // Honors `role_filter` (repeatable), `search` (≤64 chars), `limit`
    // (1..200, default 50), `offset` (≥0, default 0). Mirrors the v0.1.3
    // perf optimization: when no `role_filter` is supplied, returned
    // users have empty `roles` + `clinic_ids` arrays — see fixture's
    // `filterUsers()` for the full logic.
    http.get(u('/v1/admin/users'), ({ request }) => {
      const url = new URL(request.url);
      const roleFilter = url.searchParams.getAll('role_filter');
      const search = url.searchParams.get('search') ?? '';
      if (search.length > 64) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'search must be 64 characters or fewer',
          422,
        );
      }
      const limit = readNumberParam(url, 'limit', 50);
      const offset = readNumberParam(url, 'offset', 0);
      if (limit < 1 || limit > 200) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'limit must be between 1 and 200',
          422,
        );
      }
      if (offset < 0) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'offset must be ≥ 0',
          422,
        );
      }
      const { items, total } = filterUsers({
        roleFilter,
        search,
        limit,
        offset,
      });
      const responseBody: UserListResponse = {
        items,
        total,
        limit,
        offset,
      };
      return HttpResponse.json(envelope(responseBody));
    }),

    // ---- 12. POST /v1/admin/cases/bulk-retry -----------------------------
    //
    // Implements partial-success: per-case results in `items[]`, summary
    // counts, single bulk-level `correlation_id`. Status code:
    //   200 → all succeeded
    //   207 → mixed (Multi-Status; some succeeded, some failed)
    //   400 → request validation failed (size or reason length)
    //
    // Per-case error codes implemented naturally:
    //   - CASE_NOT_FOUND     — applyRetry returns NOT_FOUND
    //   - CASE_CLOSED        — applyRetry returns CONFLICT_CLOSED
    //   - DUPLICATE_IN_BATCH — second+ occurrence of a case_id in the same request
    //
    // WRONG_TENANT, CLINIC_FORBIDDEN, LEASE_CONFLICT, DATABASE_ERROR are
    // valid backend codes but cannot occur naturally in MSW (no tenant
    // model, no scheduler racing, no DB). The schema accepts them and
    // the results modal renders friendly labels for all 7; tests that
    // need them can extend `MOCK_USERS` / fixtures.
    http.post(u('/v1/admin/cases/bulk-retry'), async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as {
        case_ids?: unknown;
        reason?: unknown;
      };
      const caseIds = Array.isArray(body.case_ids)
        ? body.case_ids.filter((x): x is string => typeof x === 'string')
        : [];
      const reason = typeof body.reason === 'string' ? body.reason : '';

      // Request-level validation → 400. Matches v0.1.3 spec for malformed
      // requests; per-case errors do NOT bubble up here.
      if (caseIds.length === 0) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'case_ids must contain at least one entry',
          400,
        );
      }
      if (caseIds.length > 100) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'case_ids supports at most 100 entries per request',
          400,
        );
      }
      if (reason.length < 10 || reason.length > 1000) {
        return errorEnvelope(
          'VALIDATION_ERROR',
          'reason must be 10..1000 characters',
          400,
        );
      }

      const actor = 'mock-ops@primrose.health';
      const correlationId = `bulk-retry-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const seen = new Set<string>();
      const items: BulkRetryItem[] = [];

      for (const caseId of caseIds) {
        if (seen.has(caseId)) {
          items.push({
            case_id: caseId,
            status: 'failed',
            error_code: 'DUPLICATE_IN_BATCH',
            error_message:
              'case_id appeared more than once in the request; first occurrence processed',
          });
          continue;
        }
        seen.add(caseId);

        const res = applyRetry(caseId, reason, actor);
        if (res.ok) {
          items.push({
            case_id: caseId,
            status: 'succeeded',
            audit_id: res.audit_id,
            next_action_at: res.retried_at,
          });
        } else if (res.code === 'NOT_FOUND') {
          items.push({
            case_id: caseId,
            status: 'failed',
            error_code: 'CASE_NOT_FOUND',
            error_message: `Case ${caseId} not found`,
          });
        } else {
          // CONFLICT_CLOSED — applyRetry's only other failure mode for retry
          items.push({
            case_id: caseId,
            status: 'failed',
            error_code: 'CASE_CLOSED',
            error_message: `Case ${caseId} is already closed`,
          });
        }
      }

      const succeeded = items.filter((it) => it.status === 'succeeded').length;
      const failed = items.length - succeeded;
      const responseBody: BulkRetryResponse = {
        items,
        summary: { total: items.length, succeeded, failed },
        correlation_id: correlationId,
      };

      // 200 if all succeeded; 207 if mixed (which includes all-failed,
      // matching the v0.1.3 spec — failures are reported via per-case
      // status, not via top-level HTTP error). The fetch envelope
      // adapter treats both 200 and 207 as success because the body is
      // valid and the dispatcher reads `status` per item.
      const status = failed === 0 ? 200 : 207;
      return HttpResponse.json(envelope(responseBody), { status });
    }),
  ];
}
