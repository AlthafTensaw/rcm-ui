/**
 * Claim Adjustment Reason Codes (CARC).
 *
 * Phase 4 of the v3 plan. Source: X12 (permitted for healthcare transactions).
 * The full CARC set has ~285 active codes; this bundle ships the most common
 * ~50 used in practice for denial categorization. Quarterly refresh job
 * expands this to the full set.
 *
 * For codes not in this bundle, `carc.get(code)` returns undefined and the
 * UI should fall back to a server-side lookup or display the raw code.
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface CarcEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** High-level category mapped from the official description. */
  category:
    | 'Coding'
    | 'Coverage'
    | 'Authorization'
    | 'Eligibility'
    | 'Bundling'
    | 'Medical Necessity'
    | 'Timely Filing'
    | 'Duplicate'
    | 'COB'
    | 'Patient Responsibility'
    | 'Contractual'
    | 'Other';
}

export const CARC_CODES: readonly CarcEntry[] = [
  { code: '1', description: 'Deductible Amount', category: 'Patient Responsibility' },
  { code: '2', description: 'Coinsurance Amount', category: 'Patient Responsibility' },
  { code: '3', description: 'Co-payment Amount', category: 'Patient Responsibility' },
  { code: '4', description: 'The procedure code is inconsistent with the modifier used.', category: 'Coding' },
  { code: '5', description: 'The procedure code/type of bill is inconsistent with the place of service.', category: 'Coding' },
  { code: '6', description: 'The procedure/revenue code is inconsistent with the patient\'s age.', category: 'Coding' },
  { code: '7', description: 'The procedure/revenue code is inconsistent with the patient\'s gender.', category: 'Coding' },
  { code: '8', description: 'The procedure code is inconsistent with the provider type/specialty.', category: 'Coding' },
  { code: '9', description: 'The diagnosis is inconsistent with the patient\'s age.', category: 'Coding' },
  { code: '10', description: 'The diagnosis is inconsistent with the patient\'s gender.', category: 'Coding' },
  { code: '11', description: 'The diagnosis is inconsistent with the procedure.', category: 'Coding' },
  { code: '12', description: 'The diagnosis is inconsistent with the provider type.', category: 'Coding' },
  { code: '15', description: 'The authorization number is missing, invalid, or does not apply to the billed services or provider.', category: 'Authorization' },
  { code: '16', description: 'Claim/service lacks information or has submission/billing error(s).', category: 'Coding' },
  { code: '18', description: 'Exact duplicate claim/service.', category: 'Duplicate' },
  { code: '19', description: 'This is a work-related injury/illness and thus the liability of the Workers\' Compensation Carrier.', category: 'Coverage' },
  { code: '20', description: 'This injury/illness is covered by the liability carrier.', category: 'Coverage' },
  { code: '22', description: 'This care may be covered by another payer per coordination of benefits.', category: 'COB' },
  { code: '23', description: 'The impact of prior payer(s) adjudication including payments and/or adjustments.', category: 'COB' },
  { code: '24', description: 'Charges are covered under a capitation agreement/managed care plan.', category: 'Contractual' },
  { code: '26', description: 'Expenses incurred prior to coverage.', category: 'Coverage' },
  { code: '27', description: 'Expenses incurred after coverage terminated.', category: 'Coverage' },
  { code: '29', description: 'The time limit for filing has expired.', category: 'Timely Filing' },
  { code: '31', description: 'Patient cannot be identified as our insured.', category: 'Eligibility' },
  { code: '38', description: 'Services not provided or authorized by designated (network/primary care) providers.', category: 'Authorization' },
  { code: '39', description: 'Services denied at the time authorization/pre-certification was requested.', category: 'Authorization' },
  { code: '40', description: 'Charges do not meet qualifications for emergent/urgent care.', category: 'Medical Necessity' },
  { code: '45', description: 'Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.', category: 'Contractual' },
  { code: '49', description: 'This is a non-covered service because it is a routine/preventive exam or a diagnostic/screening procedure done in conjunction with a routine/preventive exam.', category: 'Coverage' },
  { code: '50', description: 'These are non-covered services because this is not deemed a medical necessity by the payer.', category: 'Medical Necessity' },
  { code: '51', description: 'These are non-covered services because this is a pre-existing condition.', category: 'Coverage' },
  { code: '54', description: 'Multiple physicians/assistants are not covered in this case.', category: 'Coverage' },
  { code: '55', description: 'Procedure/treatment/drug is deemed experimental/investigational by the payer.', category: 'Medical Necessity' },
  { code: '58', description: 'Treatment was deemed by the payer to have been rendered in an inappropriate or invalid place of service.', category: 'Medical Necessity' },
  { code: '59', description: 'Processed based on multiple or concurrent procedure rules.', category: 'Bundling' },
  { code: '96', description: 'Non-covered charge(s).', category: 'Coverage' },
  { code: '97', description: 'The benefit for this service is included in the payment/allowance for another service/procedure that has already been adjudicated.', category: 'Bundling' },
  { code: '107', description: 'The related or qualifying claim/service was not identified on this claim.', category: 'Coding' },
  { code: '109', description: 'Claim/service not covered by this payer/contractor. You must send the claim/service to the correct payer/contractor.', category: 'COB' },
  { code: '119', description: 'Benefit maximum for this time period or occurrence has been reached.', category: 'Coverage' },
  { code: '125', description: 'Submission/billing error(s).', category: 'Coding' },
  { code: '140', description: 'Patient/Insured health identification number and name do not match.', category: 'Eligibility' },
  { code: '146', description: 'Diagnosis was invalid for the date(s) of service reported.', category: 'Coding' },
  { code: '151', description: 'Payment adjusted because the payer deems the information submitted does not support this many/frequency of services.', category: 'Medical Necessity' },
  { code: '167', description: 'This (these) diagnosis(es) is (are) not covered.', category: 'Coverage' },
  { code: '171', description: 'Payment is denied when performed/billed by this type of provider in this type of facility.', category: 'Coverage' },
  { code: '177', description: 'Patient has not met the required eligibility requirements.', category: 'Eligibility' },
  { code: '197', description: 'Precertification/authorization/notification absent.', category: 'Authorization' },
  { code: '198', description: 'Precertification/authorization exceeded.', category: 'Authorization' },
  { code: '204', description: 'This service/equipment/drug is not covered under the patient\'s current benefit plan.', category: 'Coverage' },
  { code: '252', description: 'An attachment/other documentation is required to adjudicate this claim/service.', category: 'Coding' },
];

const byCode = new Map(CARC_CODES.map((c) => [c.code, c]));

export const carc = {
  get(code: string): CarcEntry | undefined {
    return byCode.get(code);
  },
  list(): readonly CarcEntry[] {
    return CARC_CODES;
  },
  search(query: string, options?: SearchOptions): readonly CarcEntry[] {
    return searchEntries([...CARC_CODES], query, options);
  },
  /** Filter the bundled subset by category. Useful for denial-reason buckets. */
  byCategory(category: CarcEntry['category']): readonly CarcEntry[] {
    return CARC_CODES.filter((c) => c.category === category);
  },
};
