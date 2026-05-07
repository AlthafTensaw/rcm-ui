/**
 * Pagination — standalone pagination control.
 *
 * Renders the page-numbers row, first/last/prev/next chevrons, an optional
 * page-size selector, and a row-range summary. Used inside `<DataExplorer>`
 * (in `@tensaw/composition/data-display`) and standalone for tables built
 * outside that component.
 *
 * Page numbers collapse to first + ellipsis + window + ellipsis + last when
 * the total page count exceeds `maxPageNumbers` (default 7). The current
 * page is always inside the window.
 */
import { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { IconButton } from '../../primitives/IconButton';
import { Select, type SelectOption } from '../../forms/Select';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  /** 0-indexed. */
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Defaults to [25, 50, 100, 200]. */
  pageSizeOptions?: number[];
  /** Show first/last chevron buttons. Default true. */
  showFirstLast?: boolean;
  /** Show numeric page buttons. Default true. */
  showPageNumbers?: boolean;
  /** Maximum visible page-number tokens (including ellipses). Default 7. */
  maxPageNumbers?: number;
  className?: string;
  'aria-label'?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

/**
 * Compute the visible page-number window with ellipses.
 *
 * Rules:
 *   - Always show first and last
 *   - Always show current
 *   - Show neighbors of current up to the cap
 *   - Insert "ellipsis" tokens for skipped runs
 */
function computePageTokens(
  current: number,
  totalPages: number,
  cap: number,
): (number | 'ellipsis')[] {
  if (totalPages <= cap) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const tokens: (number | 'ellipsis')[] = [];
  // Reserve: first, last, current, two ellipses → 5 slots; rest is window.
  // For cap=7 default → 2 neighbors each side (current ± 2).
  const sideCount = Math.max(1, Math.floor((cap - 5) / 2));
  const windowStart = Math.max(1, current - sideCount);
  const windowEnd = Math.min(totalPages - 2, current + sideCount);

  tokens.push(0);
  if (windowStart > 1) tokens.push('ellipsis');
  for (let i = windowStart; i <= windowEnd; i++) {
    if (i !== 0 && i !== totalPages - 1) tokens.push(i);
  }
  if (windowEnd < totalPages - 2) tokens.push('ellipsis');
  tokens.push(totalPages - 1);
  return tokens;
}

export function Pagination({
  pageIndex,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showFirstLast = true,
  showPageNumbers = true,
  maxPageNumbers = 7,
  className,
  'aria-label': ariaLabel = 'Pagination',
}: PaginationProps): JSX.Element {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(pageIndex, 0), totalPages - 1);

  const tokens = useMemo(
    () => computePageTokens(safePage, totalPages, maxPageNumbers),
    [safePage, totalPages, maxPageNumbers],
  );

  const firstRow = totalRows === 0 ? 0 : safePage * pageSize + 1;
  const lastRow = Math.min((safePage + 1) * pageSize, totalRows);

  const sizeOptions: SelectOption[] = pageSizeOptions.map((n) => ({
    value: String(n),
    label: `${n} / page`,
  }));

  const isFirst = safePage === 0;
  const isLast = safePage >= totalPages - 1;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-between gap-3 text-sm',
        className,
      )}
    >
      <div className="text-muted-foreground">
        {totalRows === 0
          ? '0 results'
          : `Showing ${firstRow}–${lastRow} of ${totalRows}`}
      </div>

      <div className="flex items-center gap-1">
        {showFirstLast && (
          <IconButton
            aria-label="First page"
            variant="ghost"
            size="sm"
            disabled={isFirst}
            onClick={() => { onPageChange(0); }}
            icon={<ChevronsLeft className="h-4 w-4" />}
          />
        )}
        <IconButton
          aria-label="Previous page"
          variant="ghost"
          size="sm"
          disabled={isFirst}
          onClick={() => { onPageChange(safePage - 1); }}
          icon={<ChevronLeft className="h-4 w-4" />}
        />

        {showPageNumbers &&
          tokens.map((tok, idx) =>
            tok === 'ellipsis' ? (
              <span
                key={`e-${idx}`}
                aria-hidden="true"
                className="px-1 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={tok}
                type="button"
                onClick={() => { onPageChange(tok); }}
                aria-current={tok === safePage ? 'page' : undefined}
                aria-label={`Page ${tok + 1}`}
                className={cn(
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tok === safePage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {tok + 1}
              </button>
            ),
          )}

        <IconButton
          aria-label="Next page"
          variant="ghost"
          size="sm"
          disabled={isLast}
          onClick={() => { onPageChange(safePage + 1); }}
          icon={<ChevronRight className="h-4 w-4" />}
        />
        {showFirstLast && (
          <IconButton
            aria-label="Last page"
            variant="ghost"
            size="sm"
            disabled={isLast}
            onClick={() => { onPageChange(totalPages - 1); }}
            icon={<ChevronsRight className="h-4 w-4" />}
          />
        )}
      </div>

      {onPageSizeChange && (
        <div className="flex shrink-0 items-center">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { onPageSizeChange(Number(v)); }}
            options={sizeOptions}
            aria-label="Rows per page"
            size="sm"
            width={120}
          />
        </div>
      )}
    </nav>
  );
}
Pagination.displayName = 'Pagination';
