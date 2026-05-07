/**
 * Workflow buckets and step taxonomies.
 *
 * Phase 4 of the v3 plan. Tensaw-defined enumeration of operational buckets
 * (Remit, Denial, Appeal, etc.) and the canonical step taxonomy under each
 * bucket. Used by the WF Status badge taxonomy and any worklist filtering.
 */

export type WorkflowBucketCode =
  | 'remit'
  | 'charges'
  | 'denial'
  | 'appeal'
  | 'patient-statement'
  | 'refund'
  | 'credit'
  | 'authorization'
  | 'eligibility'
  | 'cob';

export interface WorkflowBucketEntry {
  code: WorkflowBucketCode;
  description: string;
  /** Canonical step list for this bucket, in workflow order. */
  steps: readonly string[];
}

export const WORKFLOW_BUCKETS: readonly WorkflowBucketEntry[] = [
  {
    code: 'remit',
    description: 'Remit / EOB processing',
    steps: ['EOB Receipt', 'Integrity Verification', 'Posting', 'Reconciliation', 'Closed'],
  },
  {
    code: 'charges',
    description: 'Charge entry and submission',
    steps: ['Charge Entry', 'Coding Review', 'Edits', 'Submission', 'Acknowledgement'],
  },
  {
    code: 'denial',
    description: 'Denial management',
    steps: ['Triage', 'Root Cause', 'Resolution', 'Resubmission', 'Closed'],
  },
  {
    code: 'appeal',
    description: 'Appeal management',
    steps: ['Drafting', 'Review', 'Submission', 'Awaiting Decision', 'Decision Received', 'Closed'],
  },
  {
    code: 'patient-statement',
    description: 'Patient statement / collections',
    steps: ['Generation', 'Sent', 'First Notice', 'Second Notice', 'Final Notice', 'Collections'],
  },
  {
    code: 'refund',
    description: 'Refunds',
    steps: ['Identified', 'Verified', 'Approved', 'Issued', 'Reconciled'],
  },
  {
    code: 'credit',
    description: 'Credit balance resolution',
    steps: ['Identified', 'Source Verification', 'Resolution', 'Closed'],
  },
  {
    code: 'authorization',
    description: 'Prior authorization',
    steps: ['Submitted', 'Pending', 'Approved', 'Denied', 'Appealed', 'Expired'],
  },
  {
    code: 'eligibility',
    description: 'Eligibility verification',
    steps: ['Requested', 'Verified', 'Issues Found', 'Resolved'],
  },
  {
    code: 'cob',
    description: 'Coordination of benefits',
    steps: ['Identified', 'Pending Information', 'Resolved'],
  },
];

const byCode = new Map(WORKFLOW_BUCKETS.map((b) => [b.code, b]));

export const workflow = {
  get(code: string): WorkflowBucketEntry | undefined {
    return byCode.get(code.toLowerCase() as WorkflowBucketCode);
  },
  list(): readonly WorkflowBucketEntry[] {
    return WORKFLOW_BUCKETS;
  },
  /** Steps for a given bucket. Returns empty if bucket is unknown. */
  stepsFor(bucketCode: string): readonly string[] {
    return byCode.get(bucketCode.toLowerCase() as WorkflowBucketCode)?.steps ?? [];
  },
};
