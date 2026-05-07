/**
 * CodeSearchCombobox.
 *
 * Generic typed combobox used by every code-lookup field (ICD, HCPCS, POS,
 * CPT). The contract is intentionally thin so each field can wire its own
 * data source — sync (in-memory @tensaw/codes lookup) or async (server
 * adapter for CPT).
 *
 * Behavior:
 *   - Controlled value/onChange like a normal text input.
 *   - On change, debounces 200ms then calls `searchEntries(query)` to update
 *     the dropdown.
 *   - Click or Enter on a row selects that entry — returns its `code` to the
 *     parent and closes the dropdown.
 *   - Keyboard: ArrowDown / ArrowUp / Enter / Escape.
 *   - On blur with no selection: dropdown closes; value remains whatever the
 *     user typed (no auto-correction).
 *   - Right-side affix slot for "Show description" / status icons.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export interface CodeSearchEntry {
  /** The canonical code value. Becomes the field's value on selection. */
  code: string;
  /** Human-readable description shown in the dropdown row. */
  description: string;
  /** Optional secondary line (e.g. category, "Billable", chapter). */
  secondary?: string;
  /** Optional disabled flag — entry is shown but greyed out (e.g. non-billable ICD header codes). */
  disabled?: boolean;
}

export interface CodeSearchComboboxProps {
  /** Field label. */
  label?: string;
  /** Optional placeholder. */
  placeholder?: string;
  /** Hint text under the input. */
  hint?: string;
  /** Validation error. Takes precedence over hint. */
  error?: string | null;
  /** Required field marker. */
  required?: boolean;
  /** Disabled. */
  disabled?: boolean;
  /** Current value (the typed-or-selected code string). */
  value: string;
  /** Called whenever the input changes — including selection. */
  onChange: (value: string) => void;
  /**
   * Called when an entry is selected. Receives the full entry so the parent
   * can display the description, store the place_id-equivalent, etc.
   */
  onSelect?: (entry: CodeSearchEntry) => void;
  /**
   * Search function. Sync or async — return promise or array. Called debounced.
   * Empty query returns `[]` (caller can choose to return prefix list).
   */
  search: (query: string) => CodeSearchEntry[] | Promise<CodeSearchEntry[]>;
  /** Loading indicator shown while async search is pending. */
  loading?: boolean;
  /** Right-side affix content (status icon, button). */
  rightAffix?: ReactNode;
  /** Minimum query length before searching. Default 1. */
  minQueryLength?: number;
  /** Debounce ms. Default 200. */
  debounceMs?: number;
  /** id passthrough. */
  id?: string;
  /** Auto-complete attribute. Default 'off'. */
  autoComplete?: string;
}

export function CodeSearchCombobox({
  label,
  placeholder,
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  onSelect,
  search,
  loading: externalLoading,
  rightAffix,
  minQueryLength = 1,
  debounceMs = 200,
  id,
  autoComplete = 'off',
}: CodeSearchComboboxProps) {
  const generatedId = useId();
  const fieldId = id ?? `code-combobox-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;

  const [results, setResults] = useState<CodeSearchEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchRef = useRef(search);
  searchRef.current = search;

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Debounced search. Triggers on value change while focused.
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (value.trim().length < minQueryLength) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const queryAtFire = value;
      const ret = searchRef.current(queryAtFire);
      if (ret instanceof Promise) {
        setInternalLoading(true);
        ret
          .then((rows) => {
            // Drop stale results.
            if (queryAtFire !== value) return;
            setResults(rows);
            setHighlightedIndex(rows.length > 0 ? 0 : -1);
          })
          .catch(() => {
            setResults([]);
            setHighlightedIndex(-1);
          })
          .finally(() => {
            setInternalLoading(false);
          });
      } else {
        setResults(ret);
        setHighlightedIndex(ret.length > 0 ? 0 : -1);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
     
  }, [value, isOpen, minQueryLength, debounceMs]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  }

  function handleFocus(_e: FocusEvent<HTMLInputElement>) {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setIsOpen(true);
  }

  function handleBlur() {
    // Delay close so click on a dropdown item registers before blur tears it down.
    blurTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  }

  function handleSelect(entry: CodeSearchEntry) {
    if (entry.disabled) return;
    onChange(entry.code);
    onSelect?.(entry);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        const entry = results[highlightedIndex];
        if (entry) {
          e.preventDefault();
          handleSelect(entry);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  const showLoading = externalLoading || internalLoading;
  const showResults = isOpen && results.length > 0;

  // -- Render ----------------------------------------------------------------

  return (
    <div style={containerStyle}>
      {label ? (
        <label htmlFor={fieldId} style={labelStyle}>
          {label}
          {required ? (
            <span style={{ color: 'var(--tw-color-text-danger, #DC2626)' }} aria-hidden>
              {' *'}
            </span>
          ) : null}
        </label>
      ) : null}

      <div style={{ position: 'relative' }}>
        <div style={inputWrapperStyle(error)}>
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={Boolean(error) || undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showResults}
            role="combobox"
            style={inputStyle}
          />
          {rightAffix ? <div style={affixStyle}>{rightAffix}</div> : null}
        </div>

        {showResults ? (
          <ul id={listboxId} role="listbox" style={dropdownStyle}>
            {results.map((entry, i) => {
              const isHighlighted = i === highlightedIndex;
              return (
                <li
                  key={entry.code}
                  role="option"
                  aria-selected={isHighlighted}
                  aria-disabled={entry.disabled || undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  onMouseEnter={() => { setHighlightedIndex(i); }}
                  style={dropdownItemStyle(isHighlighted, entry.disabled === true)}
                >
                  <div style={dropdownPrimaryStyle}>
                    <code style={codeStyle}>{entry.code}</code>
                    <span>{entry.description}</span>
                  </div>
                  {entry.secondary ? (
                    <div style={dropdownSecondaryStyle}>{entry.secondary}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {showLoading && isOpen ? <div style={loadingStyle}>Searching…</div> : null}
      </div>

      {error ? (
        <span style={errorTextStyle}>{error}</span>
      ) : hint ? (
        <span style={hintTextStyle}>{hint}</span>
      ) : null}
    </div>
  );
}

// -- Styles -------------------------------------------------------------------

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontFamily: 'system-ui, sans-serif',
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--tw-color-text-secondary, #4B5563)',
};

const inputWrapperStyle = (error: string | null | undefined): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  background: 'var(--tw-color-input-bg, #FFFFFF)',
  border: `1px solid ${
    error ? 'var(--tw-color-border-danger, #DC2626)' : 'var(--tw-color-input-border, #D1D5DB)'
  }`,
  borderRadius: 6,
  height: 36,
  padding: '0 8px 0 12px',
});

const inputStyle: CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  color: 'var(--tw-color-text-primary, #1F2937)',
  background: 'transparent',
  height: '100%',
};

const affixStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: 8,
  flexShrink: 0,
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  border: '1px solid var(--tw-color-border-default, #D1D5DB)',
  borderRadius: 6,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
  zIndex: 20,
  maxHeight: 320,
  overflowY: 'auto',
};

const dropdownItemStyle = (highlighted: boolean, disabled: boolean): CSSProperties => ({
  padding: '8px 12px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  background: highlighted
    ? 'var(--tw-color-table-row-hover-bg, #F9FAFB)'
    : 'transparent',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
});

const dropdownPrimaryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  fontSize: 13,
  color: 'var(--tw-color-text-primary, #1F2937)',
};

const codeStyle: CSSProperties = {
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--tw-color-text-accent, #218D8D)',
  flexShrink: 0,
  minWidth: 60,
};

const dropdownSecondaryStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--tw-color-text-muted, #6B7280)',
  marginTop: 2,
  paddingLeft: 68,
};

const loadingStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 12,
  fontSize: 11,
  color: 'var(--tw-color-text-muted, #6B7280)',
};

const errorTextStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--tw-color-text-danger, #DC2626)',
};

const hintTextStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--tw-color-text-muted, #6B7280)',
};
