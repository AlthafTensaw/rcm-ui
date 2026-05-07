/**
 * HCPCS Level II codes — representative sample.
 *
 * Phase 4 of the v3 plan. Source: CMS public domain HCPCS Level II.
 *
 * **Status: representative sample.** The full HCPCS Level II catalog has
 * thousands of codes (DME, drugs, supplies, ambulance, behavioral). This
 * bundle ships ~30 of the most commonly seen codes in outpatient RCM.
 *
 * Each HCPCS Level II code is a letter prefix + 4 digits (`A0428`, `J1100`,
 * `G0438`).
 */

import type { CodeEntryBase, SearchOptions } from '../types';
import { searchEntries } from '../types';

export interface HcpcsEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** Letter prefix category (A, B, C, ...). */
  category: string;
}

export const HCPCS_CODES: readonly HcpcsEntry[] = [
  // A — Transportation, medical/surgical supplies
  { code: 'A0428', description: 'Ambulance service, basic life support, non-emergency transport', category: 'A' },
  { code: 'A0429', description: 'Ambulance service, basic life support, emergency transport', category: 'A' },

  // E — Durable Medical Equipment
  { code: 'E0114', description: 'Crutches underarm, other than wood, adjustable or fixed, pair, with pads, tips and handgrips', category: 'E' },
  { code: 'E0143', description: 'Walker, folding, wheeled, adjustable or fixed height', category: 'E' },
  { code: 'E0181', description: 'Powered pressure reducing mattress overlay', category: 'E' },
  { code: 'E0260', description: 'Hospital bed, semi-electric (head and foot adjustment), with any type side rails, with mattress', category: 'E' },
  { code: 'E0570', description: 'Nebulizer, with compressor', category: 'E' },
  { code: 'E0601', description: 'Continuous positive airway pressure (CPAP) device', category: 'E' },

  // G — Procedures/professional services (temporary codes)
  { code: 'G0008', description: 'Administration of influenza virus vaccine', category: 'G' },
  { code: 'G0009', description: 'Administration of pneumococcal vaccine', category: 'G' },
  { code: 'G0438', description: 'Annual wellness visit; includes a personalized prevention plan of service (PPS), initial visit', category: 'G' },
  { code: 'G0439', description: 'Annual wellness visit; includes a personalized prevention plan of service (PPS), subsequent visit', category: 'G' },

  // J — Drugs administered other than oral
  { code: 'J0696', description: 'Injection, ceftriaxone sodium, per 250 mg', category: 'J' },
  { code: 'J1100', description: 'Injection, dexamethasone sodium phosphate, 1 mg', category: 'J' },
  { code: 'J1885', description: 'Injection, ketorolac tromethamine, per 15 mg', category: 'J' },
  { code: 'J3301', description: 'Injection, triamcinolone acetonide, not otherwise specified, 10 mg', category: 'J' },
  { code: 'J7613', description: 'Albuterol, inhalation solution, FDA-approved final product, non-compounded, administered through DME, unit dose, 1 mg', category: 'J' },

  // K — Temporary codes (DME / supplies)
  { code: 'K0001', description: 'Standard wheelchair', category: 'K' },
  { code: 'K0813', description: 'Power wheelchair, group 1 standard, portable, sling/solid seat and back, patient weight capacity up to and including 300 pounds', category: 'K' },

  // L — Orthotic & prosthetic procedures
  { code: 'L0631', description: 'Lumbar-sacral orthosis, sagittal control, with rigid anterior and posterior panels, prefabricated, off-the-shelf', category: 'L' },
  { code: 'L1832', description: 'Knee orthosis, adjustable knee joints (unicentric or polycentric), positional orthosis, rigid support, prefabricated, off-the-shelf', category: 'L' },

  // Q — Temporary (supplies and services)
  { code: 'Q4081', description: 'Injection, epoetin alfa, 100 units (for ESRD on dialysis)', category: 'Q' },

  // S — Temporary national codes (private payer)
  { code: 'S0257', description: 'Counseling and discussion regarding advance directives or end of life care planning', category: 'S' },
];

const byCode = new Map(HCPCS_CODES.map((e) => [e.code, e]));

export const hcpcs = {
  get(code: string): HcpcsEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  list(): readonly HcpcsEntry[] {
    return HCPCS_CODES;
  },
  search(query: string, options?: SearchOptions): readonly HcpcsEntry[] {
    return searchEntries([...HCPCS_CODES], query, options);
  },
  byCategory(category: string): readonly HcpcsEntry[] {
    return HCPCS_CODES.filter((e) => e.category === category.toUpperCase());
  },
};
