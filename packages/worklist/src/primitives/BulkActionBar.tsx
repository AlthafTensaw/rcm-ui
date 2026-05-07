/**
 * BulkActionBar.
 *
 * Appears above the worklist grid when one or more rows are selected.
 * Hosts actions like "Set owner", "Set due date", "Add to workflow",
 * "Export selected" — but the actions themselves are slot content the
 * parent passes in. The parent is page-specific; the bar is reusable.
 *
 * Positioning is the parent's job. The default is "appears in the page flow
 * directly above the grid"; for sticky-bottom variants (the Add Claims to
 * Workflow screen), pass `variant="bottom"` to get the elevated drop-shadow
 * styling.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface BulkActionBarProps {
  /** Number of rows currently selected. The bar hides when this is 0. */
  selectedCount: number;
  /** Action buttons / inline editors to render. */
  children: ReactNode;
  /** Called when the user clicks "Clear selection". */
  onClearSelection?: () => void;
  /** Visual variant. Default `'inline'`. */
  variant?: 'inline' | 'bottom';
  /** Custom selection-count label. Default: `${count} selected`. */
  countLabel?: string;
}

export function BulkActionBar({
  selectedCount,
  children,
  onClearSelection,
  variant = 'inline',
  countLabel,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  const label = countLabel ?? `${String(selectedCount)} selected`;
  return (
    <div style={variant === 'bottom' ? bottomStyle : inlineStyle}>
      <span style={countText}>{label}</span>
      <span style={divider} aria-hidden="true">
        |
      </span>
      <div style={actionsRow}>{children}</div>
      {onClearSelection ? (
        <button
          type="button"
          style={clearBtn}
          onClick={onClearSelection}
        >
          Clear selection
        </button>
      ) : null}
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const inlineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '8px 20px',
  background: 'var(--tw-color-brand-tint, #EBF7F6)',
  borderBottom: '1px solid var(--tw-color-border-info, #99D6CF)',
};

const bottomStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '14px 20px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
  margin: '0 24px 24px',
};

const countText: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--tw-color-text-accent, #218D8D)',
};

const divider: CSSProperties = {
  fontSize: 12,
  color: 'var(--tw-color-text-accent, #218D8D)',
  opacity: 0.5,
};

const actionsRow: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
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
  fontFamily: 'inherit',
};
