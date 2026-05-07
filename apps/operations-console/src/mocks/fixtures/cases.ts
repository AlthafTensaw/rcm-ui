/**
 * MSW fixtures — 62 cases for design-validation walkthrough.
 *
 * Per BRD §2.8: 12 curated scenarios + 50 filler cases distributed
 * across all states. The 12 curated scenarios are the ones used in
 * stakeholder design walkthroughs.
 *
 * The fixtures are generated deterministically (no random IDs) so
 * tests can assert specific scenarios. `resetMockAdminState()` rebuilds
 * the in-memory dataset between tests.
 */

import type {
  AdminCaseRow,
  CaseDetailResponse,
  Fact,
  RecentActivityRow,
  StepHistoryRow,
  StuckCaseRow,
  Task,
} from '../../actions/schemas';

// ---- Time anchors ---------------------------------------------------------

/**
 * Anchor "now" for fixture timestamps. Pinned to 2026-05-04T12:00:00Z
 * so test assertions about ages don't drift over time.
 */
export const FIXTURE_NOW_ISO = '2026-05-04T12:00:00.000Z';
const NOW_MS = Date.parse(FIXTURE_NOW_ISO);

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function isoAgo(ms: number): string {
  return new Date(NOW_MS - ms).toISOString();
}

function isoFromNow(ms: number): string {
  return new Date(NOW_MS + ms).toISOString();
}

// ---- The 12 curated scenarios ---------------------------------------------

interface Scenario {
  case_id: string;
  case_type: string;
  state_code: string;
  ageMs: number;
  clinic_id: string;
  payer_id: string;
  owner_user_id: string | null;
  attempt_count: number;
  max_attempts: number;
  is_stuck: boolean;
  stuck_reason: string | null;
  last_error_code: string | null;
  last_error_retryable: boolean | null;
  closed_at: string | null;
  next_action_offset_ms: number | null;
  annotation: string;
}

const SCENARIOS: Scenario[] = [
  {
    case_id: 'case-001',
    case_type: 'DENIAL',
    state_code: 'NEW_DENIAL',
    ageMs: 5 * MIN,
    clinic_id: 'clinic-001',
    payer_id: 'BCBS-IL',
    owner_user_id: null,
    attempt_count: 0,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 30 * MIN,
    annotation: 'Newly opened denial, fresh',
  },
  {
    case_id: 'case-002',
    case_type: 'DENIAL',
    state_code: 'GATHER_FACESHEET',
    ageMs: 4 * HOUR,
    clinic_id: 'clinic-001',
    payer_id: 'AETNA',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 1,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 2 * HOUR,
    annotation: 'Triaged, gathering records',
  },
  {
    case_id: 'case-003',
    case_type: 'DENIAL',
    state_code: 'DRAFTING_APPEAL',
    ageMs: 1 * DAY,
    clinic_id: 'clinic-002',
    payer_id: 'UHC',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 1,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 4 * HOUR,
    annotation: 'Drafting first appeal',
  },
  {
    case_id: 'case-004',
    case_type: 'DENIAL',
    state_code: 'APPEAL_REVIEW',
    ageMs: 8 * HOUR,
    clinic_id: 'clinic-001',
    payer_id: 'BCBS-IL',
    owner_user_id: 'reviewer@primrose.health',
    attempt_count: 1,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 12 * HOUR,
    annotation: 'Awaiting human review',
  },
  {
    case_id: 'case-005',
    case_type: 'DENIAL',
    state_code: 'DRAFTING_APPEAL',
    ageMs: 2 * DAY,
    clinic_id: 'clinic-002',
    payer_id: 'CIGNA',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 3,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 6 * HOUR,
    annotation: 'Rejected by reviewer, re-drafting (draft v3)',
  },
  {
    case_id: 'case-006',
    case_type: 'DENIAL',
    state_code: 'APPEAL_PENDING',
    ageMs: 5 * DAY,
    clinic_id: 'clinic-001',
    payer_id: 'BCBS-IL',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 1,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 2 * DAY,
    annotation: 'Submitted, awaiting payer',
  },
  {
    case_id: 'case-007',
    case_type: 'DENIAL',
    state_code: 'APPEAL_PENDING',
    ageMs: 14 * DAY,
    clinic_id: 'clinic-001',
    payer_id: 'AETNA',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 2,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 1 * DAY,
    annotation: 'Long-pending escalation candidate',
  },
  {
    case_id: 'case-008',
    case_type: 'DENIAL',
    state_code: 'ESCALATED',
    ageMs: 1 * DAY,
    clinic_id: 'clinic-002',
    payer_id: 'UHC',
    owner_user_id: 'coordinator@primrose.health',
    attempt_count: 1,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    next_action_offset_ms: 8 * HOUR,
    annotation: 'Escalated to coordinator',
  },
  {
    case_id: 'case-009',
    case_type: 'DENIAL',
    state_code: 'CLOSED',
    ageMs: 7 * DAY,
    clinic_id: 'clinic-001',
    payer_id: 'BCBS-IL',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 2,
    max_attempts: 5,
    is_stuck: false,
    stuck_reason: null,
    last_error_code: null,
    last_error_retryable: null,
    // closed 2 days ago
    closed_at: isoAgo(2 * DAY),
    next_action_offset_ms: null,
    annotation: 'Successfully closed (last week)',
  },
  // ---- The 3 stuck scenarios ----
  {
    case_id: 'case-010',
    case_type: 'DENIAL',
    state_code: 'DRAFTING_APPEAL',
    ageMs: 4 * DAY,
    clinic_id: 'clinic-002',
    payer_id: 'CIGNA',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 2,
    max_attempts: 5,
    is_stuck: true,
    stuck_reason: 'fatal_error',
    last_error_code: 'PHI_REDACTION_FAILED',
    last_error_retryable: false,
    closed_at: null,
    next_action_offset_ms: -2 * HOUR,
    annotation: 'STUCK — fatal error (PHI redaction)',
  },
  {
    case_id: 'case-011',
    case_type: 'DENIAL',
    state_code: 'APPEAL_PENDING',
    ageMs: 2 * DAY,
    clinic_id: 'clinic-001',
    payer_id: 'AETNA',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 5,
    max_attempts: 5,
    is_stuck: true,
    stuck_reason: 'max_attempts',
    last_error_code: 'PAYER_TIMEOUT',
    last_error_retryable: true,
    closed_at: null,
    next_action_offset_ms: -1 * HOUR,
    annotation: 'STUCK — max attempts exhausted',
  },
  {
    case_id: 'case-012',
    case_type: 'DENIAL',
    state_code: 'GATHER_FACESHEET',
    ageMs: 5 * DAY,
    clinic_id: 'clinic-001',
    payer_id: 'BCBS-IL',
    owner_user_id: 'coder@primrose.health',
    attempt_count: 3,
    max_attempts: 5,
    is_stuck: true,
    stuck_reason: 'overdue',
    last_error_code: null,
    last_error_retryable: null,
    closed_at: null,
    // 5 days overdue per BRD spec
    next_action_offset_ms: -5 * DAY,
    annotation: 'STUCK — overdue (no error logged)',
  },
];

// ---- Filler generation ----------------------------------------------------

const FILLER_STATES = [
  'NEW_DENIAL',
  'GATHER_FACESHEET',
  'DRAFTING_APPEAL',
  'APPEAL_REVIEW',
  'APPEAL_PENDING',
  'ESCALATED',
] as const;

const FILLER_PAYERS = ['BCBS-IL', 'AETNA', 'UHC', 'CIGNA', 'HUMANA'];
const FILLER_CLINICS = ['clinic-001', 'clinic-002', 'clinic-003'];
const FILLER_OWNERS = [
  'coder@primrose.health',
  'reviewer@primrose.health',
  'coordinator@primrose.health',
  null, // unassigned
];

/** Generate 50 filler cases distributed across non-closed states. */
function generateFillerScenarios(): Scenario[] {
  const out: Scenario[] = [];
  for (let i = 0; i < 50; i++) {
    const idx = i + 13;
    const stateIdx = i % FILLER_STATES.length;
    const ageHours = 1 + (i * 7) % 96; // 1..96 hours, deterministic
    out.push({
      case_id: `case-${String(idx).padStart(3, '0')}`,
      case_type: i % 5 === 0 ? 'PRIOR_AUTH' : 'DENIAL',
      // Modular index into a fixed-length tuple is always valid, but
      // `noUncheckedIndexedAccess` widens to `T | undefined`. Provide
      // explicit fallbacks to keep the lint rule happy.
      state_code: FILLER_STATES[stateIdx] ?? 'NEW_DENIAL',
      ageMs: ageHours * HOUR,
      clinic_id: FILLER_CLINICS[i % FILLER_CLINICS.length] ?? 'clinic-001',
      payer_id: FILLER_PAYERS[i % FILLER_PAYERS.length] ?? 'BCBS-IL',
      owner_user_id: FILLER_OWNERS[i % FILLER_OWNERS.length] ?? null,
      attempt_count: i % 4,
      max_attempts: 5,
      is_stuck: false,
      stuck_reason: null,
      last_error_code: null,
      last_error_retryable: null,
      closed_at: null,
      next_action_offset_ms: ((i % 24) + 1) * HOUR,
      annotation: 'Filler case',
    });
  }
  return out;
}

// ---- Build the AdminCaseRow projections ----------------------------------

function scenarioToAdminRow(s: Scenario): AdminCaseRow {
  return {
    case_id: s.case_id,
    case_type: s.case_type,
    workflow_name: 'denial-v1',
    workflow_version: 'v1',
    state_code: s.state_code,
    state_updated_at: isoAgo(s.ageMs),
    clinic_id: s.clinic_id,
    payer_id: s.payer_id,
    owner_user_id: s.owner_user_id,
    queue_id: null,
    priority_code: 'normal',
    next_action_at:
      s.next_action_offset_ms === null
        ? null
        : isoFromNow(s.next_action_offset_ms),
    opened_at: isoAgo(s.ageMs),
    closed_at: s.closed_at,
    attempt_count: s.attempt_count,
    max_attempts: s.max_attempts,
    last_error_code: s.last_error_code,
    last_error_at: s.last_error_code ? isoAgo(Math.max(s.ageMs / 4, MIN)) : null,
    open_task_count:
      s.state_code === 'CLOSED' ? 0 : ((s.case_id.charCodeAt(7) % 4) + 1),
    is_stuck: s.is_stuck,
    stuck_reason: s.stuck_reason,
  };
}

function scenarioToStuckRow(s: Scenario): StuckCaseRow {
  return {
    case_id: s.case_id,
    case_type: s.case_type,
    state_code: s.state_code,
    attempt_count: s.attempt_count,
    max_attempts: s.max_attempts,
    last_error_code: s.last_error_code,
    last_error_source: s.last_error_code ? 'handler' : null,
    last_error_retryable: s.last_error_retryable,
    next_action_at:
      s.next_action_offset_ms === null
        ? null
        : isoFromNow(s.next_action_offset_ms),
    opened_at: isoAgo(s.ageMs),
    stuck_reason: s.stuck_reason ?? 'overdue',
  };
}

// ---- Recent activity (synthetic step_history) -----------------------------

/**
 * Generate synthetic recent-activity rows. Produces a mix of POLL/SIGNAL
 * trigger types over the last 24h, including one CONSOLE_RETRY entry for
 * design walkthrough (with actor fields populated to demo Phase B's UI).
 */
function generateRecentActivity(scenarios: Scenario[]): RecentActivityRow[] {
  const out: RecentActivityRow[] = [];
  let id = 9_000_000;

  let i = 0;
  for (const s of scenarios) {
    if (s.state_code === 'CLOSED') {
      i++;
      continue;
    }

    // One transition per case showing how it got to its current state
    out.push({
      history_id: id++,
      case_id: s.case_id,
      case_type: s.case_type,
      clinic_id: s.clinic_id,
      occurred_at: isoAgo(s.ageMs / 2),
      state_code_from: 'NEW_DENIAL',
      state_code_to: s.state_code === 'NEW_DENIAL' ? null : s.state_code,
      trigger_type: i % 7 === 0 ? 'SIGNAL' : 'POLL',
      trigger_outcome: s.is_stuck ? 'FATAL' : 'SUCCESS',
      handler_key: 'workflow_advance',
      // Phase A leaves these null per backend handback deviation #2
      actor_subject: null,
      actor_email: null,
      console_action_type: null,
      reason: null,
      correlation_id: `corr-${s.case_id}-1`,
    });
    i++;
  }

  // One CONSOLE_RETRY example (note: in real Phase A the actor fields
  // would be null, but we populate them here so the Phase B UI work has
  // visual reference data when it lands)
  out.push({
    history_id: id++,
    case_id: 'case-011',
    case_type: 'DENIAL',
    clinic_id: 'clinic-001',
    occurred_at: isoAgo(30 * MIN),
    state_code_from: 'APPEAL_PENDING',
    state_code_to: 'APPEAL_PENDING',
    trigger_type: 'CONSOLE_RETRY',
    trigger_outcome: 'SUCCESS',
    handler_key: null,
    actor_subject: 'sub-ops-1',
    actor_email: 'ops@primrose.health',
    console_action_type: 'RETRY',
    reason: 'manual nudge after payer reported delay',
    correlation_id: 'corr-case-011-retry-1',
  });

  // Sort newest first
  out.sort((a, b) => {
    const at = a.occurred_at ?? '';
    const bt = b.occurred_at ?? '';
    return bt.localeCompare(at);
  });
  return out;
}

// ---- Case detail materialization -----------------------------------------

function scenarioToCaseDetail(s: Scenario): CaseDetailResponse {
  const tasks: Task[] = [];
  const taskCount = s.state_code === 'CLOSED' ? 0 : ((s.case_id.charCodeAt(7) % 4) + 1);
  for (let i = 0; i < taskCount; i++) {
    tasks.push({
      task_id: `${s.case_id}-task-${i + 1}`,
      case_id: s.case_id,
      task_type: i === 0 ? 'GATHER_RECORDS' : 'DRAFT_LETTER',
      intent_key: `${s.state_code.toLowerCase()}_step_${i + 1}`,
      state_code: 'OPEN',
      substate_code: null,
      handler_key: 'workflow_advance',
      handler_version: 'v1',
      queue_id: null,
      priority_code: 'normal',
      priority_rank: 100 + i,
      opened_at: isoAgo(s.ageMs / 2),
      due_at: isoFromNow(2 * DAY),
      closed_at: null,
      next_action_at: isoFromNow(2 * HOUR),
      close_reason_code: null,
      attempt_count: i,
    });
  }

  const facts: Fact[] = [
    {
      fact_key: 'patient_id',
      fact_value_str: '[redacted-PHI]',
      fact_value_num: null,
      fact_value_bool: null,
      fact_value_date: null,
      source: 'SYSTEM',
      updated_at: isoAgo(s.ageMs),
    },
    {
      fact_key: 'denial_reason_code',
      fact_value_str: '197 — Precert/auth required',
      fact_value_num: null,
      fact_value_bool: null,
      fact_value_date: null,
      source: 'ERA',
      updated_at: isoAgo(s.ageMs),
    },
    {
      fact_key: 'billed_amount',
      fact_value_str: null,
      fact_value_num: 4250.0,
      fact_value_bool: null,
      fact_value_date: null,
      source: 'ERA',
      updated_at: isoAgo(s.ageMs),
    },
    {
      fact_key: 'has_medical_necessity_letter',
      fact_value_str: null,
      fact_value_num: null,
      fact_value_bool: s.attempt_count > 0,
      fact_value_date: null,
      source: 'LLM',
      updated_at: isoAgo(s.ageMs / 4),
    },
  ];

  return {
    case: {
      case_id: s.case_id,
      case_type: s.case_type,
      workflow_name: 'denial-v1',
      workflow_version: 'v1',
      state_code: s.state_code,
      substate_code: null,
      step_code: null,
      clinic_id: s.clinic_id,
      facility_id: 'facility-1',
      provider_id: 'provider-1',
      payer_id: s.payer_id,
      patient_id: '[redacted-PHI]',
      claim_id: `claim-${s.case_id}`,
      priority_code: 'normal',
      queue_id: null,
      owner_user_id: s.owner_user_id,
      owner_user_name: s.owner_user_id?.split('@')[0] ?? null,
      next_action_at:
        s.next_action_offset_ms === null
          ? null
          : isoFromNow(s.next_action_offset_ms),
      due_at: isoFromNow(2 * DAY),
      opened_at: isoAgo(s.ageMs),
      closed_at: s.closed_at,
      attempt_count: s.attempt_count,
      max_attempts: s.max_attempts,
      last_error_code: s.last_error_code,
      last_error_source: s.last_error_code ? 'handler' : null,
      last_error_retryable: s.last_error_retryable,
      created_at: isoAgo(s.ageMs),
      updated_at: isoAgo(s.ageMs / 2),
    },
    tasks,
    facts,
  };
}

function scenarioToHistory(s: Scenario): StepHistoryRow[] {
  const out: StepHistoryRow[] = [];
  let id = 10_000 + Number(s.case_id.replace('case-', ''));
  // Open transition
  out.push({
    step_history_id: id++,
    case_id: s.case_id,
    task_id: null,
    correlation_id: `corr-${s.case_id}-open`,
    trigger_type: 'POLL',
    handler_key: 'case_open',
    handler_version: 'v1',
    state_before: null,
    state_after: 'NEW_DENIAL',
    outcome_code: 'SUCCESS',
    error_code: null,
    error_message: null,
    started_at: isoAgo(s.ageMs),
    ended_at: isoAgo(s.ageMs - 1000),
  });
  // Mid transition (if not still NEW_DENIAL)
  if (s.state_code !== 'NEW_DENIAL') {
    out.push({
      step_history_id: id++,
      case_id: s.case_id,
      task_id: `${s.case_id}-task-1`,
      correlation_id: `corr-${s.case_id}-advance`,
      trigger_type: 'POLL',
      handler_key: 'workflow_advance',
      handler_version: 'v1',
      state_before: 'NEW_DENIAL',
      state_after: s.state_code,
      outcome_code: s.is_stuck ? 'FATAL' : 'SUCCESS',
      error_code: s.last_error_code,
      error_message: s.last_error_code ? 'Handler reported terminal failure' : null,
      started_at: isoAgo(s.ageMs / 2),
      ended_at: isoAgo(s.ageMs / 2 - 2000),
    });
  }
  return out.reverse(); // newest first
}

// ---- Mutable in-memory dataset --------------------------------------------

interface MockState {
  scenarios: Scenario[];
  adminRows: AdminCaseRow[];
  stuckRows: StuckCaseRow[];
  recentActivity: RecentActivityRow[];
  caseDetails: Map<string, CaseDetailResponse>;
  caseHistories: Map<string, StepHistoryRow[]>;
}

function buildState(): MockState {
  const scenarios = [...SCENARIOS, ...generateFillerScenarios()];
  const adminRows = scenarios.map(scenarioToAdminRow);
  const stuckRows = scenarios.filter((s) => s.is_stuck).map(scenarioToStuckRow);
  const recentActivity = generateRecentActivity(scenarios);
  const caseDetails = new Map<string, CaseDetailResponse>();
  const caseHistories = new Map<string, StepHistoryRow[]>();
  for (const s of scenarios) {
    caseDetails.set(s.case_id, scenarioToCaseDetail(s));
    caseHistories.set(s.case_id, scenarioToHistory(s));
  }
  return { scenarios, adminRows, stuckRows, recentActivity, caseDetails, caseHistories };
}

let state: MockState = buildState();

export function getMockState(): MockState {
  return state;
}

/** Reset the dataset between tests. Called by vitest.setup.ts afterEach. */
export function resetMockState(): void {
  state = buildState();
}

// ===========================================================================
// Phase B — mutation helpers (used by MSW handlers)
// ===========================================================================
//
// Each helper mutates the in-memory state in the same shape the real
// backend would (per backend tech spec §3.3 / §3.4 + Phase B handback).
// They return discriminated results: `{ ok: true, ... }` on success with
// before/after snapshots, or `{ ok: false, code }` for the spec's 404 /
// 409 / etc. error paths so handlers can return the right HTTP status.
//
// Audit ids are monotonically generated; the recent-activity stream is
// optionally appended for forensic visibility (not strictly required at
// the MSW level, but matches the v0.1.2 LEFT-JOIN actor enrichment).

/** Demo state machine used by force-advance. */
const DEMO_STATE_ORDER: readonly string[] = [
  'NEW_DENIAL',
  'GATHER_FACESHEET',
  'DRAFTING_APPEAL',
  'APPEAL_REVIEW',
  'APPEAL_PENDING',
  'ESCALATED',
  'CLOSED',
];

function nextDemoState(current: string): string | null {
  const i = DEMO_STATE_ORDER.indexOf(current);
  if (i < 0 || i >= DEMO_STATE_ORDER.length - 1) return null;
  return DEMO_STATE_ORDER[i + 1] ?? null;
}

let auditIdSeq = 9_000_000;
function nextAuditId(): number {
  auditIdSeq += 1;
  return auditIdSeq;
}

export type MutationFailure =
  | { ok: false; code: 'NOT_FOUND' }
  | { ok: false; code: 'CONFLICT_CLOSED' }
  | { ok: false; code: 'CONFLICT_TERMINAL_STATE' };

interface MutationSnapshotPair {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

/**
 * Find the canonical AdminCaseRow + CaseDetailResponse pair for a case_id,
 * returning null if either is missing. Returns by reference — callers
 * mutate in place.
 */
function findCase(caseId: string): {
  row: AdminCaseRow;
  detail: CaseDetailResponse;
} | null {
  const row = state.adminRows.find((r) => r.case_id === caseId);
  const detail = state.caseDetails.get(caseId);
  if (!row || !detail) return null;
  return { row, detail };
}

/** Append a CONSOLE_RETRY/CONSOLE_CLOSE entry to the recent-activity stream. */
function appendActivity(
  caseId: string,
  triggerType: string,
  consoleActionType: string,
  stateFrom: string,
  stateTo: string,
  actor: string,
  reason: string | null,
): void {
  const occurredAt = new Date().toISOString();
  state.recentActivity.unshift({
    history_id: nextAuditId(),
    case_id: caseId,
    case_type: state.adminRows.find((r) => r.case_id === caseId)?.case_type ?? null,
    clinic_id:
      state.adminRows.find((r) => r.case_id === caseId)?.clinic_id ?? null,
    occurred_at: occurredAt,
    state_code_from: stateFrom,
    state_code_to: stateTo,
    trigger_type: triggerType,
    trigger_outcome: 'SUCCESS',
    handler_key: null,
    actor_subject: `sub-${actor}`,
    actor_email: actor,
    console_action_type: consoleActionType,
    reason,
    correlation_id: `corr-${caseId}-${triggerType.toLowerCase()}-${occurredAt}`,
  });
}

/**
 * RETRY — clear last_error_*, set next_action_at = now, preserve attempt_count.
 * Spec §3.3. Returns 409 if already closed.
 */
export function applyRetry(
  caseId: string,
  reason: string,
  actor: string,
):
  | {
      ok: true;
      before: MutationSnapshotPair['before'];
      after: MutationSnapshotPair['after'];
      audit_id: number;
      retried_at: string;
    }
  | MutationFailure {
  const found = findCase(caseId);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { row, detail } = found;
  if (row.closed_at !== null) return { ok: false, code: 'CONFLICT_CLOSED' };

  const before = {
    state_code: row.state_code,
    next_action_at: row.next_action_at,
    last_error_code: row.last_error_code,
    last_error_at: row.last_error_at,
    attempt_count: row.attempt_count,
  };

  const retriedAt = new Date().toISOString();
  row.last_error_code = null;
  row.last_error_at = null;
  row.is_stuck = false;
  row.stuck_reason = null;
  row.next_action_at = retriedAt;
  detail.case.last_error_code = null;
  detail.case.last_error_source = null;
  detail.case.last_error_retryable = null;
  detail.case.next_action_at = retriedAt;
  detail.case.updated_at = retriedAt;

  // The case might no longer be stuck — keep stuckRows consistent.
  state.stuckRows = state.stuckRows.filter((s) => s.case_id !== caseId);

  appendActivity(
    caseId,
    'CONSOLE_RETRY',
    'RETRY',
    row.state_code,
    row.state_code,
    actor,
    reason,
  );

  return {
    ok: true,
    before,
    after: {
      state_code: row.state_code,
      next_action_at: row.next_action_at,
      last_error_code: row.last_error_code,
      last_error_at: row.last_error_at,
      attempt_count: row.attempt_count,
    },
    audit_id: nextAuditId(),
    retried_at: retriedAt,
  };
}

/**
 * CLOSE — set closed_at, write close_reason_code into last_error_code
 * (per ADR-OC-3 — state_code is preserved), null next_action_at.
 * Spec §3.4. Returns 409 if already closed.
 */
export function applyClose(
  caseId: string,
  closeReasonCode: string,
  reason: string,
  actor: string,
):
  | {
      ok: true;
      before: MutationSnapshotPair['before'];
      after: MutationSnapshotPair['after'];
      audit_id: number;
      closed_at: string;
    }
  | MutationFailure {
  const found = findCase(caseId);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { row, detail } = found;
  if (row.closed_at !== null) return { ok: false, code: 'CONFLICT_CLOSED' };

  const before = {
    state_code: row.state_code,
    closed_at: row.closed_at,
    last_error_code: row.last_error_code,
    next_action_at: row.next_action_at,
  };

  const closedAt = new Date().toISOString();
  row.closed_at = closedAt;
  row.last_error_code = closeReasonCode; // ADR-OC-3 column reuse
  row.next_action_at = null;
  // state_code is intentionally preserved (per ADR-OC-3).
  row.is_stuck = false;
  row.stuck_reason = null;
  row.open_task_count = 0;

  detail.case.closed_at = closedAt;
  detail.case.last_error_code = closeReasonCode;
  detail.case.next_action_at = null;
  detail.case.updated_at = closedAt;
  // Close all open tasks too.
  for (const t of detail.tasks) {
    if (t.closed_at === null) {
      t.closed_at = closedAt;
      t.close_reason_code = closeReasonCode;
    }
  }

  state.stuckRows = state.stuckRows.filter((s) => s.case_id !== caseId);

  appendActivity(
    caseId,
    'CONSOLE_CLOSE',
    'CLOSE',
    row.state_code,
    row.state_code,
    actor,
    reason,
  );

  return {
    ok: true,
    before,
    after: {
      state_code: row.state_code,
      closed_at: row.closed_at,
      last_error_code: row.last_error_code,
      next_action_at: row.next_action_at,
    },
    audit_id: nextAuditId(),
    closed_at: closedAt,
  };
}

/**
 * ADVANCE — move case to next state in the demo state machine.
 * Returns 409 if case is closed or already at terminal state.
 */
export function applyAdvance(
  caseId: string,
  reason: string | null,
  actor: string,
):
  | {
      ok: true;
      before: MutationSnapshotPair['before'];
      after: MutationSnapshotPair['after'];
      audit_id: number;
      advanced_at: string;
    }
  | MutationFailure {
  const found = findCase(caseId);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { row, detail } = found;
  if (row.closed_at !== null) return { ok: false, code: 'CONFLICT_CLOSED' };

  const next = nextDemoState(row.state_code);
  if (next === null) return { ok: false, code: 'CONFLICT_TERMINAL_STATE' };

  const before = {
    state_code: row.state_code,
    next_action_at: row.next_action_at,
  };

  const advancedAt = new Date().toISOString();
  const fromState = row.state_code;
  row.state_code = next;
  row.state_updated_at = advancedAt;
  row.next_action_at = advancedAt;
  detail.case.state_code = next;
  detail.case.next_action_at = advancedAt;
  detail.case.updated_at = advancedAt;

  appendActivity(
    caseId,
    'MANUAL_ADVANCE',
    'ADVANCE',
    fromState,
    next,
    actor,
    reason,
  );

  return {
    ok: true,
    before,
    after: { state_code: row.state_code, next_action_at: row.next_action_at },
    audit_id: nextAuditId(),
    advanced_at: advancedAt,
  };
}

/**
 * REASSIGN OWNER — set owner_user_id; pass null to unassign.
 * Returns 409 if case is closed (closed cases shouldn't accept new owners).
 */
export function applyReassign(
  caseId: string,
  newOwnerUserId: string | null,
  reason: string | null,
  actor: string,
):
  | {
      ok: true;
      before: MutationSnapshotPair['before'];
      after: MutationSnapshotPair['after'];
      audit_id: number;
      reassigned_at: string;
    }
  | MutationFailure {
  const found = findCase(caseId);
  if (!found) return { ok: false, code: 'NOT_FOUND' };
  const { row, detail } = found;
  if (row.closed_at !== null) return { ok: false, code: 'CONFLICT_CLOSED' };

  const before = { owner_user_id: row.owner_user_id };
  const reassignedAt = new Date().toISOString();
  row.owner_user_id = newOwnerUserId;
  detail.case.owner_user_id = newOwnerUserId;
  detail.case.owner_user_name = newOwnerUserId; // best-effort echo
  detail.case.updated_at = reassignedAt;

  appendActivity(
    caseId,
    'RECLAIM',
    'REASSIGN',
    row.state_code,
    row.state_code,
    actor,
    reason,
  );

  return {
    ok: true,
    before,
    after: { owner_user_id: row.owner_user_id },
    audit_id: nextAuditId(),
    reassigned_at: reassignedAt,
  };
}
