/**
 * US states, DC, and applicable territories.
 *
 * Phase 4 of the v3 plan. Used by AddressBlock and StateSelect in the
 * design-system. Geography lock per the plan: US-only.
 */

export interface UsStateEntry {
  /** Two-letter postal abbreviation. */
  code: string;
  /** Full name. */
  name: string;
  /** True for one of the 50 states (excludes DC + territories). */
  isState: boolean;
  /** True for DC. */
  isDistrict: boolean;
  /** True for the 5 inhabited US territories. */
  isTerritory: boolean;
}

export const US_STATES: readonly UsStateEntry[] = [
  // 50 states
  { code: 'AL', name: 'Alabama', isState: true, isDistrict: false, isTerritory: false },
  { code: 'AK', name: 'Alaska', isState: true, isDistrict: false, isTerritory: false },
  { code: 'AZ', name: 'Arizona', isState: true, isDistrict: false, isTerritory: false },
  { code: 'AR', name: 'Arkansas', isState: true, isDistrict: false, isTerritory: false },
  { code: 'CA', name: 'California', isState: true, isDistrict: false, isTerritory: false },
  { code: 'CO', name: 'Colorado', isState: true, isDistrict: false, isTerritory: false },
  { code: 'CT', name: 'Connecticut', isState: true, isDistrict: false, isTerritory: false },
  { code: 'DE', name: 'Delaware', isState: true, isDistrict: false, isTerritory: false },
  { code: 'FL', name: 'Florida', isState: true, isDistrict: false, isTerritory: false },
  { code: 'GA', name: 'Georgia', isState: true, isDistrict: false, isTerritory: false },
  { code: 'HI', name: 'Hawaii', isState: true, isDistrict: false, isTerritory: false },
  { code: 'ID', name: 'Idaho', isState: true, isDistrict: false, isTerritory: false },
  { code: 'IL', name: 'Illinois', isState: true, isDistrict: false, isTerritory: false },
  { code: 'IN', name: 'Indiana', isState: true, isDistrict: false, isTerritory: false },
  { code: 'IA', name: 'Iowa', isState: true, isDistrict: false, isTerritory: false },
  { code: 'KS', name: 'Kansas', isState: true, isDistrict: false, isTerritory: false },
  { code: 'KY', name: 'Kentucky', isState: true, isDistrict: false, isTerritory: false },
  { code: 'LA', name: 'Louisiana', isState: true, isDistrict: false, isTerritory: false },
  { code: 'ME', name: 'Maine', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MD', name: 'Maryland', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MA', name: 'Massachusetts', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MI', name: 'Michigan', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MN', name: 'Minnesota', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MS', name: 'Mississippi', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MO', name: 'Missouri', isState: true, isDistrict: false, isTerritory: false },
  { code: 'MT', name: 'Montana', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NE', name: 'Nebraska', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NV', name: 'Nevada', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NH', name: 'New Hampshire', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NJ', name: 'New Jersey', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NM', name: 'New Mexico', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NY', name: 'New York', isState: true, isDistrict: false, isTerritory: false },
  { code: 'NC', name: 'North Carolina', isState: true, isDistrict: false, isTerritory: false },
  { code: 'ND', name: 'North Dakota', isState: true, isDistrict: false, isTerritory: false },
  { code: 'OH', name: 'Ohio', isState: true, isDistrict: false, isTerritory: false },
  { code: 'OK', name: 'Oklahoma', isState: true, isDistrict: false, isTerritory: false },
  { code: 'OR', name: 'Oregon', isState: true, isDistrict: false, isTerritory: false },
  { code: 'PA', name: 'Pennsylvania', isState: true, isDistrict: false, isTerritory: false },
  { code: 'RI', name: 'Rhode Island', isState: true, isDistrict: false, isTerritory: false },
  { code: 'SC', name: 'South Carolina', isState: true, isDistrict: false, isTerritory: false },
  { code: 'SD', name: 'South Dakota', isState: true, isDistrict: false, isTerritory: false },
  { code: 'TN', name: 'Tennessee', isState: true, isDistrict: false, isTerritory: false },
  { code: 'TX', name: 'Texas', isState: true, isDistrict: false, isTerritory: false },
  { code: 'UT', name: 'Utah', isState: true, isDistrict: false, isTerritory: false },
  { code: 'VT', name: 'Vermont', isState: true, isDistrict: false, isTerritory: false },
  { code: 'VA', name: 'Virginia', isState: true, isDistrict: false, isTerritory: false },
  { code: 'WA', name: 'Washington', isState: true, isDistrict: false, isTerritory: false },
  { code: 'WV', name: 'West Virginia', isState: true, isDistrict: false, isTerritory: false },
  { code: 'WI', name: 'Wisconsin', isState: true, isDistrict: false, isTerritory: false },
  { code: 'WY', name: 'Wyoming', isState: true, isDistrict: false, isTerritory: false },
  // District
  { code: 'DC', name: 'District of Columbia', isState: false, isDistrict: true, isTerritory: false },
  // Territories
  { code: 'AS', name: 'American Samoa', isState: false, isDistrict: false, isTerritory: true },
  { code: 'GU', name: 'Guam', isState: false, isDistrict: false, isTerritory: true },
  { code: 'MP', name: 'Northern Mariana Islands', isState: false, isDistrict: false, isTerritory: true },
  { code: 'PR', name: 'Puerto Rico', isState: false, isDistrict: false, isTerritory: true },
  { code: 'VI', name: 'U.S. Virgin Islands', isState: false, isDistrict: false, isTerritory: true },
];

const byCode = new Map(US_STATES.map((s) => [s.code, s]));

export const states = {
  /** Look up a state by its two-letter code. */
  get(code: string): UsStateEntry | undefined {
    return byCode.get(code.toUpperCase());
  },
  /** Full list (50 states + DC + 5 territories). */
  list(): readonly UsStateEntry[] {
    return US_STATES;
  },
  /** 50 states only (no DC or territories). */
  listStates(): readonly UsStateEntry[] {
    return US_STATES.filter((s) => s.isState);
  },
  /** True if the given code is a recognized US state, DC, or territory. */
  isValid(code: string): boolean {
    return byCode.has(code.toUpperCase());
  },
};
