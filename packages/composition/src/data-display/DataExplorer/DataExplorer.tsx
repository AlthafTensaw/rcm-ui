/**
 * DataExplorer — the table shell.
 *
 * Wraps `<SchemaDataGrid>` (sibling in `@tensaw/composition/grids`) with a
 * standard toolbar / filter row / bulk-actions row / pagination footer.
 * The most-used component in the operations console; takes a list of rows
 * and columns plus controlled state for search, sort, selection,
 * pagination, density, and column visibility.
 *
 * Visual layout (top → bottom):
 *   1. Actions row (above search bar) — `actions` slot
 *   2. Toolbar — search input (left), density toggle + column-visibility
 *      menu (right)
 *   3. Filters — `filters` slot (rendered as-is; consumers compose chips/dropdowns)
 *   4. Bulk-actions row — only when rows are selected; renders `bulkActions`
 *      slot beside a "N selected" label
 *   5. Grid — `<SchemaDataGrid>` (or its loading/error/empty replacements)
 *   6. Pagination footer — `<Pagination>` from @tensaw/design-system
 *
 * State semantics:
 *   - Pagination is controlled (required `pageIndex`, `pageSize`,
 *     `onPageChange`)
 *   - Search is controlled OR uncontrolled (consumer can omit
 *     `onSearchChange` for static filtering elsewhere)
 *   - Sort, selection, density, column visibility are all controlled with
 *     their respective optional handlers
 *
 * Selection is exposed as `selectedIds: string[]` for ergonomics; we
 * convert at the `<SchemaDataGrid>` boundary (the underlying grid uses
 * `Record<string, boolean>`).
 *
 * Architectural note: this component lives in `@tensaw/composition/data-display`
 * rather than `@tensaw/design-system/data-display` because it depends on
 * `<SchemaDataGrid>` in this package and design-system depending on
 * composition would create a graph cycle (composition already depends on
 * design-system). Pagination lives in design-system; everything else
 * follows the spec's API contract.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  EmptyState,
  Icon,
  IconButton,
  Input,
  Pagination,
  Skeleton,
  Switch,
} from '@tensaw/design-system';

import {
  SchemaDataGrid,
  type GridSortState,
  type SchemaDataGridColumn,
} from '../../grids';

export interface DataExplorerProps<TRow> {
  // Data
  rows: TRow[];
  columns: SchemaDataGridColumn<TRow>[];
  totalRows: number;
  /** Stable id getter; default reads `id` field. */
  getRowId?: (row: TRow, index: number) => string;

  // Toolbar
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchDebounceMs?: number;

  // Filters: render-prop for custom filter UI
  filters?: ReactNode;

  // Column visibility
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (hidden: string[]) => void;

  // Sort (controlled)
  sort?: GridSortState | null;
  onSortChange?: (sort: GridSortState | null) => void;

  // Pagination (controlled)
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  // Selection
  selectionMode?: 'none' | 'single' | 'multi';
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: ReactNode;

  // Density
  density?: 'comfortable' | 'compact';
  onDensityChange?: (density: 'comfortable' | 'compact') => void;

  // States
  loading?: boolean;
  error?: { message: string; onRetry?: () => void };
  empty?: { title: ReactNode; description?: ReactNode; action?: ReactNode };

  // Layout
  height?: string | number;
  maxHeight?: string | number;

  // Actions row (above search bar)
  actions?: ReactNode;

  className?: string;
  'aria-label'?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_SEARCH_DEBOUNCE_MS = 250;

export function DataExplorer<TRow>({
  rows,
  columns,
  totalRows,
  getRowId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  filters,
  hiddenColumns,
  onHiddenColumnsChange,
  sort,
  onSortChange,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  selectionMode = 'none',
  selectedIds,
  onSelectionChange,
  bulkActions,
  density = 'comfortable',
  onDensityChange,
  loading,
  error,
  empty,
  height,
  maxHeight = '70vh',
  actions,
  className,
  'aria-label': ariaLabel = 'Data explorer',
}: DataExplorerProps<TRow>): JSX.Element {
  // Local search input — debounced into onSearchChange.
  const [localSearch, setLocalSearch] = useState(searchValue ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync from controlled value (e.g., URL param).
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  function handleSearchInput(next: string): void {
    setLocalSearch(next);
    if (!onSearchChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(next);
    }, searchDebounceMs);
  }

  // Selection bridge: spec exposes selectedIds[]; SchemaDataGrid uses
  // Record<string, boolean>. Convert in both directions.
  const selectionMap = useMemo<Record<string, boolean> | undefined>(() => {
    if (!selectedIds) return undefined;
    return Object.fromEntries(selectedIds.map((id) => [id, true]));
  }, [selectedIds]);

  function handleSelectionMapChange(next: Record<string, boolean>): void {
    if (!onSelectionChange) return;
    const ids = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onSelectionChange(ids);
  }

  // Column visibility bridge: spec uses hiddenColumns[]; SchemaDataGrid uses
  // Record<string, boolean> (true = visible, false = hidden).
  const visibilityMap = useMemo<Record<string, boolean> | undefined>(() => {
    if (!hiddenColumns) return undefined;
    return Object.fromEntries(
      columns.map((c) => [c.id, !hiddenColumns.includes(c.id)]),
    );
  }, [hiddenColumns, columns]);

  function handleVisibilityMapChange(next: Record<string, boolean>): void {
    if (!onHiddenColumnsChange) return;
    const hidden = Object.entries(next)
      .filter(([, visible]) => !visible)
      .map(([id]) => id);
    onHiddenColumnsChange(hidden);
  }

  function toggleColumnVisible(id: string): void {
    if (!onHiddenColumnsChange) return;
    const set = new Set(hiddenColumns ?? []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onHiddenColumnsChange(Array.from(set));
  }

  const selectedCount = selectedIds?.length ?? 0;
  const showBulkRow = selectedCount > 0 && bulkActions !== undefined;

  // The grid replacement state — error wins, then loading, then empty
  const showError = !!error;
  const showLoading = !showError && !!loading;
  const showEmpty =
    !showError && !showLoading && rows.length === 0 && empty !== undefined;

  // Toggleable columns are non-required.
  const toggleableColumns = useMemo(
    () => columns.filter((c) => !c.required),
    [columns],
  );

  return (
    <section
      aria-label={ariaLabel}
      className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}
    >
      {actions !== undefined && (
        <div className="flex items-center justify-between gap-2">{actions}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            <Icon name="Search" size="sm" />
          </span>
          <Input
            type="search"
            placeholder={searchPlaceholder ?? 'Search…'}
            value={localSearch}
            onChange={(e) => { handleSearchInput(e.target.value); }}
            className="pl-8"
            aria-label={searchPlaceholder ?? 'Search'}
          />
        </div>

        {onDensityChange && (
          <label className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            Compact
            <Switch
              checked={density === 'compact'}
              onCheckedChange={(c) =>
                { onDensityChange(c ? 'compact' : 'comfortable'); }
              }
              aria-label="Compact density"
            />
          </label>
        )}

        {onHiddenColumnsChange && toggleableColumns.length > 0 && (
          <DropdownMenu
            align="end"
            trigger={
              <IconButton
                aria-label="Column visibility"
                variant="outline"
                size="sm"
                icon={<Icon name="Columns3" size="sm" aria-hidden />}
              />
            }
          >
            <DropdownMenuLabel>Show columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {toggleableColumns.map((col) => {
              const isHidden = (hiddenColumns ?? []).includes(col.id);
              return (
                <DropdownMenuItem
                  key={col.id}
                  onSelect={() => { toggleColumnVisible(col.id); }}
                  icon={
                    <Checkbox
                      checked={!isHidden}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  }
                >
                  {col.header}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenu>
        )}
      </div>

      {filters !== undefined && (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      )}

      {showBulkRow && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2 text-sm"
        >
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? 'row' : 'rows'} selected
          </span>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      <div
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          maxHeight:
            typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        }}
        className="overflow-auto rounded-md border border-border"
      >
        {showError ? (
          <Alert
            variant="error"
            description={error.message}
            action={
              error.onRetry ? (
                <Button size="sm" variant="outline" onClick={error.onRetry}>
                  Retry
                </Button>
              ) : undefined
            }
            className="m-3"
          />
        ) : showLoading ? (
          <div className="flex flex-col gap-2 p-3" role="status" aria-live="polite">
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </div>
        ) : showEmpty ? (
          <div className="p-6">
            <EmptyState
              title={empty.title}
              {...(empty.description !== undefined
                ? { description: empty.description }
                : {})}
              {...(empty.action !== undefined ? { action: empty.action } : {})}
            />
          </div>
        ) : (
          <SchemaDataGrid
            rows={rows}
            columns={columns}
            {...(getRowId ? { getRowId } : {})}
            selectionMode={selectionMode}
            {...(selectionMap !== undefined
              ? {
                  selection: selectionMap,
                  onSelectionChange: handleSelectionMapChange,
                }
              : {})}
            density={density}
            {...(sort !== undefined ? { sort } : {})}
            {...(onSortChange ? { onSortChange } : {})}
            {...(visibilityMap !== undefined
              ? {
                  columnVisibility: visibilityMap,
                  onColumnVisibilityChange: handleVisibilityMapChange,
                }
              : {})}
          />
        )}
      </div>

      {!showError && !showEmpty && (
        <Pagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={onPageChange}
          {...(onPageSizeChange ? { onPageSizeChange } : {})}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </section>
  );
}
DataExplorer.displayName = 'DataExplorer';
