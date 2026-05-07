/**
 * AR Mgmt Portal — schemas.
 *
 * The data shapes the AR Mgmt page exchanges with the backend. These are the
 * single source of truth — the actions registry references these schemas, the
 * mock-server returns this shape, and the OpenAPI emitter walks them to
 * produce the wire spec.
 *
 * Vocabulary (from the second screenshot):
 *   - status     : billing status (Filed, Denied, Rejected, Closed, Secondary, Completed)
 *   - workflowName : which workflow the row is in (e.g. "AR", "Denied - Medical necessity")
 *   - workflowState : where in the workflow lifecycle (Created, Policy, Coding, Initialized)
 *   - currentTask : specific actionable task (MR_Pull, Patient_contact, Coder_wait, ...)
 *   - priority   : SLA tier (P1=12h, P2=24h, P3=48-72h, P4=72h+)
 *   - dueAt      : SLA deadline timestamp
 *   - nextTfl    : timely-filing limit (separate clock — when the claim becomes uncollectable)
 *
 * Status and workflow are independent dimensions. A claim can be Filed (status)
 * AND in workflow state Created/MR_Pull (we're researching it).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const ClaimStatusEnum = z.enum([
  'completed',
  'filed',
  'secondary',
  'denied',
  'rejected',
  'closed',
]);
export type ClaimStatus = z.infer<typeof ClaimStatusEnum>;

export const PriorityEnum = z.enum(['P1', 'P2', 'P3', 'P4']);
export type Priority = z.infer<typeof PriorityEnum>;

// Workflow name is open-ended in production (admin-defined), but we list known
// values for the mock. New names from the backend are accepted.
export const KnownWorkflowNameEnum = z.enum([
  'AR',
  'Denied - Medical necessity',
  'Denied - Invalid CPT',
  'Coding - Invalid ICD',
  'Invalid Subscriber',
  'Invalid SB05 segment',
  'Demo',
  'Closed',
]);

// Workflow states and tasks similarly: known values listed for the mock,
// strings accepted for forward compatibility.
export const WorkflowStateSchema = z.string();
export const CurrentTaskSchema = z.string();

// ---------------------------------------------------------------------------
// AR row
// ---------------------------------------------------------------------------

/**
 * One AR row. Mirrors the columns in the search screen verbatim. `id` is the
 * stable row id (claim case id) used by mutations.
 */
export const ARRowSchema = z.object({
  id: z.string(),
  clinicId: z.string(),
  clinicName: z.string(),
  dos: z.string(), // ISO date string
  patientLastName: z.string(),
  patientFirstName: z.string(),
  mrn: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  facility: z.string(),
  primaryPayer: z.string(),
  secondaryPayer: z.string().nullable(),
  status: ClaimStatusEnum,

  // Workflow dimension (may be empty for claims not in active workflow).
  workflowName: z.string().nullable(),
  workflowState: WorkflowStateSchema.nullable(),
  currentTask: CurrentTaskSchema.nullable(),

  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  priority: PriorityEnum,

  dueAt: z.string().nullable(), // ISO timestamp
  nextTfl: z.string().nullable(), // ISO date

  billed: z.number(),
  balance: z.number(),
});
export type ARRow = z.infer<typeof ARRowSchema>;

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

export const SortDirectionEnum = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionEnum>;

/**
 * Worklist mode — drives which dataset the same `ar.list` action returns:
 *
 *   - 'working'      : claims already in active workflow (the daily worklist)
 *   - 'add-to-workflow' : claims NOT yet in workflow that are candidates to add
 *                         (filtered by the aging defaults the screen sets)
 *
 * Both modes use the same row schema and same paging contract.
 */
export const WorklistModeEnum = z.enum(['working', 'add-to-workflow']);
export type WorklistMode = z.infer<typeof WorklistModeEnum>;

export const ARListRequestSchema = z.object({
  mode: WorklistModeEnum.default('working'),

  // Filters (all optional)
  clinicIds: z.array(z.string()).optional(),
  providerIds: z.array(z.string()).optional(),
  payerIds: z.array(z.string()).optional(),
  ownerIds: z.array(z.string()).optional(),
  statuses: z.array(ClaimStatusEnum).optional(),
  priorities: z.array(PriorityEnum).optional(),
  dosFrom: z.string().optional(),
  dosTo: z.string().optional(),
  agingMinDays: z.number().int().min(0).optional(),
  search: z.string().optional(), // patient name / MRN / claim id

  // Sort (single column)
  sortColumn: z.string().optional(),
  sortDir: SortDirectionEnum.optional(),

  // Pagination (server-side)
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(25),
});
export type ARListRequest = z.infer<typeof ARListRequestSchema>;

export const ARListResponseSchema = z.object({
  rows: z.array(ARRowSchema),
  totalCount: z.number().int().min(0),
  totalBalance: z.number(),
});
export type ARListResponse = z.infer<typeof ARListResponseSchema>;

// ---- mutations -------------------------------------------------------------

export const UpdateOwnerRequestSchema = z.object({
  rowId: z.string(),
  ownerId: z.string().nullable(),
});

export const UpdateDueDateRequestSchema = z.object({
  rowId: z.string(),
  dueAt: z.string().nullable(),
});

export const BulkUpdateOwnerRequestSchema = z.object({
  rowIds: z.array(z.string()).min(1),
  ownerId: z.string().nullable(),
});

export const BulkUpdateDueDateRequestSchema = z.object({
  rowIds: z.array(z.string()).min(1),
  dueAt: z.string().nullable(),
});

export const AddToWorkflowRequestSchema = z.object({
  claimIds: z.array(z.string()).min(1),
  initialPriority: PriorityEnum,
});

export const AddToWorkflowResponseSchema = z.object({
  added: z.number().int().min(0),
  rows: z.array(ARRowSchema), // the rows post-add
});

// ---- reference data --------------------------------------------------------

export const RefDataItemSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type RefDataItem = z.infer<typeof RefDataItemSchema>;

export const RefDataResponseSchema = z.object({
  items: z.array(RefDataItemSchema),
});
