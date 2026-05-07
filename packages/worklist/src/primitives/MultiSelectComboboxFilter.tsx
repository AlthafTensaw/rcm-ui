/**
 * MultiSelectComboboxFilter.
 *
 * Filter chip with a multi-select dropdown. Renders the locked
 * "Label: First +N more" pattern when multiple values are selected.
 *
 * Backed by a flat list of {id, label} reference data items the parent
 * supplies. For high-cardinality fields (clinic, payer) the parent would
 * pass a server-paginated subset; this component does no fetching.
 *
 * State is fully controlled — the parent owns `selectedIds` and receives
 * change callbacks. This keeps the filter strip reusable and lets the
 * page persist filter state to the URL or a Redux slice.
 */

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

export interface RefItem {
  id: string;
  label: string;
}

export interface MultiSelectComboboxFilterProps {
  /** Filter label, e.g. "Clinic", "Provider". */
  label: string;
  /** Source items to choose from. */
  items: readonly RefItem[];
  /** Currently-selected ids. Empty array = no filter applied. */
  selectedIds: readonly string[];
  onChange: (next: readonly string[]) => void;
  /** Optional placeholder when no items are selected. */
  emptyPlaceholder?: string;
  /** Optional id for accessibility. */
  id?: string;
}

export function MultiSelectComboboxFilter({
  label,
  items,
  selectedIds,
  onChange,
  emptyPlaceholder = 'Any',
  id,
}: MultiSelectComboboxFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const generatedId = useId();
  const chipId = id ?? generatedId;

  // Click-outside to close.
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

  const selectedSet = new Set(selectedIds);
  const selectedItems = items.filter((it) => selectedSet.has(it.id));
  const filteredItems = search.trim()
    ? items.filter((it) => it.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  // Compute the chip display: "Clinic: Elite Cardio +2".
  const summary =
    selectedItems.length === 0 ? emptyPlaceholder : (selectedItems[0]?.label ?? '');
  const moreCount = selectedItems.length > 1 ? selectedItems.length - 1 : 0;

  const toggleId = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const isActive = selectedItems.length > 0;
  const chipBorderColor = isActive
    ? 'var(--tw-color-text-accent, #218D8D)'
    : 'var(--tw-color-border-muted, #D1D5DB)';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        id={chipId}
        onClick={() => {
          setOpen((o) => !o);
        }}
        style={{ ...chipStyle, borderColor: chipBorderColor }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={chipLabel}>{label}:</span>
        <span style={chipValue}>{summary}</span>
        {moreCount > 0 ? <span style={morePill}>+{moreCount}</span> : null}
        <span style={chevron}>▾</span>
      </button>

      {open ? (
        <div style={dropdownStyle} role="listbox" aria-multiselectable>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search…"
            style={searchInputStyle}
            autoFocus
          />
          <div style={listStyle}>
            {filteredItems.length === 0 ? (
              <div style={noMatchStyle}>No matches</div>
            ) : (
              filteredItems.map((it) => {
                const checked = selectedSet.has(it.id);
                return (
                  <label key={it.id} style={optionStyle}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        toggleId(it.id);
                      }}
                    />
                    <span style={optionLabel}>{it.label}</span>
                  </label>
                );
              })
            )}
          </div>
          <div style={footerStyle}>
            <button
              type="button"
              style={footerBtn}
              onClick={() => {
                onChange([]);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              style={{ ...footerBtn, color: 'var(--tw-color-text-accent, #218D8D)' }}
              onClick={() => {
                setOpen(false);
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 4px 0 10px',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 8,
  fontSize: 12,
  cursor: 'pointer',
  color: 'var(--tw-color-text-primary, #1F2937)',
  fontFamily: 'inherit',
};

const chipLabel: CSSProperties = {
  color: 'var(--tw-color-text-muted, #6B7280)',
};

const chipValue: CSSProperties = {
  fontWeight: 500,
};

const morePill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 6px',
  background: 'var(--tw-color-brand-tint, #EBF7F6)',
  color: 'var(--tw-color-text-accent, #218D8D)',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
};

const chevron: CSSProperties = {
  fontSize: 9,
  color: 'var(--tw-color-text-muted, #6B7280)',
  padding: '0 4px',
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  width: 240,
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-muted, #D1D5DB)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  zIndex: 10,
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: 'none',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  outline: 'none',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const listStyle: CSSProperties = {
  maxHeight: 240,
  overflowY: 'auto',
  padding: 4,
};

const optionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 13,
};

const optionLabel: CSSProperties = {
  color: 'var(--tw-color-text-primary, #1F2937)',
};

const noMatchStyle: CSSProperties = {
  padding: '12px 8px',
  fontSize: 12,
  color: 'var(--tw-color-text-muted, #6B7280)',
  fontStyle: 'italic',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  borderTop: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  padding: 6,
};

const footerBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 12,
  cursor: 'pointer',
  padding: '4px 8px',
  fontFamily: 'inherit',
};
