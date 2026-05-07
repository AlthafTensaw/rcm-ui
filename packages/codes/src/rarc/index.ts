/**
 * Remittance Advice Remark Codes (RARC).
 *
 * Phase 4 of the v3 plan. Source: X12 (permitted for healthcare transactions).
 * The full RARC set has ~700+ active codes; this bundle ships ~40 of the
 * most common ones used to clarify CARC denials.
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface RarcEntry extends CodeEntryBase {
  code: string;
  description: string;
}

export const RARC_CODES: readonly RarcEntry[] = [
  { code: 'M1', description: 'X-ray not taken within the past 12 months or near enough to the start of treatment.' },
  { code: 'M2', description: 'Not paid separately when the patient is an inpatient.' },
  { code: 'M15', description: 'Separately billed services/tests have been bundled as they are considered components of the same procedure.' },
  { code: 'M25', description: 'The information furnished does not substantiate the need for this level of service.' },
  { code: 'M40', description: 'Claim must be assigned and must be filed by the practitioner\'s employer.' },
  { code: 'M51', description: 'Missing/incomplete/invalid procedure code(s).' },
  { code: 'M62', description: 'Missing/incomplete/invalid treatment authorization code.' },
  { code: 'M76', description: 'Missing/incomplete/invalid diagnosis or condition.' },
  { code: 'M77', description: 'Missing/incomplete/invalid place of service.' },
  { code: 'M79', description: 'Missing/incomplete/invalid charges on claim.' },
  { code: 'M80', description: 'Not covered when performed during the same session/date as a previously processed service for the patient.' },
  { code: 'M81', description: 'You are required to code to the highest level of specificity.' },
  { code: 'M86', description: 'Service denied because payment already made for same/similar procedure within set time frame.' },
  { code: 'M97', description: 'Not paid to practitioner when provided to patient in this place of service. Payment included in the reimbursement issued the facility.' },
  { code: 'M119', description: 'Missing/incomplete/invalid/deactivated/withdrawn National Drug Code (NDC).' },
  { code: 'MA01', description: 'Alert: If you do not agree with what we approved for these services, you may appeal our decision.' },
  { code: 'MA04', description: 'Secondary payment cannot be considered without the identity of or payment information from the primary payer.' },
  { code: 'MA15', description: 'Alert: Your claim has been separated to expedite handling.' },
  { code: 'MA18', description: 'Alert: The claim information is also being forwarded to the patient\'s supplemental insurer.' },
  { code: 'MA66', description: 'Missing/incomplete/invalid principal procedure code.' },
  { code: 'MA67', description: 'Correction to a prior claim.' },
  { code: 'MA130', description: 'Your claim contains incomplete and/or invalid information, and no appeal rights are afforded because the claim is unprocessable.' },
  { code: 'N4', description: 'Missing/incomplete/invalid prior insurance carrier EOB.' },
  { code: 'N20', description: 'Service not payable with other service rendered on the same date.' },
  { code: 'N30', description: 'Patient ineligible for this service.' },
  { code: 'N56', description: 'Procedure code billed is not correct/valid for the services billed or the date of service billed.' },
  { code: 'N95', description: 'This provider type/provider specialty may not bill this service.' },
  { code: 'N122', description: 'Add-on code cannot be billed by itself.' },
  { code: 'N130', description: 'Consult plan benefit documents/guidelines for information about restrictions for this service.' },
  { code: 'N179', description: 'Additional information has been requested from the member. The charges will be reconsidered upon receipt of that information.' },
  { code: 'N180', description: 'This item or service does not meet the criteria for the category under which it was billed.' },
  { code: 'N362', description: 'The number of days or units of service exceeds our acceptable maximum.' },
  { code: 'N418', description: 'Misrouted claim. See the payer\'s claim submission instructions.' },
  { code: 'N435', description: 'Exceeds number/frequency approved/allowed within the time period without support documentation.' },
  { code: 'N522', description: 'Duplicate of a claim processed, or to be processed, as a crossover claim.' },
  { code: 'N640', description: 'Exceeds number/frequency approved/allowed within the time period.' },
  { code: 'N657', description: 'This should be billed with the appropriate code for these services.' },
  { code: 'N674', description: 'Not covered unless a pre-requisite procedure/service has been provided.' },
  { code: 'N702', description: 'Decision based on review of previously adjudicated claims or for services that should be considered under a global service.' },
  { code: 'N822', description: 'Missing procedure modifier(s).' },
];

const byCode = new Map(RARC_CODES.map((c) => [c.code, c]));

export const rarc = {
  get(code: string): RarcEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly RarcEntry[] {
    return RARC_CODES;
  },
  search(query: string, options?: SearchOptions): readonly RarcEntry[] {
    return searchEntries([...RARC_CODES], query, options);
  },
};
