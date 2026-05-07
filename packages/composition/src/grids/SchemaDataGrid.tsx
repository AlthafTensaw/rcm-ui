/**
 * SchemaDataGrid.
 *
 * TanStack Table wrapped to render from a typed column schema. Used by every
 * worklist, search-list, and tabular-section widget. Built-in features:
 *
 *   - Column show/hide
 *   - Sort by single column (asc/desc/clear)
 *   - Row selection (single or multi)
 *   - Density (comfortable / compact)
 *   - Sticky header
 *   - Empty state when rows.length === 0
 *
 * Column schema lets each column declare:
 *   - id, header, accessorKey
 *   - cell renderer (any ReactNode — e.g. <MoneyCell>, <StatusCell>)
 *   - width, minWidth, align
 *   - sortable
 *   - hidden by default
 *
 * Pagination is left to the caller — pass already-paginated rows. (Real
 * worklists use server-side pagination; client paging belongs in a separate
 * widget.)
 */

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { EmptyState } from '../states';

export interface SchemaDataGridColumn<TRow> {
  id: string;
  header: string;
  /** Function to extract the cell's primitive value from a row. */
  accessorKey?: keyof TRow & string;
  accessor?: (row: TRow) => unknown;
  /** Custom cell renderer. Receives the row + computed value. */
  cell?: (ctx: { row: TRow; value: unknown }) => ReactNode;
  width?: number | string;
  minWidth?: number;
  /**
   * Hard cap on column width. Long values truncate with `…` and the cell sets
   * a `title` attribute so hover shows the full text. Without this, a single
   * long value (e.g. "Elite Cardiovascular Specialists") could expand the
   * column past the width every other row needs.
   */
  maxWidth?: number;
  /**
   * Truncation mode for long text. Default `'tail'` when `maxWidth` is set,
   * `'none'` otherwise.
   */
  truncate?: 'tail' | 'none';
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Hidden by default; user can show via column-toggle UI. */
  defaultHidden?: boolean;
  /**
   * Always-visible. Column-visibility menus must keep this checked and
   * disabled. Use for identity columns (DOS, Patient) that no operator
   * should hide.
   */
  required?: boolean;
}

/**
 * Sort state — used when the grid runs in controlled-sort mode. Pass
 * `sort` and `onSortChange` together; the grid will not re-sort the rows
 * itself (the rows arrive pre-sorted from the server).
 */
export interface GridSortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface SchemaDataGridProps<TRow> {
  rows: TRow[];
  columns: SchemaDataGridColumn<TRow>[];
  /** Function returning a stable id for each row. Default: 'id' field. */
  getRowId?: (row: TRow, index: number) => string;
  /** Selection mode. */
  selectionMode?: 'none' | 'single' | 'multi';
  /** Controlled selection. */
  selection?: Record<string, boolean>;
  onSelectionChange?: (selection: Record<string, boolean>) => void;
  /** Density. */
  density?: 'comfortable' | 'compact';
  /** Empty state title/body. */
  emptyTitle?: string;
  emptyBody?: string;
  /** Click handler for the whole row. */
  onRowClick?: (row: TRow) => void;
  /**
   * Controlled sort. When provided, the grid does NOT sort rows internally —
   * the parent receives sort changes (typically forwarding to a server-side
   * `?sort=...` query) and supplies pre-sorted rows.
   *
   * Leave undefined for client-side default sort.
   */
  sort?: GridSortState | null;
  onSortChange?: (next: GridSortState | null) => void;
  /**
   * Controlled column visibility. When provided, the grid reads visibility
   * from this map and writes changes via `onColumnVisibilityChange`. The
   * parent typically persists this to the user-preferences slice.
   */
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void;
}

export function SchemaDataGrid<TRow>({
  rows,
  columns,
  getRowId,
  selectionMode = 'none',
  selection,
  onSelectionChange,
  density = 'comfortable',
  emptyTitle = 'No results',
  emptyBody,
  onRowClick,
  sort,
  onSortChange,
  columnVisibility,
  onColumnVisibilityChange,
}: SchemaDataGridProps<TRow>) {
  // Sort state. If controlled (sort + onSortChange), don't sort internally.
  const isSortControlled = sort !== undefined;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sortingState: SortingState = isSortControlled
    ? sort === null
      ? []
      : [{ id: sort.columnId, desc: sort.direction === 'desc' }]
    : internalSorting;

  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});

  // Column visibility — controlled if both props supplied.
  const isVisibilityControlled =
    columnVisibility !== undefined && onColumnVisibilityChange !== undefined;
  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>(() =>
    Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, false])),
  );
  const visibilityState: VisibilityState = isVisibilityControlled
    ? columnVisibility
    : internalVisibility;

  const isSelectionControlled = selection !== undefined;
  const rowSelection = isSelectionControlled ? selection : internalSelection;

  const tanstackColumns = useMemo<ColumnDef<TRow>[]>(() => {
    return columns.map((col) => {
      const customAccessor = col.accessor;
      const keyAccessor = col.accessorKey;
      const def: ColumnDef<TRow> = {
        id: col.id,
        header: col.header,
        accessorFn: customAccessor
          ? (row: TRow) => customAccessor(row)
          : keyAccessor
            ? (row: TRow) => row[keyAccessor as keyof TRow]
            : undefined,
        cell: ({ row, getValue }) =>
          col.cell
            ? col.cell({ row: row.original, value: getValue() })
            : (getValue() as ReactNode) ?? null,
        enableSorting: col.sortable !== false,
      };
      if (col.width !== undefined) def.size = typeof col.width === 'number' ? col.width : undefined;
      if (col.minWidth !== undefined) def.minSize = col.minWidth;
      return def;
    });
  }, [columns]);

  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    state: {
      sorting: sortingState,
      rowSelection,
      columnVisibility: visibilityState,
    },
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multi',
    // When controlled, disable client-side sorting (rows arrive pre-sorted).
    manualSorting: isSortControlled,
    getRowId: getRowId
      ? (row, index) => getRowId(row, index)
      : (row, index) => {
          const r = row as unknown as Record<string, unknown>;
          return typeof r.id === 'string' || typeof r.id === 'number'
            ? String(r.id)
            : String(index);
        },
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(sortingState) : updater;
      if (isSortControlled) {
        const first = next[0];
        if (!first) {
          onSortChange?.(null);
        } else {
          onSortChange?.({
            columnId: first.id,
            direction: first.desc ? 'desc' : 'asc',
          });
        }
      } else {
        setInternalSorting(next);
      }
    },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      if (isSelectionControlled) {
        onSelectionChange?.(next);
      } else {
        setInternalSelection(next);
      }
    },
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(visibilityState) : updater;
      if (isVisibilityControlled) {
        onColumnVisibilityChange(next);
      } else {
        setInternalVisibility(next);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Build column-by-id map for alignment lookup. Must run on EVERY render
  // (before any early return) — calling fewer hooks on a subsequent render
  // would violate the rules of hooks.
  const colMeta = useMemo(() => {
    const map = new Map<string, SchemaDataGridColumn<TRow>>();
    for (const c of columns) map.set(c.id, c);
    return map;
  }, [columns]);

  // Empty state takes precedence.
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  const cellPad = density === 'compact' ? '6px 10px' : '10px 14px';

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead style={theadStyle}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const col = colMeta.get(header.column.id);
                const sortDir = header.column.getIsSorted();
                const align = col?.align ?? 'left';
                const headerStyle: CSSProperties = {
                  ...thStyle,
                  padding: cellPad,
                  textAlign: align,
                  cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  width: col?.width,
                  minWidth: col?.minWidth,
                  maxWidth: col?.maxWidth,
                };
                return (
                  <th
                    key={header.id}
                    style={headerStyle}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sortDir === 'asc' ? <span style={sortGlyph}> ▲</span> : null}
                    {sortDir === 'desc' ? <span style={sortGlyph}> ▼</span> : null}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.getIsSelected();
            return (
              <tr
                key={row.id}
                onClick={() => {
                  if (onRowClick) onRowClick(row.original);
                  if (selectionMode !== 'none') row.toggleSelected();
                }}
                style={{
                  ...tdRowStyle(isSelected),
                  cursor: onRowClick || selectionMode !== 'none' ? 'pointer' : 'default',
                }}
                aria-selected={isSelected || undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const col = colMeta.get(cell.column.id);
                  const truncate =
                    col?.truncate === 'tail' ||
                    (col?.truncate !== 'none' && col?.maxWidth !== undefined);
                  const tdInlineStyle: CSSProperties = {
                    ...tdStyle,
                    padding: cellPad,
                    textAlign: col?.align ?? 'left',
                    maxWidth: col?.maxWidth,
                  };
                  // Compute a string for the title attribute (hover tooltip).
                  // Skip if the cell is non-string (custom React node) — title
                  // wouldn't be meaningful and the renderer can set its own.
                  const value = cell.getValue();
                  const titleText =
                    truncate && (typeof value === 'string' || typeof value === 'number')
                      ? String(value)
                      : undefined;
                  const cellNode = flexRender(cell.column.columnDef.cell, cell.getContext());
                  return (
                    <td key={cell.id} style={tdInlineStyle} title={titleText}>
                      {truncate ? (
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {cellNode}
                        </div>
                      ) : (
                        cellNode
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// -- Styles -------------------------------------------------------------------

const containerStyle: CSSProperties = {
  width: '100%',
  overflow: 'auto',
  border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  borderRadius: 8,
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
};

const theadStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: 'var(--tw-color-table-header-bg, #EBF7F6)',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--tw-color-text-accent, #218D8D)',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const tdRowStyle = (selected: boolean): CSSProperties => ({
  background: selected ? 'var(--tw-color-brand-tint, #EBF7F6)' : 'transparent',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
});

const tdStyle: CSSProperties = {
  color: 'var(--tw-color-text-primary, #1F2937)',
};

const sortGlyph: CSSProperties = {
  fontSize: 9,
  color: 'var(--tw-color-text-muted, #6B7280)',
};
