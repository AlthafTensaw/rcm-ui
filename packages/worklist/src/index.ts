/**
 * @tensaw/worklist
 *
 * Search-list archetype primitives. Composes the standard parts of a
 * worklist page: filter strip with multi-select chips, column visibility
 * menu, bulk action bar, totals footer with paging, mode toggle, and the
 * WorklistShell orchestrator that wires them together.
 *
 * Pages built on top:
 *   - AR Mgmt Portal (working list ↔ add to workflow)
 *   - Claims Search (read-only)
 *   - Authorization Worklist
 *   - Patient Search
 */

export const PACKAGE_VERSION = '0.0.0';

// Primitives
export { FilterStrip, type FilterStripProps } from './primitives/FilterStrip';
export {
  MultiSelectComboboxFilter,
  type MultiSelectComboboxFilterProps,
  type RefItem,
} from './primitives/MultiSelectComboboxFilter';
export {
  ColumnVisibilityMenu,
  type ColumnVisibilityMenuProps,
  type ColumnVisibilityColumn,
} from './primitives/ColumnVisibilityMenu';
export { BulkActionBar, type BulkActionBarProps } from './primitives/BulkActionBar';
export {
  WorklistTotalsFooter,
  type WorklistTotalsFooterProps,
} from './primitives/WorklistTotalsFooter';
export {
  ModeToggle,
  type ModeToggleProps,
  type ModeOption,
} from './primitives/ModeToggle';
export {
  WorklistShell,
  type WorklistShellProps,
} from './primitives/WorklistShell';

// Hooks
export {
  useColumnVisibility,
  type UseColumnVisibilityOptions,
  type UseColumnVisibilityResult,
} from './useColumnVisibility';
