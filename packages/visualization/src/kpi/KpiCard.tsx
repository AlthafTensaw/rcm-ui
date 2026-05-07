/**
 * KpiCard — large primary stat with comparison delta.
 *
 * Direction handling (locked v3 decision):
 *   - The card colors the entire VALUE green/red based on whether the trend
 *     is good/bad for THIS metric.
 *   - "Lower is better" metrics (denial rate, AR aging, days in AR) pass
 *     `direction='inverse'`. An increase colors red.
 *   - "Higher is better" metrics (collections, paid amount) pass
 *     `direction='direct'` (default). An increase colors green.
 *   - "Neutral" metrics (volume counts where neither up nor down is good)
 *     pass `direction='neutral'`. Value stays in primary text color.
 *
 * The delta text always shows the actual sign (↑14.2% or ↓11.0%) — only the
 * VALUE color reflects "is this good news".
 */

import type { CSSProperties, ReactNode } from 'react';
import { Sparkline } from '../charts/Sparkline';
import {
  formatDeltaMoney,
  formatDeltaPercent,
  formatInteger,
  formatMoneyUsdNoCents,
  formatPercent,
} from '../utils/formatters';
import type { ValueFormat } from '../charts/types';

/** How "good" trends should be detected for this metric. */
export type KpiDirection = 'direct' | 'inverse' | 'neutral';

export interface KpiCardProps {
  /** Top-line label, e.g. "Total Denials". */
  label: string;
  /** The raw number to display as the headline. */
  value: number | null | undefined;
  /** How to format the headline. Default 'money'. */
  format?: ValueFormat | 'money-no-cents';
  /**
   * Comparison value (the prior period's value). If provided, computes the
   * delta and renders it under the headline.
   */
  priorValue?: number | null;
  /** Override the comparison label, e.g. "vs Prior 6 Mo." */
  priorLabel?: string;
  /**
   * Trend direction for color logic.
   *   - 'direct'  — higher = good (collections, paid)
   *   - 'inverse' — higher = bad (denials, AR aging, denial rate)
   *   - 'neutral' — no color signal
   * Default 'direct'.
   */
  direction?: KpiDirection;
  /** Optional small sparkline data. */
  sparkline?: (number | null)[];
  /** Optional info icon next to label that surfaces a tooltip. */
  info?: ReactNode;
  /** Compact variant: smaller value font, tighter padding. */
  compact?: boolean;
}

/**
 * Resolve the headline color based on direction and delta sign.
 */
function resolveValueColor(
  delta: number | null,
  direction: KpiDirection,
): string {
  if (direction === 'neutral' || delta === null || delta === 0) {
    return 'var(--tw-color-text-primary, #1F2937)';
  }
  const goodTrend =
    (direction === 'direct' && delta > 0) || (direction === 'inverse' && delta < 0);
  return goodTrend
    ? 'var(--tw-color-status-success-fg, #059669)'
    : 'var(--tw-color-status-danger-fg, #DC2626)';
}

function resolveDeltaColor(
  delta: number | null,
  direction: KpiDirection,
): string {
  if (direction === 'neutral' || delta === null || delta === 0) {
    return 'var(--tw-color-text-muted, #6B7280)';
  }
  const goodTrend =
    (direction === 'direct' && delta > 0) || (direction === 'inverse' && delta < 0);
  return goodTrend
    ? 'var(--tw-color-status-success-fg, #059669)'
    : 'var(--tw-color-status-danger-fg, #DC2626)';
}

function formatHeadline(
  value: number | null | undefined,
  format: KpiCardProps['format'],
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  switch (format) {
    case 'money':
    case 'money-compact':
      return formatMoneyUsdNoCents(value);
    case 'money-no-cents':
      return formatMoneyUsdNoCents(value);
    case 'percent':
      return formatPercent(value);
    case 'integer':
    case 'integer-compact':
      return formatInteger(value);
    default:
      return formatMoneyUsdNoCents(value);
  }
}

export function KpiCard({
  label,
  value,
  format = 'money',
  priorValue,
  priorLabel,
  direction = 'direct',
  sparkline,
  info,
  compact = false,
}: KpiCardProps) {
  let delta: number | null = null;
  let deltaPct: number | null = null;
  if (
    priorValue !== undefined &&
    priorValue !== null &&
    value !== undefined &&
    value !== null &&
    Number.isFinite(value) &&
    Number.isFinite(priorValue)
  ) {
    delta = value - priorValue;
    deltaPct = priorValue !== 0 ? ((value - priorValue) / Math.abs(priorValue)) * 100 : null;
  }

  const valueColor = resolveValueColor(delta, direction);
  const deltaColor = resolveDeltaColor(delta, direction);
  const isPercent = format === 'percent';

  const cardStyle: CSSProperties = {
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 12,
    padding: compact ? 16 : 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontFamily: 'system-ui, sans-serif',
  };

  const labelStyle: CSSProperties = {
    fontSize: compact ? 12 : 13,
    color: 'var(--tw-color-text-muted, #6B7280)',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  const valueStyle: CSSProperties = {
    fontSize: compact ? 22 : 28,
    fontWeight: 600,
    color: valueColor,
    lineHeight: 1.1,
  };

  const deltaRowStyle: CSSProperties = {
    fontSize: 12,
    color: 'var(--tw-color-text-muted, #6B7280)',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 2,
  };

  const deltaTextStyle: CSSProperties = {
    color: deltaColor,
    fontWeight: 500,
  };

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>
        <span>{label}</span>
        {info ? <span aria-hidden>{info}</span> : null}
      </div>
      <div style={valueStyle}>{formatHeadline(value, format)}</div>
      {priorValue !== undefined && priorValue !== null && delta !== null ? (
        <div style={deltaRowStyle}>
          <span>
            {priorLabel ?? 'vs prior'}{' '}
            {isPercent ? formatPercent(priorValue) : formatMoneyUsdNoCents(priorValue)}
          </span>
          <span style={deltaTextStyle}>
            {isPercent
              ? formatDeltaPercent(delta, 2)
              : `${formatDeltaMoney(delta)}${
                  deltaPct !== null ? ` (${formatDeltaPercent(deltaPct)})` : ''
                }`}
          </span>
        </div>
      ) : null}
      {sparkline && sparkline.length > 1 ? (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={sparkline} width={120} height={28} directionalColor={false} color={valueColor} />
        </div>
      ) : null}
    </div>
  );
}
