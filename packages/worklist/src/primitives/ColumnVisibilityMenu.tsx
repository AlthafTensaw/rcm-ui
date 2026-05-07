/**
 * ColumnVisibilityMenu.
 *
 * Lets the user show/hide columns in a worklist grid. Reads the column schema
 * directly so it can surface `required` columns as disabled (always visible)
 * checkboxes.
 *
 * Fully controlled — the parent supplies the current `visibility` map and a
 * change callback. The parent is responsible for persisting per-user. (See
 * the `useColumnVisibility` hook for the standard wiring.)
 */

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

export interface ColumnVisibilityColumn {
  id: string;
  header: string;
  required?: boolean;
  defaultHidden?: boolean;
}

export interface ColumnVisibilityMenuProps {
  columns: readonly ColumnVisibilityColumn[];
  /** Map of columnId → visible. Missing entries default to "visible unless defaultHidden". */
  visibility: Readonly<Record<string, boolean>>;
  onChange: (next: Record<string, boolean>) => void;
  /** Resets to the schema defaults (required columns visible, defaultHidden hidden). */
  onReset?: () => void;
  /** Footer note. Defaults to "Saved per user". */
  footerNote?: string;
}

export function ColumnVisibilityMenu({
  columns,
  visibility,
  onChange,
  onReset,
  footerNote = 'Saved per user',
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  // Column is visible if explicitly true OR (no entry AND not defaultHidden).
  const isVisible = (col: ColumnVisibilityColumn): boolean => {
    const entry = visibility[col.id];
    if (entry !== undefined) return entry;
    return col.defaultHidden !== true;
  };

  const visibleCount = columns.filter((c) => isVisible(c)).length;
  const totalCount = columns.length;

  const toggle = (col: ColumnVisibilityColumn) => {
    if (col.required) return; // required columns can't be hidden
    onChange({ ...visibility, [col.id]: !isVisible(col) });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        id={buttonId}
        style={triggerStyle}
        onClick={() => {
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span style={triggerIcon}>⚏</span>
        <span>Columns</span>
        <span style={countPill}>
          {visibleCount} / {totalCount}
        </span>
        <span style={chevron}>▾</span>
      </button>

      {open ? (
        <div style={dropdownStyle} role="menu">
          <div style={dropdownHeader}>Show columns</div>
          <div style={listStyle}>
            {columns.map((col) => {
              const visible = isVisible(col);
              const required = col.required === true;
              return (
                <label
                  key={col.id}
                  style={{
                    ...optionStyle,
                    cursor: required ? 'not-allowed' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    disabled={required}
                    onChange={() => {
                      toggle(col);
                    }}
                  />
                  <span
                    style={{
                      ...optionLabel,
                      color: required
                        ? 'var(--tw-color-text-muted, #6B7280)'
                        : 'var(--tw-color-text-primary, #1F2937)',
                    }}
                  >
                    {col.header}
                  </span>
                  {required ? <span style={requiredTag}>required</span> : null}
                </label>
              );
            })}
          </div>
          <div style={footerStyle}>
            {onReset ? (
              <button
                type="button"
                style={resetBtn}
                onClick={() => {
                  onReset();
                }}
              >
                Reset to default
              </button>
            ) : (
              <span />
            )}
            <span style={footerNoteStyle}>{footerNote}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 10px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  color: 'var(--tw-color-text-primary, #1F2937)',
  fontFamily: 'inherit',
};

const triggerIcon: CSSProperties = { fontSize: 13 };

const countPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 6px',
  background: 'var(--tw-color-surface-subtle, #F3F4F6)',
  color: 'var(--tw-color-text-secondary, #4B5563)',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
};

const chevron: CSSProperties = {
  fontSize: 9,
  color: 'var(--tw-color-text-muted, #6B7280)',
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  width: 240,
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  padding: 6,
  zIndex: 10,
};

const dropdownHeader: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--tw-color-text-muted, #6B7280)',
  padding: '6px 8px 4px',
};

const listStyle: CSSProperties = {
  maxHeight: 320,
  overflowY: 'auto',
};

const optionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  fontSize: 13,
  borderRadius: 4,
};

const optionLabel: CSSProperties = {
  flex: 1,
};

const requiredTag: CSSProperties = {
  fontSize: 9,
  color: 'var(--tw-color-text-muted, #6B7280)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const footerStyle: CSSProperties = {
  borderTop: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  marginTop: 4,
  paddingTop: 4,
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 8px',
};

const resetBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--tw-color-text-accent, #218D8D)',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
};

const footerNoteStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--tw-color-text-muted, #6B7280)',
};
