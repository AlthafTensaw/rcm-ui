/**
 * NUCC Healthcare Provider Taxonomy — representative sample.
 *
 * Phase 4 of the v3 plan. Source: NUCC public taxonomy.
 *
 * **Status: representative sample.** The full taxonomy has ~870 codes across
 * 4 levels (Group → Classification → Area of Specialization). This bundle
 * ships ~40 of the most common practitioner specialty codes seen in
 * outpatient RCM. The quarterly refresh job expands this to the full table.
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface TaxonomyEntry extends CodeEntryBase {
  /** 10-character code (mix of digits + uppercase letters). */
  code: string;
  description: string;
  /** Top-level grouping. */
  groupName: string;
  /** Classification under the group. */
  classification: string;
  /** Specialization under the classification. */
  specialization: string;
}

export const NUCC_TAXONOMY: readonly TaxonomyEntry[] = [
  // Allopathic & Osteopathic Physicians (207*)
  { code: '207R00000X', description: 'Internal Medicine', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: '' },
  { code: '207RC0000X', description: 'Cardiovascular Disease', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Cardiovascular Disease' },
  { code: '207RE0101X', description: 'Endocrinology, Diabetes & Metabolism', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Endocrinology, Diabetes & Metabolism' },
  { code: '207RG0100X', description: 'Gastroenterology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Gastroenterology' },
  { code: '207RH0000X', description: 'Hematology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Hematology' },
  { code: '207RI0200X', description: 'Infectious Disease', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Infectious Disease' },
  { code: '207RN0300X', description: 'Nephrology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Nephrology' },
  { code: '207RP1001X', description: 'Pulmonary Disease', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Pulmonary Disease' },
  { code: '207RR0500X', description: 'Rheumatology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Internal Medicine', specialization: 'Rheumatology' },
  { code: '208000000X', description: 'Pediatrics', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Pediatrics', specialization: '' },
  { code: '207Q00000X', description: 'Family Medicine', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Family Medicine', specialization: '' },
  { code: '208D00000X', description: 'General Practice', groupName: 'Allopathic & Osteopathic Physicians', classification: 'General Practice', specialization: '' },
  { code: '207V00000X', description: 'Obstetrics & Gynecology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Obstetrics & Gynecology', specialization: '' },
  { code: '2084P0800X', description: 'Psychiatry', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Psychiatry & Neurology', specialization: 'Psychiatry' },
  { code: '2084N0400X', description: 'Neurology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Psychiatry & Neurology', specialization: 'Neurology' },
  { code: '208600000X', description: 'Surgery', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Surgery', specialization: '' },
  { code: '208G00000X', description: 'Thoracic Surgery (Cardiothoracic Vascular Surgery)', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Thoracic Surgery', specialization: '' },
  { code: '207X00000X', description: 'Orthopaedic Surgery', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Orthopaedic Surgery', specialization: '' },
  { code: '207Y00000X', description: 'Otolaryngology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Otolaryngology', specialization: '' },
  { code: '207W00000X', description: 'Ophthalmology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Ophthalmology', specialization: '' },
  { code: '208200000X', description: 'Plastic Surgery', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Plastic Surgery', specialization: '' },
  { code: '2085R0202X', description: 'Diagnostic Radiology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Radiology', specialization: 'Diagnostic Radiology' },
  { code: '2080P0210X', description: 'Pediatric Cardiology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Pediatrics', specialization: 'Pediatric Cardiology' },
  { code: '207L00000X', description: 'Anesthesiology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Anesthesiology', specialization: '' },
  { code: '207ND0900X', description: 'Dermatology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Dermatology', specialization: '' },
  { code: '207P00000X', description: 'Emergency Medicine', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Emergency Medicine', specialization: '' },
  { code: '208M00000X', description: 'Hospitalist', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Hospitalist', specialization: '' },
  { code: '207U00000X', description: 'Nuclear Medicine', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Nuclear Medicine', specialization: '' },
  { code: '207ZP0102X', description: 'Anatomic Pathology', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Pathology', specialization: 'Anatomic Pathology' },
  { code: '208VP0014X', description: 'Pain Medicine', groupName: 'Allopathic & Osteopathic Physicians', classification: 'Pain Medicine', specialization: 'Interventional Pain Medicine' },

  // Behavioral Health (101*, 103*)
  { code: '101Y00000X', description: 'Counselor', groupName: 'Behavioral Health & Social Service Providers', classification: 'Counselor', specialization: '' },
  { code: '103T00000X', description: 'Psychologist', groupName: 'Behavioral Health & Social Service Providers', classification: 'Psychologist', specialization: '' },

  // Nursing Service Providers (363*, 364*)
  { code: '363LF0000X', description: 'Family Nurse Practitioner', groupName: 'Physician Assistants & Advanced Practice Nursing Providers', classification: 'Nurse Practitioner', specialization: 'Family' },
  { code: '363LP2300X', description: 'Primary Care Nurse Practitioner', groupName: 'Physician Assistants & Advanced Practice Nursing Providers', classification: 'Nurse Practitioner', specialization: 'Primary Care' },
  { code: '364SC2300X', description: 'Cardiology Clinical Nurse Specialist', groupName: 'Physician Assistants & Advanced Practice Nursing Providers', classification: 'Clinical Nurse Specialist', specialization: 'Cardiovascular' },
  { code: '363A00000X', description: 'Physician Assistant', groupName: 'Physician Assistants & Advanced Practice Nursing Providers', classification: 'Physician Assistant', specialization: '' },

  // Group practice (193*)
  { code: '193200000X', description: 'Multi-Specialty Group', groupName: 'Group', classification: 'Multi-Specialty', specialization: '' },
  { code: '193400000X', description: 'Single Specialty Group', groupName: 'Group', classification: 'Single Specialty', specialization: '' },
];

const byCode = new Map(NUCC_TAXONOMY.map((e) => [e.code, e]));

export const nucc = {
  get(code: string): TaxonomyEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly TaxonomyEntry[] {
    return NUCC_TAXONOMY;
  },
  search(query: string, options?: SearchOptions): readonly TaxonomyEntry[] {
    return searchEntries([...NUCC_TAXONOMY], query, options);
  },
  /** True if the code is a known taxonomy in the bundled subset. */
  isValid(code: string): boolean {
    return byCode.has(code.toUpperCase());
  },
};
