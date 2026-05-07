/**
 * ModeToggle.
 *
 * Segmented control. Lives in or near the page header. Used by the AR Mgmt
 * page to switch between "Working list" and "Add to workflow" modes — both
 * use the same archetype, but mode drives the dataset and the bulk-action
 * set.
 *
 * Generic over the option id type so consumers can use string-literal unions
 * for type safety.
 */

import type { CSSProperties } from 'react';

export interface ModeOption<T extends string> {
  id: T;
  label: string;
  /** Optional small count badge shown after the label, e.g. "Working list 13". */
  count?: number;
}

export interface ModeToggleProps<T extends string> {
  options: readonly ModeOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function ModeToggle<T extends string>({
  options,
  value,
  onChange,
}: ModeToggleProps<T>) {
  return (
    <div style={containerStyle} role="tablist" aria-label="Mode">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            style={{
              ...buttonStyle,
              ...(active ? activeButtonStyle : {}),
            }}
            onClick={() => {
              if (!active) onChange(opt.id);
            }}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined ? (
              <span
                style={{
                  ...countPill,
                  background: active
                    ? 'var(--tw-color-surface-raised, #FFFFFF)'
                    : 'var(--tw-color-surface-subtle, #F3F4F6)',
                  color: active
                    ? 'var(--tw-color-text-accent, #218D8D)'
                    : 'var(--tw-color-text-secondary, #4B5563)',
                }}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const containerStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'var(--tw-color-surface-subtle, #F3F4F6)',
  border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  borderRadius: 8,
  padding: 2,
  gap: 2,
};

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 12px',
  background: 'transparent',
  border: 'none',
  color: 'var(--tw-color-text-secondary, #4B5563)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 6,
  fontFamily: 'inherit',
};

const activeButtonStyle: CSSProperties = {
  background: 'var(--tw-color-text-accent, #218D8D)',
  color: 'var(--tw-color-surface-raised, #FFFFFF)',
};

const countPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 6px',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  minWidth: 18,
  height: 16,
  justifyContent: 'center',
};
