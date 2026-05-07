/**
 * ZIP code → US state lookup.
 *
 * Phase 4 of the v3 plan.
 *
 * **Status: zip3-prefix mapping.** Full ZIP-to-state requires a USPS database
 * of ~42,000 individual ZIPs that crosses state boundaries in a few cases.
 * This bundle ships the zip3 prefix → primary state map, which is correct for
 * ~99% of ZIPs. For the rare boundary cases (e.g. some ZIPs straddle two
 * states), the result is the dominant state.
 *
 * Use `zip.toState('94103')` → `'CA'`. Use this for **soft validation** and
 * **autofill** only; for hard correctness, use a USPS API.
 */

/**
 * zip3 prefix → state code.
 * Source: USPS published ZIP code prefix table.
 */
const ZIP3_TO_STATE: Record<string, string> = {
  // 005-009: PR / VI
  '006': 'PR', '007': 'PR', '008': 'PR', '009': 'PR',
  // 010-027: MA
  '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA',
  '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA', '020': 'MA', '021': 'MA',
  '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
  // 028-029: RI
  '028': 'RI', '029': 'RI',
  // 030-038: NH
  '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH',
  '036': 'NH', '037': 'NH', '038': 'NH',
  // 039-049: ME
  '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME',
  '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
  // 050-059: VT
  '050': 'VT', '051': 'VT', '052': 'VT', '053': 'VT', '054': 'VT', '055': 'VT',
  '056': 'VT', '057': 'VT', '058': 'VT', '059': 'VT',
  // 060-069: CT
  '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT',
  '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
  // 070-089: NJ
  '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ',
  '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ', '080': 'NJ', '081': 'NJ',
  '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ',
  '088': 'NJ', '089': 'NJ',
  // 100-149: NY
  ...zipRange('100', '149', 'NY'),
  // 150-196: PA
  ...zipRange('150', '196', 'PA'),
  // 197-199: DE
  '197': 'DE', '198': 'DE', '199': 'DE',
  // 200-205: DC
  '200': 'DC', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC',
  // 206-219: MD
  ...zipRange('206', '219', 'MD'),
  // 220-246: VA
  ...zipRange('220', '246', 'VA'),
  // 247-268: WV
  ...zipRange('247', '268', 'WV'),
  // 270-289: NC
  ...zipRange('270', '289', 'NC'),
  // 290-299: SC
  ...zipRange('290', '299', 'SC'),
  // 300-319: GA
  ...zipRange('300', '319', 'GA'),
  // 320-349: FL
  ...zipRange('320', '349', 'FL'),
  // 350-369: AL
  ...zipRange('350', '369', 'AL'),
  // 370-385: TN
  ...zipRange('370', '385', 'TN'),
  // 386-397: MS
  ...zipRange('386', '397', 'MS'),
  // 400-427: KY
  ...zipRange('400', '427', 'KY'),
  // 430-459: OH
  ...zipRange('430', '459', 'OH'),
  // 460-479: IN
  ...zipRange('460', '479', 'IN'),
  // 480-499: MI
  ...zipRange('480', '499', 'MI'),
  // 500-528: IA
  ...zipRange('500', '528', 'IA'),
  // 530-549: WI
  ...zipRange('530', '549', 'WI'),
  // 550-567: MN
  ...zipRange('550', '567', 'MN'),
  // 569-579: SD
  ...zipRange('570', '577', 'SD'),
  // 580-588: ND
  ...zipRange('580', '588', 'ND'),
  // 590-599: MT
  ...zipRange('590', '599', 'MT'),
  // 600-629: IL
  ...zipRange('600', '629', 'IL'),
  // 630-658: MO
  ...zipRange('630', '658', 'MO'),
  // 660-679: KS
  ...zipRange('660', '679', 'KS'),
  // 680-693: NE
  ...zipRange('680', '693', 'NE'),
  // 700-714: LA
  ...zipRange('700', '714', 'LA'),
  // 716-729: AR
  ...zipRange('716', '729', 'AR'),
  // 730-749: OK
  ...zipRange('730', '749', 'OK'),
  // 750-799: TX
  ...zipRange('750', '799', 'TX'),
  // 800-816: CO
  ...zipRange('800', '816', 'CO'),
  // 820-831: WY
  ...zipRange('820', '831', 'WY'),
  // 832-838: ID
  ...zipRange('832', '838', 'ID'),
  // 840-847: UT
  ...zipRange('840', '847', 'UT'),
  // 850-865: AZ
  ...zipRange('850', '865', 'AZ'),
  // 870-884: NM
  ...zipRange('870', '884', 'NM'),
  // 889-898: NV
  ...zipRange('889', '898', 'NV'),
  // 900-961: CA
  ...zipRange('900', '961', 'CA'),
  // 967-968: HI
  '967': 'HI', '968': 'HI',
  // 969: GU/MP/AS
  '969': 'GU',
  // 970-979: OR
  ...zipRange('970', '979', 'OR'),
  // 980-994: WA
  ...zipRange('980', '994', 'WA'),
  // 995-999: AK
  ...zipRange('995', '999', 'AK'),
};

function zipRange(start: string, end: string, state: string): Record<string, string> {
  const out: Record<string, string> = {};
  const s = parseInt(start, 10);
  const e = parseInt(end, 10);
  for (let i = s; i <= e; i++) {
    out[String(i).padStart(3, '0')] = state;
  }
  return out;
}

export const zip = {
  /**
   * Look up the state for a 5-digit (or 5+4) ZIP code. Returns undefined for
   * malformed input or unmapped prefix.
   */
  toState(zipCode: string): string | undefined {
    if (!zipCode) return undefined;
    const cleaned = zipCode.replace(/\D/g, '').slice(0, 5);
    if (cleaned.length < 3) return undefined;
    return ZIP3_TO_STATE[cleaned.slice(0, 3)];
  },
  /** True if the ZIP appears valid for the given state. */
  matchesState(zipCode: string, state: string): boolean {
    const expected = zip.toState(zipCode);
    return expected?.toUpperCase() === state.toUpperCase();
  },
  /** Validate format only (5 or 5+4). */
  isWellFormed(zipCode: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(zipCode.trim());
  },
};
