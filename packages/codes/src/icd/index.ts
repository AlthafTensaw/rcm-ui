/**
 * ICD-10-CM (diagnosis) codes — representative sample.
 *
 * Phase 4 of the v3 plan. Source: CMS public domain ICD-10-CM tabular list.
 *
 * **Status: representative sample.** The full ICD-10-CM tabular has ~70,000+
 * codes. This bundle ships ~70 codes spanning the most common categories you
 * see in outpatient RCM (cardiology, endocrine, respiratory, MSK, mental
 * health, encounter-for codes). The quarterly refresh job in CI replaces this
 * with the full table from the CMS source.
 *
 * For codes not in this bundle, `icd.get(code)` returns undefined; consuming
 * UIs should fall back to a server-side lookup (the future API gateway will
 * front a full table).
 *
 * IMPORTANT: ICD-10-CM has a `billable` flag — header codes (typically
 * 3-character codes like `E11`) are NOT billable on a claim; only their
 * specific descendants (`E11.21`) are. The `isBillable()` helper enforces this
 * and the IcdCodeField (Phase 3.4) rejects non-billable codes on submit.
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface IcdEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** True if this is a billable leaf code; false for header/category codes. */
  billable: boolean;
  /** Top-level chapter (A, B, C, ... ) for grouping. */
  chapter: string;
}

export const ICD_CODES: readonly IcdEntry[] = [
  // I — Diseases of the circulatory system
  { code: 'I10', description: 'Essential (primary) hypertension', billable: true, chapter: 'I' },
  { code: 'I11', description: 'Hypertensive heart disease', billable: false, chapter: 'I' },
  { code: 'I11.0', description: 'Hypertensive heart disease with heart failure', billable: true, chapter: 'I' },
  { code: 'I11.9', description: 'Hypertensive heart disease without heart failure', billable: true, chapter: 'I' },
  { code: 'I20.9', description: 'Angina pectoris, unspecified', billable: true, chapter: 'I' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris', billable: true, chapter: 'I' },
  { code: 'I48.91', description: 'Unspecified atrial fibrillation', billable: true, chapter: 'I' },
  { code: 'I50.9', description: 'Heart failure, unspecified', billable: true, chapter: 'I' },

  // E — Endocrine, nutritional, metabolic
  { code: 'E11', description: 'Type 2 diabetes mellitus', billable: false, chapter: 'E' },
  { code: 'E11.21', description: 'Type 2 diabetes mellitus with diabetic nephropathy', billable: true, chapter: 'E' },
  { code: 'E11.22', description: 'Type 2 diabetes mellitus with diabetic chronic kidney disease', billable: true, chapter: 'E' },
  { code: 'E11.40', description: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified', billable: true, chapter: 'E' },
  { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', billable: true, chapter: 'E' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', billable: true, chapter: 'E' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified', billable: true, chapter: 'E' },
  { code: 'E66.9', description: 'Obesity, unspecified', billable: true, chapter: 'E' },
  { code: 'E03.9', description: 'Hypothyroidism, unspecified', billable: true, chapter: 'E' },

  // J — Respiratory
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', billable: true, chapter: 'J' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', billable: true, chapter: 'J' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism', billable: true, chapter: 'J' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified', billable: true, chapter: 'J' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', billable: true, chapter: 'J' },
  { code: 'J30.9', description: 'Allergic rhinitis, unspecified', billable: true, chapter: 'J' },

  // M — Musculoskeletal
  { code: 'M54', description: 'Dorsalgia', billable: false, chapter: 'M' },
  { code: 'M54.5', description: 'Low back pain', billable: false, chapter: 'M' },
  { code: 'M54.50', description: 'Low back pain, unspecified', billable: true, chapter: 'M' },
  { code: 'M54.51', description: 'Vertebrogenic low back pain', billable: true, chapter: 'M' },
  { code: 'M54.59', description: 'Other low back pain', billable: true, chapter: 'M' },
  { code: 'M25.50', description: 'Pain in unspecified joint', billable: true, chapter: 'M' },
  { code: 'M79.1', description: 'Myalgia', billable: false, chapter: 'M' },
  { code: 'M79.10', description: 'Myalgia, unspecified site', billable: true, chapter: 'M' },
  { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee', billable: true, chapter: 'M' },
  { code: 'M17.12', description: 'Unilateral primary osteoarthritis, left knee', billable: true, chapter: 'M' },

  // F — Mental, Behavioral
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', billable: true, chapter: 'F' },
  { code: 'F41.1', description: 'Generalized anxiety disorder', billable: true, chapter: 'F' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified', billable: true, chapter: 'F' },
  { code: 'F33.1', description: 'Major depressive disorder, recurrent, moderate', billable: true, chapter: 'F' },
  { code: 'F90.0', description: 'Attention-deficit hyperactivity disorder, predominantly inattentive type', billable: true, chapter: 'F' },

  // R — Symptoms, Signs
  { code: 'R07.9', description: 'Chest pain, unspecified', billable: true, chapter: 'R' },
  { code: 'R51', description: 'Headache', billable: false, chapter: 'R' },
  { code: 'R51.9', description: 'Headache, unspecified', billable: true, chapter: 'R' },
  { code: 'R10.9', description: 'Unspecified abdominal pain', billable: true, chapter: 'R' },
  { code: 'R53.83', description: 'Other fatigue', billable: true, chapter: 'R' },
  { code: 'R05.9', description: 'Cough, unspecified', billable: true, chapter: 'R' },
  { code: 'R11.10', description: 'Vomiting, unspecified', billable: true, chapter: 'R' },

  // K — Digestive
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', billable: true, chapter: 'K' },
  { code: 'K59.00', description: 'Constipation, unspecified', billable: true, chapter: 'K' },
  { code: 'K58.9', description: 'Irritable bowel syndrome without diarrhea', billable: true, chapter: 'K' },

  // N — Genitourinary
  { code: 'N18.30', description: 'Chronic kidney disease, stage 3 unspecified', billable: true, chapter: 'N' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', billable: true, chapter: 'N' },

  // S — Injuries (sample)
  { code: 'S52.501A', description: 'Unspecified fracture of the lower end of right radius, initial encounter for closed fracture', billable: true, chapter: 'S' },
  { code: 'S52.501D', description: 'Unspecified fracture of the lower end of right radius, subsequent encounter for closed fracture with routine healing', billable: true, chapter: 'S' },

  // Z — Encounter-for codes (very common in outpatient billing)
  { code: 'Z00', description: 'Encounter for general examination without complaint, suspected or reported diagnosis', billable: false, chapter: 'Z' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', billable: true, chapter: 'Z' },
  { code: 'Z00.01', description: 'Encounter for general adult medical examination with abnormal findings', billable: true, chapter: 'Z' },
  { code: 'Z00.121', description: 'Encounter for routine child health examination with abnormal findings', billable: true, chapter: 'Z' },
  { code: 'Z00.129', description: 'Encounter for routine child health examination without abnormal findings', billable: true, chapter: 'Z' },
  { code: 'Z01.419', description: 'Encounter for gynecological examination (general) (routine) without abnormal findings', billable: true, chapter: 'Z' },
  { code: 'Z12.11', description: 'Encounter for screening for malignant neoplasm of colon', billable: true, chapter: 'Z' },
  { code: 'Z12.31', description: 'Encounter for screening mammogram for malignant neoplasm of breast', billable: true, chapter: 'Z' },
  { code: 'Z23', description: 'Encounter for immunization', billable: true, chapter: 'Z' },
  { code: 'Z79.4', description: 'Long term (current) use of insulin', billable: true, chapter: 'Z' },
  { code: 'Z79.84', description: 'Long term (current) use of oral hypoglycemic drugs', billable: true, chapter: 'Z' },
  { code: 'Z79.899', description: 'Other long term (current) drug therapy', billable: true, chapter: 'Z' },

  // C — Neoplasms (a few common ones)
  { code: 'C50.911', description: 'Malignant neoplasm of unspecified site of right female breast', billable: true, chapter: 'C' },
  { code: 'C61', description: 'Malignant neoplasm of prostate', billable: true, chapter: 'C' },

  // O — Pregnancy (sample)
  { code: 'O09.90', description: 'Supervision of high risk pregnancy, unspecified, unspecified trimester', billable: true, chapter: 'O' },
];

const byCode = new Map(ICD_CODES.map((e) => [e.code, e]));

export interface IcdSearchOptions extends SearchOptions {
  /** Restrict results to billable (leaf) codes only. */
  billableOnly?: boolean;
}

export const icd = {
  get(code: string): IcdEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly IcdEntry[] {
    return ICD_CODES;
  },
  search(query: string, options?: IcdSearchOptions): readonly IcdEntry[] {
    const filtered = options?.billableOnly
      ? ICD_CODES.filter((e) => e.billable)
      : ICD_CODES;
    return searchEntries([...filtered], query, options);
  },
  isBillable(code: string): boolean {
    return byCode.get(code.toUpperCase())?.billable === true;
  },
  /** Codes by chapter letter (I, E, J, M, F, R, K, N, S, Z, C, O). */
  byChapter(chapter: string): readonly IcdEntry[] {
    return ICD_CODES.filter((e) => e.chapter === chapter.toUpperCase());
  },
};
