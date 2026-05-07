/**
 * Status taxonomy registry.
 *
 * Phase 5 of the v3 plan. ONE component shape (`<StatusBadge>`) drives every
 * status pill in the platform. New taxonomies = registry entries, not new
 * components.
 *
 * Each taxonomy is a map from a status key string to a triplet of CSS-variable
 * roles (background, border, text) plus an optional dot color and label.
 *
 * Adding a new taxonomy:
 *   1. Add the key to `BuiltInTaxonomyName` union.
 *   2. Add the taxonomy table below.
 *   3. Register it in `BUILT_IN_TAXONOMIES`.
 *   4. Add a sample to Storybook (Phase 8).
 *
 * Custom taxonomies can be registered at runtime via `registerTaxonomy()` —
 * useful for app-specific status types not in the built-in set.
 */

export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'pending'
  | 'inactive';

export interface StatusEntry {
  /** Display label. */
  label: string;
  /** Visual tone — drives bg/border/text via CSS variables. */
  tone: StatusTone;
  /** Optional priority indicator (1=highest). Used for sorting. */
  priority?: number;
}

/** A taxonomy is a record from status key → entry. */
export type StatusTaxonomy = Record<string, StatusEntry>;

// -- Built-in taxonomies -----------------------------------------------------

const claim: StatusTaxonomy = {
  open: { label: 'Open', tone: 'info' },
  filed: { label: 'Filed', tone: 'info' },
  pending: { label: 'Pending', tone: 'pending' },
  partially_paid: { label: 'Partially Paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  denied: { label: 'Denied', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'danger' },
  voided: { label: 'Voided', tone: 'inactive' },
  appealed: { label: 'Appealed', tone: 'warning' },
  secondary: { label: 'Secondary', tone: 'info' },
  tertiary: { label: 'Tertiary', tone: 'info' },
};

const eob: StatusTaxonomy = {
  failed_parsing: { label: 'Failed Parsing', tone: 'danger', priority: 1 },
  parsed_needs_review: { label: 'Parsed - Needs Review', tone: 'warning', priority: 2 },
  assigned: { label: 'Assigned', tone: 'info', priority: 3 },
  in_progress: { label: 'In Progress', tone: 'pending', priority: 4 },
  completed: { label: 'Completed', tone: 'success', priority: 5 },
};

const appointment: StatusTaxonomy = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  confirmed: { label: 'Confirm', tone: 'info' },
  checked_in: { label: 'Checked In', tone: 'success' },
  in_room: { label: 'In Room', tone: 'pending' },
  checked_out: { label: 'Checked Out', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancel', tone: 'inactive' },
  no_show: { label: 'No-Show', tone: 'danger' },
};

const payment: StatusTaxonomy = {
  posted: { label: 'Posted', tone: 'success' },
  pending: { label: 'Pending', tone: 'pending' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'inactive' },
  partially_refunded: { label: 'Partially Refunded', tone: 'warning' },
};

const auth: StatusTaxonomy = {
  pending: { label: 'Pending', tone: 'pending' },
  approved: { label: 'Approved', tone: 'success' },
  denied: { label: 'Denied', tone: 'danger' },
  expired: { label: 'Expired', tone: 'inactive' },
};

const eligibility: StatusTaxonomy = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'inactive' },
  pending: { label: 'Pending', tone: 'pending' },
  unknown: { label: 'Unknown', tone: 'neutral' },
};

const workflow: StatusTaxonomy = {
  pending: { label: 'Pending', tone: 'pending' },
  in_review: { label: 'In Review', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  escalated: { label: 'Escalated', tone: 'danger' },
  on_hold: { label: 'On Hold', tone: 'warning' },
};

const priority: StatusTaxonomy = {
  high: { label: 'High', tone: 'danger', priority: 1 },
  medium: { label: 'Medium', tone: 'warning', priority: 2 },
  low: { label: 'Low', tone: 'success', priority: 3 },
  sla_breached: { label: 'SLA Breached', tone: 'danger', priority: 0 },
};

const aging_bucket: StatusTaxonomy = {
  '0-30': { label: '0-30 days', tone: 'success' },
  '31-60': { label: '31-60 days', tone: 'info' },
  '61-90': { label: '61-90 days', tone: 'warning' },
  '91-120': { label: '91-120 days', tone: 'danger' },
  '120+': { label: '120+ days', tone: 'danger' },
};

// -- Registry ----------------------------------------------------------------

export const BUILT_IN_TAXONOMIES = {
  claim,
  eob,
  appointment,
  payment,
  auth,
  eligibility,
  workflow,
  priority,
  'aging-bucket': aging_bucket,
} as const;

export type BuiltInTaxonomyName = keyof typeof BUILT_IN_TAXONOMIES;

const customRegistry = new Map<string, StatusTaxonomy>();

/**
 * Register a custom taxonomy. Useful for app-specific status sets that don't
 * fit the built-in catalog.
 */
export function registerTaxonomy(name: string, taxonomy: StatusTaxonomy): void {
  customRegistry.set(name, taxonomy);
}

/** Look up a taxonomy by name. Returns undefined if not registered. */
export function getTaxonomy(name: string): StatusTaxonomy | undefined {
  if (name in BUILT_IN_TAXONOMIES) {
    return BUILT_IN_TAXONOMIES[name as BuiltInTaxonomyName];
  }
  return customRegistry.get(name);
}

/** Look up an entry within a taxonomy. Returns undefined if either is unknown. */
export function getStatusEntry(
  taxonomyName: string,
  statusKey: string,
): StatusEntry | undefined {
  const taxonomy = getTaxonomy(taxonomyName);
  if (!taxonomy) return undefined;
  return taxonomy[statusKey];
}

/** Test helper: clear custom taxonomies. */
export function _resetCustomTaxonomies(): void {
  customRegistry.clear();
}
