/**
 * Zod schemas for Phase A action responses.
 *
 * Each schema mirrors the backend's Pydantic response model from
 * `tensaw-workflow-runtime` v0.1.2:
 *   - AdminCaseRow + PaginatedAdminCasesResponse → admin_models.py
 *   - RecentActivityRow + RecentActivityResponse → admin_models.py
 *   - StuckCaseResponse + PaginatedStuckCasesResponse → admin_models.py
 *   - CaseSnapshotResponse → models.py (CaseResponse + tasks + facts)
 *   - StepHistoryResponse + PaginatedHistoryResponse → models.py
 *   - SchedulerHealth — no Pydantic counterpart yet; shape derived from
 *     OPERATIONS_GUIDE for v0.1.2 (see "Backend integration notes" below)
 *
 * Backend deviations the MSW must mirror (per Phase_A_Handback.md):
 *   1. `trigger_type` accepts the actual v0.1.0 schema values:
 *      POLL, SIGNAL, MANUAL_ADVANCE, RECLAIM (plus v0.1.2 additions
 *      CONSOLE_RETRY, CONSOLE_CLOSE) — NOT the spec §3.2 list which
 *      conflates outcomes.
 *   2. Phase A leaves actor_subject/actor_email/console_action_type/reason
 *      as null on every recent-activity row. Wire fields are present;
 *      Phase B (v0.1.2) would populate them.
 *   3. Closed cases keep their `state_code` — `closed_at IS NOT NULL` is
 *      the indicator. Schemas reflect this.
 *
 * All schemas use `.passthrough()` only where backend explicitly uses
 * `extra='ignore'` and we want forward-compat. Default: strict-ish.
 */

import { z } from 'zod';

// ---- Enums + literals -----------------------------------------------------

/**
 * Case state codes used by the demo workflow (denial-v1).
 * The backend doesn't constrain this to an enum (workflows are
 * tenant-defined), so we accept any string and the UI uses these as
 * the canonical demo set for dropdowns.
 */
export const DEMO_STATE_CODES = [
  'NEW_DENIAL',
  'GATHER_FACESHEET',
  'DRAFTING_APPEAL',
  'APPEAL_REVIEW',
  'APPEAL_PENDING',
  'ESCALATED',
  'CLOSED',
] as const;
export type DemoStateCode = (typeof DEMO_STATE_CODES)[number];

/** Demo case types. */
export const DEMO_CASE_TYPES = ['DENIAL', 'PRIOR_AUTH', 'APPEAL'] as const;
export type DemoCaseType = (typeof DEMO_CASE_TYPES)[number];

/**
 * Trigger types accepted by the recent-activity endpoint (per
 * backend handback deviation #1). These are the actual v0.1.0
 * schema values plus v0.1.2 additions.
 */
export const TRIGGER_TYPES = [
  'POLL',
  'SIGNAL',
  'MANUAL_ADVANCE',
  'RECLAIM',
  'CONSOLE_RETRY',
  'CONSOLE_CLOSE',
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

/** Stuck-reason vocabulary from `classify_stuck_reason`. */
export const STUCK_REASONS = ['fatal_error', 'max_attempts', 'overdue'] as const;
export type StuckReason = (typeof STUCK_REASONS)[number];

/** Sort options for admin cases listing. */
export const CASE_SORT_OPTIONS = [
  'age_desc',
  'age_asc',
  'last_activity_desc',
  'case_id_asc',
] as const;
export type CaseSortOption = (typeof CASE_SORT_OPTIONS)[number];

/** Group-by options for admin cases listing. */
export const CASE_GROUP_BY_OPTIONS = [
  'state_code',
  'case_type',
  'clinic_id',
  'payer_id',
] as const;
export type CaseGroupBy = (typeof CASE_GROUP_BY_OPTIONS)[number];

// ---- Admin cases listing (GET /v1/admin/cases) ----------------------------

/**
 * Admin case row — mirrors AdminCaseRow Pydantic model.
 * One wide row per case with everything the dashboard / case list /
 * activity stream screens might need.
 */
export const AdminCaseRowSchema = z.object({
  case_id: z.string(),
  case_type: z.string(),
  workflow_name: z.string(),
  workflow_version: z.string(),
  state_code: z.string(),
  state_updated_at: z.string().datetime().nullable(),
  clinic_id: z.string().nullable(),
  payer_id: z.string().nullable(),
  owner_user_id: z.string().nullable(),
  queue_id: z.string().nullable(),
  priority_code: z.string(),
  next_action_at: z.string().datetime().nullable(),
  opened_at: z.string().datetime().nullable(),
  closed_at: z.string().datetime().nullable(),
  attempt_count: z.number().int(),
  max_attempts: z.number().int().nullable(),
  last_error_code: z.string().nullable(),
  last_error_at: z.string().datetime().nullable(),
  open_task_count: z.number().int(),
  is_stuck: z.boolean(),
  /** null when is_stuck=false; one of `fatal_error|max_attempts|overdue` otherwise. */
  stuck_reason: z.string().nullable(),
});
export type AdminCaseRow = z.infer<typeof AdminCaseRowSchema>;

export const PaginatedAdminCasesResponseSchema = z.object({
  items: z.array(AdminCaseRowSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  /**
   * Present only when the request set `group_by`. Flat
   * `{value: count}` map. The literal string `"<null>"` is the
   * server's bucket for null values (per backend handback caveat
   * "NULL bucket convention").
   */
  groups: z.record(z.string(), z.number().int()).nullable().optional(),
});
export type PaginatedAdminCasesResponse = z.infer<
  typeof PaginatedAdminCasesResponseSchema
>;

// ---- Recent activity (GET /v1/admin/recent-activity) ----------------------

/**
 * Recent activity row — mirrors RecentActivityRow Pydantic model.
 * Phase A leaves actor_subject / actor_email / console_action_type / reason
 * as null on every row (per backend handback deviation #2). Wire fields
 * are present so Phase B can populate without a schema break.
 */
export const RecentActivityRowSchema = z.object({
  history_id: z.number().int(),
  case_id: z.string(),
  case_type: z.string().nullable(),
  clinic_id: z.string().nullable(),
  occurred_at: z.string().datetime().nullable(),
  state_code_from: z.string().nullable(),
  state_code_to: z.string().nullable(),
  trigger_type: z.string(),
  trigger_outcome: z.string().nullable(),
  handler_key: z.string().nullable(),
  actor_subject: z.string().nullable(),
  actor_email: z.string().nullable(),
  console_action_type: z.string().nullable(),
  reason: z.string().nullable(),
  correlation_id: z.string().nullable(),
});
export type RecentActivityRow = z.infer<typeof RecentActivityRowSchema>;

export const RecentActivityResponseSchema = z.object({
  items: z.array(RecentActivityRowSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  /**
   * Absolute timestamp the time-window filter resolved to. Lets the
   * UI display "since 14:32 UTC" without re-parsing the duration.
   */
  since: z.string().datetime(),
});
export type RecentActivityResponse = z.infer<typeof RecentActivityResponseSchema>;

// ---- Stuck cases (GET /v1/admin/stuck-cases) ------------------------------

/**
 * Stuck case row — mirrors StuckCaseResponse Pydantic model.
 * A case is stuck when:
 *   - last_error_retryable=False (terminal failure), OR
 *   - attempt_count >= max_attempts, OR
 *   - next_action_at > 1 hour in the past on an open case.
 */
export const StuckCaseRowSchema = z.object({
  case_id: z.string(),
  case_type: z.string(),
  state_code: z.string(),
  attempt_count: z.number().int(),
  max_attempts: z.number().int().nullable(),
  last_error_code: z.string().nullable(),
  last_error_source: z.string().nullable(),
  last_error_retryable: z.boolean().nullable(),
  next_action_at: z.string().datetime().nullable(),
  opened_at: z.string().datetime().nullable(),
  /** One of `fatal_error|max_attempts|overdue`. */
  stuck_reason: z.string(),
});
export type StuckCaseRow = z.infer<typeof StuckCaseRowSchema>;

export const StuckCasesResponseSchema = z.object({
  items: z.array(StuckCaseRowSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
});
export type StuckCasesResponse = z.infer<typeof StuckCasesResponseSchema>;

// ---- Case detail (GET /v1/cases/{case_id}) --------------------------------

/**
 * Case row — mirrors CaseResponse from runtime models.py. Wider than
 * AdminCaseRow because it includes the full set of fields the case
 * detail screen needs (substate, step, identifiers, etc.).
 */
export const CaseDetailCaseSchema = z.object({
  case_id: z.string(),
  case_type: z.string(),
  workflow_name: z.string(),
  workflow_version: z.string().nullable(),
  state_code: z.string(),
  substate_code: z.string().nullable(),
  step_code: z.string().nullable(),
  clinic_id: z.string().nullable(),
  facility_id: z.string().nullable(),
  provider_id: z.string().nullable(),
  payer_id: z.string().nullable(),
  patient_id: z.string().nullable(),
  claim_id: z.string().nullable(),
  priority_code: z.string().nullable(),
  queue_id: z.string().nullable(),
  owner_user_id: z.string().nullable(),
  owner_user_name: z.string().nullable(),
  next_action_at: z.string().datetime().nullable(),
  due_at: z.string().datetime().nullable(),
  opened_at: z.string().datetime().nullable(),
  closed_at: z.string().datetime().nullable(),
  attempt_count: z.number().int(),
  max_attempts: z.number().int().nullable(),
  last_error_code: z.string().nullable(),
  last_error_source: z.string().nullable(),
  last_error_retryable: z.boolean().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});
export type CaseDetailCase = z.infer<typeof CaseDetailCaseSchema>;

/** Open task — mirrors TaskResponse from runtime models.py. */
export const TaskSchema = z.object({
  task_id: z.string(),
  case_id: z.string(),
  task_type: z.string(),
  intent_key: z.string(),
  state_code: z.string(),
  substate_code: z.string().nullable(),
  handler_key: z.string().nullable(),
  handler_version: z.string().nullable(),
  queue_id: z.string().nullable(),
  priority_code: z.string().nullable(),
  priority_rank: z.number().int().nullable(),
  opened_at: z.string().datetime().nullable(),
  due_at: z.string().datetime().nullable(),
  closed_at: z.string().datetime().nullable(),
  next_action_at: z.string().datetime().nullable(),
  close_reason_code: z.string().nullable(),
  attempt_count: z.number().int(),
});
export type Task = z.infer<typeof TaskSchema>;

/**
 * Fact row — mirrors FactResponse from runtime models.py.
 * The four typed value columns are exposed; the UI picks the one
 * matching the declared fact type.
 */
export const FactSchema = z.object({
  fact_key: z.string(),
  fact_value_str: z.string().nullable(),
  fact_value_num: z.number().nullable(),
  fact_value_bool: z.boolean().nullable(),
  fact_value_date: z.string().datetime().nullable(),
  /** Provenance: LLM / SYSTEM / ERA / USER (per BRD §2.4 wireframe). */
  source: z.string().nullable(),
  updated_at: z.string().datetime().nullable(),
});
export type Fact = z.infer<typeof FactSchema>;

/** Case detail response — mirrors CaseSnapshotResponse. */
export const CaseDetailResponseSchema = z.object({
  case: CaseDetailCaseSchema,
  tasks: z.array(TaskSchema),
  facts: z.array(FactSchema),
});
export type CaseDetailResponse = z.infer<typeof CaseDetailResponseSchema>;

// ---- Case history (GET /v1/cases/{case_id}/history) -----------------------

/**
 * Step history row — mirrors StepHistoryResponse from runtime models.py.
 * One row per state transition / handler invocation.
 */
export const StepHistoryRowSchema = z.object({
  step_history_id: z.number().int(),
  case_id: z.string(),
  task_id: z.string().nullable(),
  correlation_id: z.string(),
  trigger_type: z.string(),
  handler_key: z.string().nullable(),
  handler_version: z.string().nullable(),
  state_before: z.string().nullable(),
  state_after: z.string().nullable(),
  outcome_code: z.string().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  started_at: z.string().datetime().nullable(),
  ended_at: z.string().datetime().nullable(),
});
export type StepHistoryRow = z.infer<typeof StepHistoryRowSchema>;

export const CaseHistoryResponseSchema = z.object({
  items: z.array(StepHistoryRowSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
});
export type CaseHistoryResponse = z.infer<typeof CaseHistoryResponseSchema>;

// ---- Scheduler health (GET /v1/health/scheduler) --------------------------

/**
 * Scheduler health — shape derived from OPERATIONS_GUIDE.
 * No Pydantic counterpart was available in the v0.1.2 tarball at the
 * level of detail other endpoints provide; if the real backend ships
 * additional fields, the schema is forward-compatible because zod
 * by default ignores unknown keys (we don't `.strict()`).
 *
 * Frontend uses this for the Dashboard's "Polling lag" KPI card.
 */
export const SchedulerHealthSchema = z.object({
  /** Last poll timestamp (UTC ISO-8601). */
  last_poll_at: z.string().datetime().nullable(),
  /** Polling lag in seconds. The KPI threshold is configurable. */
  polling_lag_seconds: z.number().nullable(),
  /** Active leases held by handlers. */
  active_lease_count: z.number().int(),
  /** Runtime version reporting status. */
  version: z.string(),
  /** Overall status hint. */
  status: z.enum(['healthy', 'degraded', 'down']),
});
export type SchedulerHealth = z.infer<typeof SchedulerHealthSchema>;

// ===========================================================================
// Phase B — mutation schemas (Tier 2)
// ===========================================================================
//
// Mirrors backend `tensaw-workflow-runtime` v0.1.2 RetryActionRequest /
// RetryActionResponse / CloseActionRequest / CloseActionResponse Pydantic
// models from `admin_models.py`, plus the v0.1.0-carryover advance and
// owner-update endpoints at `/v1/cases/{case_id}/...`.
//
// Authoritative sources (which override the kickoff prose in two places):
//   - Backend tech spec §3.3 (retry) and §3.4 (close)
//   - Phase B backend handback "Decisions made under kickoff authority"
//     table — `terminal_state_code` was NOT implemented; close uses
//     `close_reason_code` from a 5-value vocabulary instead.
//   - BRD §3.8 (permissions matrix)
//
// Reason validation: 10..1000 chars per spec §3.3 / Phase B handback
// (NOT 1..512 as the kickoff §3 prose suggested).
//
// Response shapes follow the spec's "before/after snapshot" pattern. All
// four mutations return `case_id`, optional `before`/`after` partials,
// `audit_id`, an `at` timestamp, and the actor email; the snapshot fields
// are loose (`.passthrough()`) so backend can add fields without a schema
// break.

// ---- Close reason vocabulary (backend tech spec §3.4) ---------------------

/**
 * Allowed values for `close_reason_code` on `POST /v1/admin/cases/{id}/close`.
 * Backend stores this in `rcm_case.last_error_code` (column reuse per
 * ADR-OC-3); the column will be split in v0.2 if operators want a clean
 * `close_reason_code` column. See backend tech spec §3.4 + Phase B handback.
 */
export const CLOSE_REASON_CODES = [
  'MANUAL_CLOSE_OPS',
  'DUPLICATE',
  'INVALID_DATA',
  'CUSTOMER_WITHDRAWN',
  'OTHER',
] as const;
export type CloseReasonCode = (typeof CLOSE_REASON_CODES)[number];

/** Human-readable labels for the close reason dropdown. Keep tight. */
export const CLOSE_REASON_LABELS: Record<CloseReasonCode, string> = {
  MANUAL_CLOSE_OPS: 'Operational decision',
  DUPLICATE: 'Duplicate of another case',
  INVALID_DATA: 'Invalid upstream data',
  CUSTOMER_WITHDRAWN: 'Customer withdrew the request',
  OTHER: 'Other (explain in reason)',
};

// ---- Common before/after snapshot ----------------------------------------

/**
 * Mutation responses include a partial snapshot of the case before/after
 * the mutation. Field set varies per action (retry shows last_error_*;
 * close shows closed_at; reassign shows owner_user_id). Use passthrough
 * so any new fields the backend adds round-trip cleanly.
 */
const CaseSnapshotSchema = z
  .object({
    state_code: z.string().optional(),
    next_action_at: z.string().datetime().nullable().optional(),
    last_error_code: z.string().nullable().optional(),
    last_error_at: z.string().datetime().nullable().optional(),
    attempt_count: z.number().int().optional(),
    closed_at: z.string().datetime().nullable().optional(),
    owner_user_id: z.string().nullable().optional(),
  })
  .passthrough();
export type CaseSnapshot = z.infer<typeof CaseSnapshotSchema>;

// ---- Reason field constraint (shared by all 4 mutations) ------------------

/** Reason validation: 10..1000 chars per backend v0.1.2 spec §3.3. */
const ReasonSchema = z
  .string()
  .min(10, 'Reason must be at least 10 characters.')
  .max(1000, 'Reason must be 1000 characters or fewer.');

/**
 * Optional reason: undefined OR empty string OR 10..1000 chars. The empty-
 * string allowance is for forms whose default value is `''`; the modal
 * normalizes empty/whitespace to undefined before dispatching so the
 * backend sees no field. Used by advance + reassign.
 */
const OptionalReasonSchema = z
  .string()
  .max(1000, 'Reason must be 1000 characters or fewer.')
  .refine(
    (s) => s.length === 0 || s.length >= 10,
    'Reason must be at least 10 characters when provided.',
  )
  .optional();

// ---- Retry: POST /v1/admin/cases/{case_id}/retry --------------------------

export const RetryCaseRequestSchema = z.object({
  case_id: z.string().min(1),
  reason: ReasonSchema,
});
export type RetryCaseRequest = z.infer<typeof RetryCaseRequestSchema>;

export const RetryCaseResponseSchema = z.object({
  case_id: z.string(),
  before: CaseSnapshotSchema,
  after: CaseSnapshotSchema,
  audit_id: z.number().int(),
  retried_at: z.string().datetime(),
  retried_by: z.string(),
});
export type RetryCaseResponse = z.infer<typeof RetryCaseResponseSchema>;

// ---- Close: POST /v1/admin/cases/{case_id}/close --------------------------

export const CloseCaseRequestSchema = z.object({
  case_id: z.string().min(1),
  /**
   * Per backend Phase B handback: `close_reason_code` is required (5-value
   * vocab, see CLOSE_REASON_CODES above). The kickoff snippet's
   * `terminal_state_code?: string` was rejected at the spec level — close
   * does NOT change `state_code`; ADR-OC-3 keeps the existing state and
   * uses `closed_at IS NOT NULL` as the "is closed" indicator.
   */
  close_reason_code: z.enum(CLOSE_REASON_CODES),
  reason: ReasonSchema,
});
export type CloseCaseRequest = z.infer<typeof CloseCaseRequestSchema>;

export const CloseCaseResponseSchema = z.object({
  case_id: z.string(),
  before: CaseSnapshotSchema,
  after: CaseSnapshotSchema,
  audit_id: z.number().int(),
  closed_at: z.string().datetime(),
  closed_by: z.string(),
});
export type CloseCaseResponse = z.infer<typeof CloseCaseResponseSchema>;

// ---- Advance: POST /v1/cases/{case_id}/advance ----------------------------
//
// Force-advance is a v0.1.0 carryover endpoint at the case CRUD path
// (NOT /v1/admin/cases/...). The reason field is optional per kickoff;
// when provided it gets the same 10..1000 validation as retry/close.

export const AdvanceCaseRequestSchema = z.object({
  case_id: z.string().min(1),
  reason: OptionalReasonSchema,
});
export type AdvanceCaseRequest = z.infer<typeof AdvanceCaseRequestSchema>;

export const AdvanceCaseResponseSchema = z.object({
  case_id: z.string(),
  before: CaseSnapshotSchema,
  after: CaseSnapshotSchema,
  audit_id: z.number().int(),
  advanced_at: z.string().datetime(),
  advanced_by: z.string(),
});
export type AdvanceCaseResponse = z.infer<typeof AdvanceCaseResponseSchema>;

// ---- Reassign: PATCH /v1/cases/{case_id}/owner ---------------------------
//
// Owner-update is a v0.1.0 carryover endpoint. `new_owner_user_id` is
// the user id (typically email) that the case is reassigned to; passing
// `null` unassigns. Reason is optional.

export const ReassignOwnerRequestSchema = z.object({
  case_id: z.string().min(1),
  new_owner_user_id: z.string().nullable(),
  reason: OptionalReasonSchema,
});
export type ReassignOwnerRequest = z.infer<typeof ReassignOwnerRequestSchema>;

export const ReassignOwnerResponseSchema = z.object({
  case_id: z.string(),
  before: CaseSnapshotSchema,
  after: CaseSnapshotSchema,
  audit_id: z.number().int(),
  reassigned_at: z.string().datetime(),
  reassigned_by: z.string(),
});
export type ReassignOwnerResponse = z.infer<typeof ReassignOwnerResponseSchema>;

// ===========================================================================
// Phase B slice 2 — v0.1.3-dependent schemas
// ===========================================================================
//
// Mirrors the wire shapes documented in `Phase_v0_1_3_Handback.md` §3.1–§3.2:
//   - GET /v1/admin/users        → UserListResponse
//   - POST /v1/admin/cases/bulk-retry → BulkRetryResponse
//
// These schemas reuse the slice 1 internal helpers `ReasonSchema` and
// `CaseSnapshotSchema` (defined above) — co-locating the slice 2 bulk-retry
// schema in this file means the 10..1000 char reason validation stays in
// one place and we don't need to widen the helper's visibility.
//
// IMPORTANT — perf-optimization caveat for `admin.list-users`:
// when a tenant-wide caller passes no `role_filter`, the v0.1.3 backend
// skips per-user Cognito group hydration and returns `roles=[]` and
// `clinic_ids=[]` for every user (Phase_v0_1_3_Handback §6 review item #2).
// The schema permits empty arrays unconditionally; the caller decides
// whether to pass `role_filter` to force hydration. Slice 2's
// ReassignOwnerModal passes `role_filter` so role badges render correctly.

// ---- User listing (GET /v1/admin/users) ----------------------------------

export const UserListItemSchema = z.object({
  /** Cognito 'sub' claim. Stable per identity. */
  user_id: z.string(),
  email: z.string(),
  display_name: z.string().nullable(),
  /**
   * Foundation Role enum names. EMPTY when the request was tenant-wide
   * AND no `role_filter` was supplied (perf optimization — see header
   * comment above).
   */
  roles: z.array(z.string()),
  /** Clinic ids the user belongs to. Empty under the same fast-path condition. */
  clinic_ids: z.array(z.string()),
  is_active: z.boolean(),
});
export type UserListItem = z.infer<typeof UserListItemSchema>;

export const UserListResponseSchema = z.object({
  items: z.array(UserListItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type UserListResponse = z.infer<typeof UserListResponseSchema>;

// ---- Bulk retry (POST /v1/admin/cases/bulk-retry) -------------------------

/**
 * Per-case error codes returned in `BulkRetryItem.error_code` when a
 * case in the batch fails. Spec: Phase_v0_1_3_Handback §3.5 + kickoff §
 * "v0.1.3 backend wire shapes".
 *
 *   - CASE_NOT_FOUND    — case does not exist
 *   - WRONG_TENANT      — case belongs to a different tenant (defense-in-depth)
 *   - CLINIC_FORBIDDEN  — caller not authorized for case's clinic
 *   - CASE_CLOSED       — case is closed; cannot be retried
 *   - LEASE_CONFLICT    — case currently being processed; try again
 *   - DATABASE_ERROR    — internal error; sanitized message
 *   - DUPLICATE_IN_BATCH — case_id appeared more than once; first occurrence
 *                         processed, subsequent flagged without re-execution
 */
export const BULK_RETRY_ERROR_CODES = [
  'CASE_NOT_FOUND',
  'WRONG_TENANT',
  'CLINIC_FORBIDDEN',
  'CASE_CLOSED',
  'LEASE_CONFLICT',
  'DATABASE_ERROR',
  'DUPLICATE_IN_BATCH',
] as const;
export type BulkRetryErrorCode = (typeof BULK_RETRY_ERROR_CODES)[number];

export const BulkRetryErrorCodeSchema = z.enum(BULK_RETRY_ERROR_CODES);

/** Friendly labels for the per-case error codes. Used in the results modal. */
export const BULK_RETRY_ERROR_LABELS: Record<BulkRetryErrorCode, string> = {
  CASE_NOT_FOUND: 'Case not found',
  WRONG_TENANT: 'Case belongs to a different tenant',
  CLINIC_FORBIDDEN: 'Not authorized for this case\u2019s clinic',
  CASE_CLOSED: 'Case is already closed',
  LEASE_CONFLICT: 'Case is being processed; try again',
  DATABASE_ERROR: 'Internal error',
  DUPLICATE_IN_BATCH: 'Duplicate case_id in request',
};

/**
 * Request: 1..100 case_ids, 10..1000 char reason. The frontend should
 * dedup before sending; the backend defends against missed dedup by
 * returning DUPLICATE_IN_BATCH for second+ occurrences.
 */
export const BulkRetryRequestSchema = z.object({
  case_ids: z
    .array(z.string().min(1))
    .min(1, 'Select at least one case to retry.')
    .max(100, 'Bulk retry supports at most 100 cases per request.'),
  reason: ReasonSchema,
});
export type BulkRetryRequest = z.infer<typeof BulkRetryRequestSchema>;

/**
 * Per-case result. `next_action_at`/`audit_id` are populated when
 * `status='succeeded'`; `error_code`/`error_message` are populated when
 * `status='failed'`. Backend may include additional fields in future;
 * we accept unknown fields by NOT calling `.strict()`.
 */
export const BulkRetryItemSchema = z.object({
  case_id: z.string(),
  status: z.enum(['succeeded', 'failed']),
  next_action_at: z.string().datetime().optional(),
  audit_id: z.number().int().optional(),
  error_code: BulkRetryErrorCodeSchema.optional(),
  error_message: z.string().optional(),
});
export type BulkRetryItem = z.infer<typeof BulkRetryItemSchema>;

export const BulkRetrySummarySchema = z.object({
  total: z.number().int(),
  succeeded: z.number().int(),
  failed: z.number().int(),
});
export type BulkRetrySummary = z.infer<typeof BulkRetrySummarySchema>;

export const BulkRetryResponseSchema = z.object({
  items: z.array(BulkRetryItemSchema),
  summary: BulkRetrySummarySchema,
  /** Bulk-operation correlation id; per-case audit rows share it. */
  correlation_id: z.string(),
});
export type BulkRetryResponse = z.infer<typeof BulkRetryResponseSchema>;
