/**
 * Adjustment-reason categories.
 *
 * Phase 4 of the v3 plan. Tensaw-defined buckets that group CARC codes into
 * actionable workflow categories. The CARC table also tags each code with one
 * of these for built-in cross-reference.
 *
 * Source: from the v3 plan §2.8.
 */

export interface AdjustmentReasonCategoryEntry {
  /** Tensaw-defined slug. Stable; safe to reference from app code. */
  code: string;
  description: string;
  /** True if this category typically requires a follow-up workflow action. */
  actionable: boolean;
}

export const ADJUSTMENT_REASON_CATEGORIES: readonly AdjustmentReasonCategoryEntry[] = [
  {
    code: 'missing-auth',
    description: 'Missing or invalid authorization',
    actionable: true,
  },
  {
    code: 'coverage-terminated',
    description: 'Patient coverage terminated for date of service',
    actionable: true,
  },
  {
    code: 'duplicate',
    description: 'Duplicate claim or service',
    actionable: false,
  },
  {
    code: 'coding-error',
    description: 'Coding error — invalid code, modifier, or pointer',
    actionable: true,
  },
  {
    code: 'medical-necessity',
    description: 'Medical necessity not supported',
    actionable: true,
  },
  {
    code: 'bundling',
    description: 'Bundled into another service or capitation',
    actionable: false,
  },
  {
    code: 'timely-filing',
    description: 'Filed past the timely-filing limit',
    actionable: false,
  },
  {
    code: 'cob',
    description: 'Coordination of benefits — wrong payer or order',
    actionable: true,
  },
  {
    code: 'eligibility',
    description: 'Patient not eligible — wrong member ID, plan, or DOB',
    actionable: true,
  },
  {
    code: 'patient-responsibility',
    description: 'Patient responsibility — deductible, copay, coinsurance',
    actionable: false,
  },
  {
    code: 'contractual',
    description: 'Contractual write-off — fee schedule or capitation',
    actionable: false,
  },
  {
    code: 'other',
    description: 'Other / uncategorized',
    actionable: true,
  },
];

const byCode = new Map(ADJUSTMENT_REASON_CATEGORIES.map((c) => [c.code, c]));

export const adjustmentReasonCategories = {
  get(code: string): AdjustmentReasonCategoryEntry | undefined {
    return byCode.get(code.toLowerCase());
  },
  list(): readonly AdjustmentReasonCategoryEntry[] {
    return ADJUSTMENT_REASON_CATEGORIES;
  },
};
