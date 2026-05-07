/**
 * Plan type / Insurance type codes.
 *
 * Phase 4 of the v3 plan. Source: Tensaw-curated subset of HIPAA service-type
 * codes for plan classification on the patient's insurance widget.
 *
 * **Status: representative sample.** Full HIPAA EB13 service-type list has
 * 200+ codes; we ship the most common plan-type designations a billing UI
 * needs to label coverage.
 */

import type { CodeEntryBase } from '../types';

export interface PlanTypeEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** Common shorthand label. */
  shortLabel: string;
  /** Whether this is a managed-care plan. */
  managedCare: boolean;
}

export const PLAN_TYPES: readonly PlanTypeEntry[] = [
  { code: '12', shortLabel: 'PPO', description: 'Preferred Provider Organization', managedCare: true },
  { code: '13', shortLabel: 'POS', description: 'Point of Service', managedCare: true },
  { code: '14', shortLabel: 'EPO', description: 'Exclusive Provider Organization', managedCare: true },
  { code: '15', shortLabel: 'HMO', description: 'Health Maintenance Organization', managedCare: true },
  { code: '16', shortLabel: 'HMO-Medicare', description: 'HMO Medicare Risk', managedCare: true },
  { code: 'BL', shortLabel: 'BCBS', description: 'Blue Cross Blue Shield', managedCare: false },
  { code: 'CH', shortLabel: 'TRICARE', description: 'Champus / TRICARE', managedCare: false },
  { code: 'CI', shortLabel: 'Commercial', description: 'Commercial Insurance', managedCare: false },
  { code: 'DS', shortLabel: 'Disability', description: 'Disability', managedCare: false },
  { code: 'HM', shortLabel: 'HDHP', description: 'High Deductible Health Plan', managedCare: false },
  { code: 'LM', shortLabel: 'Liability', description: 'Liability Medical', managedCare: false },
  { code: 'MA', shortLabel: 'Medicare A', description: 'Medicare Part A', managedCare: false },
  { code: 'MB', shortLabel: 'Medicare B', description: 'Medicare Part B', managedCare: false },
  { code: 'MC', shortLabel: 'Medicaid', description: 'Medicaid', managedCare: false },
  { code: 'OF', shortLabel: 'Other Federal', description: 'Other Federal Program', managedCare: false },
  { code: 'TV', shortLabel: 'Title V', description: 'Title V (Maternal & Child Health)', managedCare: false },
  { code: 'VA', shortLabel: 'VA', description: 'Veterans Affairs Plan', managedCare: false },
  { code: 'WC', shortLabel: 'Workers Comp', description: 'Workers\' Compensation', managedCare: false },
  { code: 'ZZ', shortLabel: 'Mutual', description: 'Mutually Defined', managedCare: false },
];

const byCode = new Map(PLAN_TYPES.map((p) => [p.code, p]));

export const planType = {
  get(code: string): PlanTypeEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly PlanTypeEntry[] {
    return PLAN_TYPES;
  },
  managedCareOnly(): readonly PlanTypeEntry[] {
    return PLAN_TYPES.filter((p) => p.managedCare);
  },
};
