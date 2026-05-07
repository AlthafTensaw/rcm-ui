/**
 * WorklistTotalsFooter.
 *
 * Footer for a search-list page. Shows aggregates (total balance, count) on
 * the left and pagination controls on the right.
 *
 * Pagination is fully controlled — the parent owns pageIndex/pageSize and
 * receives change callbacks.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface WorklistTotalsFooterProps {
  /** Slot for any aggregate metrics shown on the left. */
  totalsSlot?: ReactNode;
  /** Total row count (across all pages). Drives the "X–Y of Z" label. */
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  onPageSizeChange?: (next: number) => void;
  /** Page size choices. Default [10, 25, 50, 100]. */
  pageSizeOptions?: readonly number[];
}

export function WorklistTotalsFooter({
  totalsSlot,
  totalCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: WorklistTotalsFooterProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(totalCount, (pageIndex + 1) * pageSize);

  return (
    <div style={containerStyle}>
      <div style={leftSlot}>{totalsSlot}</div>
      <div style={rightSlot}>
        {onPageSizeChange ? (
          <>
            <span style={mutedText}>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) onPageSizeChange(v);
              }}
              style={selectStyle}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <span style={mutedText}>
          {start}–{end} of {totalCount}
        </span>
        <span style={pagerStyle}>
          <button
            type="button"
            style={pagerBtnStyle}
            disabled={pageIndex === 0}
            onClick={() => {
              onPageChange(Math.max(0, pageIndex - 1));
            }}
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            type="button"
            style={pagerBtnStyle}
            disabled={pageIndex >= pageCount - 1}
            onClick={() => {
              onPageChange(Math.min(pageCount - 1, pageIndex + 1));
            }}
            aria-label="Next page"
          >
            ›
          </button>
        </span>
      </div>
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 20px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  borderTop: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  fontSize: 12,
};

const leftSlot: CSSProperties = {
  color: 'var(--tw-color-text-secondary, #4B5563)',
};

const rightSlot: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  color: 'var(--tw-color-text-secondary, #4B5563)',
};

const mutedText: CSSProperties = {
  color: 'var(--tw-color-text-muted, #6B7280)',
};

const selectStyle: CSSProperties = {
  height: 26,
  padding: '0 6px',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 6,
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  fontSize: 12,
  fontFamily: 'inherit',
};

const pagerStyle: CSSProperties = {
  display: 'inline-flex',
  gap: 2,
};

const pagerBtnStyle: CSSProperties = {
  width: 26,
  height: 26,
  padding: 0,
  fontSize: 11,
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
