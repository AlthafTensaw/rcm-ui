/**
 * Place of Service (POS) codes.
 *
 * Phase 4 of the v3 plan. Source: CMS POS code set (public domain).
 * https://www.cms.gov/medicare/coding-billing/place-of-service-codes
 *
 * Full official list. Updated through 2024. Used by PosCodeField and any
 * claim-line widget.
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface PosEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** Short label (e.g. "Office", "Inpatient Hospital"). Used in compact UIs. */
  shortLabel: string;
}

export const POS_CODES: readonly PosEntry[] = [
  { code: '01', shortLabel: 'Pharmacy', description: 'Pharmacy' },
  { code: '02', shortLabel: 'Telehealth (home)', description: 'Telehealth Provided Other than in Patient\'s Home' },
  { code: '03', shortLabel: 'School', description: 'School' },
  { code: '04', shortLabel: 'Homeless Shelter', description: 'Homeless Shelter' },
  { code: '05', shortLabel: 'IHS Free-standing', description: 'Indian Health Service Free-standing Facility' },
  { code: '06', shortLabel: 'IHS Provider-based', description: 'Indian Health Service Provider-based Facility' },
  { code: '07', shortLabel: 'Tribal 638 Free-standing', description: 'Tribal 638 Free-standing Facility' },
  { code: '08', shortLabel: 'Tribal 638 Provider', description: 'Tribal 638 Provider-based Facility' },
  { code: '09', shortLabel: 'Prison/Correctional', description: 'Prison/Correctional Facility' },
  { code: '10', shortLabel: 'Telehealth (home)', description: 'Telehealth Provided in Patient\'s Home' },
  { code: '11', shortLabel: 'Office', description: 'Office' },
  { code: '12', shortLabel: 'Home', description: 'Home' },
  { code: '13', shortLabel: 'Assisted Living', description: 'Assisted Living Facility' },
  { code: '14', shortLabel: 'Group Home', description: 'Group Home' },
  { code: '15', shortLabel: 'Mobile Unit', description: 'Mobile Unit' },
  { code: '16', shortLabel: 'Temporary Lodging', description: 'Temporary Lodging' },
  { code: '17', shortLabel: 'Walk-in Retail', description: 'Walk-in Retail Health Clinic' },
  { code: '18', shortLabel: 'Off-campus Outpatient', description: 'Place of Employment-Worksite' },
  { code: '19', shortLabel: 'Off-campus Outpatient Hosp', description: 'Off Campus-Outpatient Hospital' },
  { code: '20', shortLabel: 'Urgent Care', description: 'Urgent Care Facility' },
  { code: '21', shortLabel: 'Inpatient Hospital', description: 'Inpatient Hospital' },
  { code: '22', shortLabel: 'On-campus Outpatient Hosp', description: 'On Campus-Outpatient Hospital' },
  { code: '23', shortLabel: 'Emergency Room', description: 'Emergency Room - Hospital' },
  { code: '24', shortLabel: 'Ambulatory Surgical', description: 'Ambulatory Surgical Center' },
  { code: '25', shortLabel: 'Birthing Center', description: 'Birthing Center' },
  { code: '26', shortLabel: 'Military Treatment', description: 'Military Treatment Facility' },
  { code: '27', shortLabel: 'Outreach Site', description: 'Outreach Site/Street' },
  { code: '31', shortLabel: 'Skilled Nursing', description: 'Skilled Nursing Facility' },
  { code: '32', shortLabel: 'Nursing Facility', description: 'Nursing Facility' },
  { code: '33', shortLabel: 'Custodial Care', description: 'Custodial Care Facility' },
  { code: '34', shortLabel: 'Hospice', description: 'Hospice' },
  { code: '41', shortLabel: 'Ambulance Land', description: 'Ambulance - Land' },
  { code: '42', shortLabel: 'Ambulance Air/Water', description: 'Ambulance - Air or Water' },
  { code: '49', shortLabel: 'Indep. Clinic', description: 'Independent Clinic' },
  { code: '50', shortLabel: 'FQHC', description: 'Federally Qualified Health Center' },
  { code: '51', shortLabel: 'Inpatient Psych', description: 'Inpatient Psychiatric Facility' },
  { code: '52', shortLabel: 'Psych Partial Hosp', description: 'Psychiatric Facility-Partial Hospitalization' },
  { code: '53', shortLabel: 'Community Mental Health', description: 'Community Mental Health Center' },
  { code: '54', shortLabel: 'ICF-IDD', description: 'Intermediate Care Facility/Individuals with Intellectual Disabilities' },
  { code: '55', shortLabel: 'Residential Substance', description: 'Residential Substance Abuse Treatment Facility' },
  { code: '56', shortLabel: 'Psych Residential', description: 'Psychiatric Residential Treatment Center' },
  { code: '57', shortLabel: 'Non-Resid. Substance', description: 'Non-residential Substance Abuse Treatment Facility' },
  { code: '58', shortLabel: 'Non-Resid. Opioid', description: 'Non-residential Opioid Treatment Facility' },
  { code: '60', shortLabel: 'Mass Immunization', description: 'Mass Immunization Center' },
  { code: '61', shortLabel: 'Comp Inpatient Rehab', description: 'Comprehensive Inpatient Rehabilitation Facility' },
  { code: '62', shortLabel: 'Comp Outpatient Rehab', description: 'Comprehensive Outpatient Rehabilitation Facility' },
  { code: '65', shortLabel: 'ESRD Treatment', description: 'End-Stage Renal Disease Treatment Facility' },
  { code: '71', shortLabel: 'State/Local Public Health', description: 'Public Health Clinic' },
  { code: '72', shortLabel: 'Rural Health Clinic', description: 'Rural Health Clinic' },
  { code: '81', shortLabel: 'Independent Lab', description: 'Independent Laboratory' },
  { code: '99', shortLabel: 'Other', description: 'Other Place of Service' },
];

const byCode = new Map(POS_CODES.map((p) => [p.code, p]));

export const pos = {
  get(code: string): PosEntry | undefined {
    return byCode.get(code.padStart(2, '0'));
  },
  list(): readonly PosEntry[] {
    return POS_CODES;
  },
  search(query: string, options?: SearchOptions): readonly PosEntry[] {
    return searchEntries([...POS_CODES], query, options);
  },
  isValid(code: string): boolean {
    return byCode.has(code.padStart(2, '0'));
  },
};
