/**
 * @tensaw/codes
 *
 * RCM reference data tables and lookup helpers.
 * Phase 4 of the v3 plan.
 *
 * Public API: a single `codes` namespace plus per-domain named exports for
 * tree-shaking. Most consumers should import from the per-domain entry points
 * (`@tensaw/codes/icd`, `@tensaw/codes/states`, etc.) so unused domains drop
 * from the bundle.
 *
 * Coverage status (see README for full detail):
 *   - states         — full data (50 + DC + 5 territories)
 *   - pos            — full data (CMS public)
 *   - cas-group      — full data (4 entries)
 *   - workflow       — full data (Tensaw-defined)
 *   - adjustment-reason — full data (Tensaw-defined)
 *   - plan-type      — sample (~20 of 200+)
 *   - carc           — sample (top ~50 of 285+)
 *   - rarc           — sample (top ~40 of 700+)
 *   - icd            — sample (~70 of 70,000+; quarterly refresh expands)
 *   - hcpcs          — sample (~25 of thousands)
 *   - nucc-taxonomy  — sample (~40 of 870)
 *   - cpt            — STUB (AMA license required; server-adapter pattern)
 *   - zip            — zip3-prefix mapping (covers 99% by zip3)
 */

export const PACKAGE_VERSION = '0.0.0';

// Shared types
export type { CodeEntryBase, LookupResult, SearchOptions } from './types';
export { isActiveAt, scoreMatch, searchEntries } from './types';

// Subdomain exports — also accessible via per-path imports for tree-shaking
export { states, US_STATES, type UsStateEntry } from './states';
export { zip } from './zip';
export { pos, POS_CODES, type PosEntry } from './pos';
export { carc, CARC_CODES, type CarcEntry } from './carc';
export { rarc, RARC_CODES, type RarcEntry } from './rarc';
export { casGroup, CAS_GROUP_CODES, type CasGroupEntry } from './cas-group';
export {
  adjustmentReasonCategories,
  ADJUSTMENT_REASON_CATEGORIES,
  type AdjustmentReasonCategoryEntry,
} from './adjustment-reason';
export {
  workflow,
  WORKFLOW_BUCKETS,
  type WorkflowBucketCode,
  type WorkflowBucketEntry,
} from './workflow';
export { planType, PLAN_TYPES, type PlanTypeEntry } from './plan-type';
export { icd, ICD_CODES, type IcdEntry, type IcdSearchOptions } from './icd';
export { hcpcs, HCPCS_CODES, type HcpcsEntry } from './hcpcs';
export { nucc, NUCC_TAXONOMY, type TaxonomyEntry } from './nucc-taxonomy';
export { cpt, type CptEntry, type CptServerAdapter } from './cpt';

// Re-import for the unified namespace
import { states } from './states';
import { zip } from './zip';
import { pos } from './pos';
import { carc } from './carc';
import { rarc } from './rarc';
import { casGroup } from './cas-group';
import { adjustmentReasonCategories } from './adjustment-reason';
import { workflow } from './workflow';
import { planType } from './plan-type';
import { icd } from './icd';
import { hcpcs } from './hcpcs';
import { nucc } from './nucc-taxonomy';
import { cpt } from './cpt';

/**
 * Unified namespace. Use this for ergonomic discovery (`codes.icd.search(...)`).
 * For tree-shaking, prefer per-path imports.
 */
export const codes = {
  states,
  zip,
  pos,
  carc,
  rarc,
  casGroup,
  adjustmentReasonCategories,
  workflow,
  planType,
  icd,
  hcpcs,
  nucc,
  cpt,
} as const;
