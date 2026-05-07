/**
 * WorklistShell.
 *
 * Orchestrator for any search-list page. Composes the standard regions in
 * order:
 *
 *   1. Filter strip       (chips + clear all)
 *   2. Bulk action bar    (only when rows are selected)
 *   3. Toolbar            (sort summary, row count, column-visibility menu)
 *   4. Grid               (the SchemaDataGrid with rows + columns)
 *   5. Totals footer      (aggregates + paging controls)
 *
 * The shell is layout-only: it does not own filter, sort, or selection state.
 * The parent page composes those via the standard primitives and passes the
 * resulting nodes / handlers as props. This separation keeps the archetype
 * reusable across worklists with very different filter sets (Claims, AR,
 * Authorizations) while preserving a consistent structure.
 *
 * Loading / empty / error states for the data fetch live above this shell,
 * in the page's data hook. The shell renders rows it's given.
 */

import type { CSSProperties, ReactNode } from 'react';
import {
  SchemaDataGrid,
  type GridSortState,
  type SchemaDataGridColumn,
} from '@tensaw/composition';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { WorklistTotalsFooter } from './WorklistTotalsFooter';

export interface WorklistShellProps<TRow> {
  // ---- Filters -------------------------------------------------------------

  /** Filter strip (composed by the parent — typically a <FilterStrip> with chips). */
  filterStrip?: ReactNode;

  // ---- Bulk action bar -----------------------------------------------------

  /** Bulk action bar (only rendered when selection is non-empty). */
  bulkActionBar?: ReactNode;

  // ---- Mode / heading slot above filters ----------------------------------

  /** Optional content above the filter strip — e.g. a <ModeToggle>. */
  topSlot?: ReactNode;

  // ---- Grid ----------------------------------------------------------------

  rows: TRow[];
  columns: readonly SchemaDataGridColumn<TRow>[];
  getRowId?: (row: TRow, index: number) => string;
  selection: Record<string, boolean>;
  onSelectionChange: (next: Record<string, boolean>) => void;
  selectionMode?: 'none' | 'single' | 'multi';
  onRowClick?: (row: TRow) => void;

  // ---- Sort (server-side, controlled) -------------------------------------

  sort: GridSortState | null;
  onSortChange: (next: GridSortState | null) => void;

  // ---- Column visibility (controlled, persisted by parent) ---------------

  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (next: Record<string, boolean>) => void;
  onColumnVisibilityReset?: () => void;

  // ---- Pagination (server-side, controlled) ------------------------------

  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (next: number) => void;
  onPageSizeChange?: (next: number) => void;

  // ---- Footer aggregates --------------------------------------------------

  /** Slot for aggregate metrics shown on the left side of the footer. */
  footerTotalsSlot?: ReactNode;

  // ---- Density ------------------------------------------------------------

  density?: 'comfortable' | 'compact';
}

export function WorklistShell<TRow>({
  filterStrip,
  bulkActionBar,
  topSlot,
  rows,
  columns,
  getRowId,
  selection,
  onSelectionChange,
  selectionMode = 'multi',
  onRowClick,
  sort,
  onSortChange,
  columnVisibility,
  onColumnVisibilityChange,
  onColumnVisibilityReset,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  footerTotalsSlot,
  density = 'compact',
}: WorklistShellProps<TRow>) {
  const selectedCount = Object.values(selection).filter(Boolean).length;
  const sortLabel = sort
    ? `Sorted by ${getColumnHeader(columns, sort.columnId)} ${sort.direction === 'asc' ? '↑' : '↓'}`
    : null;

  // Pass writable arrays to SchemaDataGrid (its prop type is non-readonly).
  const writableColumns = [...columns];

  return (
    <div style={containerStyle}>
      {topSlot ? <div style={topSlotStyle}>{topSlot}</div> : null}
      {filterStrip}
      {selectedCount > 0 ? bulkActionBar : null}

      <div style={toolbarStyle}>
        <div style={toolbarLeft}>
          {sortLabel ? (
            <span>
              <span style={{ color: 'var(--tw-color-text-muted, #6B7280)' }}>Sorted by </span>
              <span style={{ fontWeight: 500 }}>
                {getColumnHeader(columns, sort?.columnId ?? '')} {sort?.direction === 'asc' ? '↑' : '↓'}
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--tw-color-text-muted, #6B7280)' }}>Sort: default</span>
          )}
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ color: 'var(--tw-color-text-muted, #6B7280)' }}>
            {totalCount} {totalCount === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <ColumnVisibilityMenu
          columns={columns}
          visibility={columnVisibility}
          onChange={onColumnVisibilityChange}
          onReset={onColumnVisibilityReset}
        />
      </div>

      <SchemaDataGrid<TRow>
        rows={rows}
        columns={writableColumns}
        getRowId={getRowId}
        selectionMode={selectionMode}
        selection={selection}
        onSelectionChange={onSelectionChange}
        density={density}
        onRowClick={onRowClick}
        sort={sort}
        onSortChange={onSortChange}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />

      <WorklistTotalsFooter
        totalsSlot={footerTotalsSlot}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function getColumnHeader<TRow>(
  columns: readonly SchemaDataGridColumn<TRow>[],
  id: string,
): string {
  const found = columns.find((c) => c.id === id);
  return found?.header ?? id;
}

// -- Styles ------------------------------------------------------------------

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--tw-color-surface-subtle, #F8FAFB)',
  border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  borderRadius: 12,
  overflow: 'hidden',
};

const topSlotStyle: CSSProperties = {
  padding: '12px 20px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 20px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  fontSize: 11,
};

const toolbarLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: 'var(--tw-color-text-muted, #6B7280)',
};
