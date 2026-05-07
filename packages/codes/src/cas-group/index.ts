/**
 * Claim Adjustment Group Codes (CAS).
 *
 * Phase 4 of the v3 plan. Source: X12 (publicly available for healthcare use).
 *
 * Only 4 group codes exist. They categorize who is responsible for an
 * adjustment on a remittance.
 */

import type { CodeEntryBase } from '../types';

export interface CasGroupEntry extends CodeEntryBase {
  code: string;
  /** Long form name. */
  description: string;
  /** Short label for compact display. */
  shortLabel: string;
}

export const CAS_GROUP_CODES: readonly CasGroupEntry[] = [
  { code: 'CO', shortLabel: 'Contractual', description: 'Contractual Obligation — provider write-off per contract' },
  { code: 'PR', shortLabel: 'Patient Resp.', description: 'Patient Responsibility — patient owes' },
  { code: 'OA', shortLabel: 'Other Adj.', description: 'Other Adjustment — neither contractual nor patient' },
  { code: 'PI', shortLabel: 'Payer Initiated', description: 'Payer Initiated Reductions — payer reduced for non-contractual reasons' },
];

const byCode = new Map(CAS_GROUP_CODES.map((c) => [c.code, c]));

export const casGroup = {
  get(code: string): CasGroupEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly CasGroupEntry[] {
    return CAS_GROUP_CODES;
  },
  isValid(code: string): boolean {
    return byCode.has(code.toUpperCase());
  },
};
