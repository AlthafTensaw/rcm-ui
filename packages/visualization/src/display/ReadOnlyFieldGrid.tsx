/**
 * ReadOnlyFieldGrid — two-column "Label : Value" display.
 *
 * Used everywhere there's a read-only summary section: Demographics, Clinic
 * Details, Account Summary, Patient Info, Insurance summary. The pattern from
 * the screen designs is consistent — small grey label on the left, primary-text
 * value on the right, paired in a 2-column grid.
 *
 * Per locked decision: simple `{label, value}[]` pairs. Value can be a string
 * (most common) or a ReactNode (for inline StatusBadge, link, money formatting).
 *
 * Usage:
 *   <ReadOnlyFieldGrid
 *     fields={[
 *       { label: 'Clinic Name', value: 'Beats Cardiology PLLC' },
 *       { label: 'Tax ID', value: '87-3263971' },
 *       { label: 'Status', value: <StatusBadge taxonomy="claim" status="paid" /> },
 *     ]}
 *   />
 */

import { Fragment, type CSSProperties, type ReactNode } from 'react';

export interface ReadOnlyFieldGridField {
  label: string;
  /** Value — string or ReactNode for custom rendering (badges, links, etc.). */
  value: ReactNode;
  /**
   * If true, this field spans the full width of the grid.
   * Useful for long values like notes or addresses.
   */
  fullWidth?: boolean;
}

export interface ReadOnlyFieldGridProps {
  fields: ReadOnlyFieldGridField[];
  /** Number of label/value column pairs across. Default 2. */
  columns?: 1 | 2 | 3;
  /** Compact density. */
  compact?: boolean;
  /**
   * Empty state placeholder rendered when a value is null/undefined/empty.
   * Default '—'.
   */
  emptyPlaceholder?: string;
}

function isValueEmpty(value: ReactNode): boolean {
  return value === null || value === undefined || value === '';
}

export function ReadOnlyFieldGrid({
  fields,
  columns = 2,
  compact = false,
  emptyPlaceholder = '—',
}: ReadOnlyFieldGridProps) {
  // Each "column pair" = label + value. Two pairs = 2 × 2 = 4 grid columns.
  const gridTemplate = `repeat(${String(columns)}, max-content 1fr)`;
  const totalGridColumns = columns * 2;

  const containerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridTemplate,
    gap: compact ? '4px 16px' : '8px 24px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: compact ? 12 : 13,
    color: 'var(--tw-color-text-primary, #1F2937)',
    lineHeight: 1.5,
  };

  const labelStyle: CSSProperties = {
    color: 'var(--tw-color-text-muted, #6B7280)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    margin: 0,
  };

  const valueStyle: CSSProperties = {
    color: 'var(--tw-color-text-primary, #1F2937)',
    minWidth: 0,
    wordBreak: 'break-word',
    margin: 0,
  };

  const emptyStyle: CSSProperties = {
    color: 'var(--tw-color-text-muted, #9CA3AF)',
  };

  return (
    <dl style={containerStyle}>
      {fields.map((field, index) => {
        const key = `${field.label}-${String(index)}`;
        const empty = isValueEmpty(field.value);
        const valueContent = empty ? <span style={emptyStyle}>{emptyPlaceholder}</span> : field.value;

        if (field.fullWidth) {
          return (
            <Fragment key={key}>
              <dt style={{ ...labelStyle, gridColumn: '1 / 2' }}>{field.label}</dt>
              <dd
                style={{
                  ...valueStyle,
                  gridColumn: `2 / ${String(totalGridColumns + 1)}`,
                }}
              >
                {valueContent}
              </dd>
            </Fragment>
          );
        }

        return (
          <Fragment key={key}>
            <dt style={labelStyle}>{field.label}</dt>
            <dd style={valueStyle}>{valueContent}</dd>
          </Fragment>
        );
      })}
    </dl>
  );
}
