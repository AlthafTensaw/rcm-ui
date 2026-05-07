/**
 * Grid cell renderers — pure presentational components for use in TanStack
 * Table column definitions or any list/table.
 *
 * All cells:
 *   - Handle null/undefined → render em-dash '—' in muted color.
 *   - Use tabular-nums for column alignment of numeric values.
 *   - Inherit row's color from parent (so hover/selection still styles correctly).
 *   - Are deliberately minimal — no padding, no borders, no row chrome. The
 *     table component owns those.
 */

import type { CSSProperties } from 'react';
import {
  formatMoneyUsd,
  formatPercent,
} from '../utils/formatters';

const NUMERIC_STYLE: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

const MUTED_STYLE: CSSProperties = {
  color: 'var(--tw-color-text-muted, #9CA3AF)',
};

// -- MoneyCell --------------------------------------------------------------

export interface MoneyCellProps {
  value: number | null | undefined;
  /** Color negatives red. Default true. */
  highlightNegative?: boolean;
  /** Right-align. Default true (financial column convention). */
  alignRight?: boolean;
}

/**
 * USD money cell. Negatives render with leading minus and red color (locked
 * v3 convention). Right-aligned by default for column scanning.
 */
export function MoneyCell({
  value,
  highlightNegative = true,
  alignRight = true,
}: MoneyCellProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <span style={{ ...NUMERIC_STYLE, ...MUTED_STYLE, textAlign: alignRight ? 'right' : 'left', display: 'block' }}>
        —
      </span>
    );
  }
  const isNeg = value < 0;
  const style: CSSProperties = {
    ...NUMERIC_STYLE,
    color: isNeg && highlightNegative ? 'var(--tw-color-money-negative, #DC2626)' : 'inherit',
    textAlign: alignRight ? 'right' : 'left',
    display: 'block',
  };
  return <span style={style}>{formatMoneyUsd(value)}</span>;
}

// -- PercentCell ------------------------------------------------------------

export interface PercentCellProps {
  value: number | null | undefined;
  decimals?: number;
  alignRight?: boolean;
}

export function PercentCell({ value, decimals = 1, alignRight = true }: PercentCellProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <span style={{ ...NUMERIC_STYLE, ...MUTED_STYLE, textAlign: alignRight ? 'right' : 'left', display: 'block' }}>
        —
      </span>
    );
  }
  return (
    <span style={{ ...NUMERIC_STYLE, textAlign: alignRight ? 'right' : 'left', display: 'block' }}>
      {formatPercent(value, decimals)}
    </span>
  );
}

// -- DateCell ---------------------------------------------------------------

export interface DateCellProps {
  value: Date | string | null | undefined;
  /** Format token: 'short' (06/23/25), 'medium' (Jun 23, 2025), 'long' (June 23, 2025). Default 'short'. */
  format?: 'short' | 'medium' | 'long';
}

const dateFormatters = {
  short: new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
  medium: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  long: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
};

export function DateCell({ value, format = 'short' }: DateCellProps) {
  if (value === null || value === undefined) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  return <span style={NUMERIC_STYLE}>{dateFormatters[format].format(date)}</span>;
}

// -- DateTimeCell -----------------------------------------------------------

export interface DateTimeCellProps {
  value: Date | string | null | undefined;
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function DateTimeCell({ value }: DateTimeCellProps) {
  if (value === null || value === undefined) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  return <span style={NUMERIC_STYLE}>{dateTimeFormatter.format(date)}</span>;
}

// -- AgeCell ---------------------------------------------------------------

export interface AgeCellProps {
  /** Date of birth. */
  dob: Date | string | null | undefined;
  /** As-of date for calculation. Default today. */
  asOf?: Date;
}

/**
 * Renders age relative to a reference date. Returns "47 yrs", "6 mo",
 * "3 days" depending on age.
 */
export function AgeCell({ dob, asOf }: AgeCellProps) {
  if (dob === null || dob === undefined) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  const date = typeof dob === 'string' ? new Date(dob) : dob;
  if (Number.isNaN(date.getTime())) {
    return <span style={MUTED_STYLE}>—</span>;
  }
  const ref = asOf ?? new Date();
  const diffMs = ref.getTime() - date.getTime();
  if (diffMs < 0) return <span style={MUTED_STYLE}>—</span>;

  const days = Math.floor(diffMs / 86400000);
  if (days < 30) return <span style={NUMERIC_STYLE}>{days} {days === 1 ? 'day' : 'days'}</span>;

  const months = (ref.getFullYear() - date.getFullYear()) * 12 + (ref.getMonth() - date.getMonth());
  if (months < 24) return <span style={NUMERIC_STYLE}>{months} mo</span>;

  let years = ref.getFullYear() - date.getFullYear();
  const monthsDiff = ref.getMonth() - date.getMonth();
  if (monthsDiff < 0 || (monthsDiff === 0 && ref.getDate() < date.getDate())) years -= 1;
  return <span style={NUMERIC_STYLE}>{years} yrs</span>;
}
