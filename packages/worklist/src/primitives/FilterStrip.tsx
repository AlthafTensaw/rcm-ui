/**
 * FilterStrip.
 *
 * Horizontal chip strip that lives below the page header on a search-list
 * page. Hosts filter chips (multi-select, single-select, date range) and
 * provides a "Clear all" affordance.
 *
 * Layout-only: it does not own filter state. The parent page composes the
 * filter chips and passes them as children. This keeps the strip reusable
 * across worklists with different filter sets.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface FilterStripProps {
  children: ReactNode;
  /** Number of currently-active filters. Shown as a small pill next to the label. */
  activeCount?: number;
  /** Called when the user clicks "Clear all". Hidden when activeCount is 0 or undefined. */
  onClearAll?: () => void;
  /** Optional label to the left of the chips. Defaults to "Filters". */
  label?: string;
}

export function FilterStrip({
  children,
  activeCount,
  onClearAll,
  label = 'Filters',
}: FilterStripProps) {
  const showClear = onClearAll && (activeCount ?? 0) > 0;
  return (
    <div style={stripStyle} role="region" aria-label="Filters">
      <div style={labelStyle}>
        <span>{label}</span>
        {activeCount !== undefined && activeCount > 0 ? (
          <span style={countPill}>{activeCount}</span>
        ) : null}
      </div>
      <div style={chipRowStyle}>{children}</div>
      {showClear ? (
        <button type="button" style={clearBtn} onClick={onClearAll}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const stripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 20px',
  background: 'var(--tw-color-surface-subtle, #F8FAFB)',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--tw-color-text-muted, #6B7280)',
  marginRight: 4,
};

const countPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 6px',
  borderRadius: 999,
  background: 'var(--tw-color-brand-tint, #EBF7F6)',
  color: 'var(--tw-color-text-accent, #218D8D)',
  fontSize: 10,
  fontWeight: 600,
};

const chipRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  flexWrap: 'wrap',
};

const clearBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--tw-color-text-accent, #218D8D)',
  fontSize: 12,
  cursor: 'pointer',
  padding: '4px 8px',
};
