/**
 * Reference data fixtures.
 *
 * Stable ids and labels for clinic, provider, payer, and owner ref-data.
 * Used by:
 *   - the multi-select filter chips (which need ref data to display labels)
 *   - the bulk-action owner picker
 *   - the inline cell editor for Owner
 *   - the AR row fixtures (which reference these ids)
 */

import type { RefDataItem } from '../schemas/ar';

export const CLINICS: RefDataItem[] = [
  { id: 'cli_sahd', label: 'SAHD' },
  { id: 'cli_susan_binoy', label: 'Susan Binoy MD' },
  { id: 'cli_urban_physicians', label: 'Urban Physicians' },
  { id: 'cli_dfw_kidney', label: 'DFW Kidney' },
  { id: 'cli_ssmoc', label: 'SSMOC' },
  { id: 'cli_beats', label: 'Beats' },
];

export const PROVIDERS: RefDataItem[] = [
  { id: 'prov_v_makadia', label: 'V Makadia' },
  { id: 'prov_s_binoy', label: 'S Binoy' },
  { id: 'prov_b_mohammed', label: 'B Mohammed' },
  { id: 'prov_s_jalandhara', label: 'S Jalandhara' },
];

export const PAYERS: RefDataItem[] = [
  { id: 'pay_medicare_tx', label: 'Medicare of TX' },
  { id: 'pay_medicaid', label: 'Medicaid' },
  { id: 'pay_bcbs_tx', label: 'BCBS of TX' },
  { id: 'pay_humana', label: 'Humana' },
  { id: 'pay_aetna', label: 'Aetna' },
  { id: 'pay_uhc', label: 'United Healthcare' },
  { id: 'pay_cigna', label: 'Cigna' },
  { id: 'pay_wellpoint', label: 'Wellpoint' },
  { id: 'pay_mutual_omaha', label: 'Mutual of Omaha' },
  { id: 'pay_cash', label: 'Cash' },
];

export const OWNERS: RefDataItem[] = [
  { id: 'usr_vineeth', label: 'Vineeth' },
  { id: 'usr_sridhar', label: 'Sridhar' },
  { id: 'usr_jisna', label: 'Jisna' },
  { id: 'usr_vijaya', label: 'Vijaya' },
  { id: 'usr_kishore', label: 'Kishore' },
  { id: 'usr_sahay_k', label: 'Sahay, K.' },
];
