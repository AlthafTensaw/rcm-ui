/**
 * Smaller indicators used inside cells, table rows, and panel headers.
 *
 * - VarianceIndicator: standalone "↑14.2%" / "↓11.0%" with semantic color.
 *   Used in comparison-table cells (the Compare screen has columns of these).
 * - DataRefreshIndicator: "Last refreshed: Today, 6:30 AM" with refresh icon
 *   and stale state.
 */

import type { CSSProperties } from 'react';
import { formatDeltaPercent } from '../utils/formatters';
import type { KpiDirection } from './KpiCard';

export interface VarianceIndicatorProps {
  /** Percent value (signed). e.g. 14.2 for +14.2%. */
  value: number | null | undefined;
  /** Same direction semantics as KpiCard. Default 'direct'. */
  direction?: KpiDirection;
  /** Decimal places. Default 1. */
  decimals?: number;
}

export function VarianceIndicator({
  value,
  direction = 'direct',
  decimals = 1,
}: VarianceIndicatorProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span style={{ color: 'var(--tw-color-text-muted, #6B7280)' }}>—</span>;
  }
  const goodTrend =
    direction !== 'neutral' &&
    ((direction === 'direct' && value > 0) || (direction === 'inverse' && value < 0));
  const badTrend =
    direction !== 'neutral' &&
    ((direction === 'direct' && value < 0) || (direction === 'inverse' && value > 0));

  const color = goodTrend
    ? 'var(--tw-color-status-success-fg, #059669)'
    : badTrend
      ? 'var(--tw-color-status-danger-fg, #DC2626)'
      : 'var(--tw-color-text-muted, #6B7280)';

  const style: CSSProperties = {
    color,
    fontWeight: 500,
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  };

  return <span style={style}>{formatDeltaPercent(value, decimals)}</span>;
}

// -- DataRefreshIndicator -----------------------------------------------------

export interface DataRefreshIndicatorProps {
  /** When the data was last refreshed. */
  lastRefreshedAt: Date | string | null;
  /** Threshold in minutes for "stale" badge. Default 1440 (24h). */
  staleThresholdMinutes?: number;
  /** Optional refresh callback — when set, the icon becomes a button. */
  onRefresh?: () => void;
  /** Currently loading. Spins the icon. */
  refreshing?: boolean;
}

export function DataRefreshIndicator({
  lastRefreshedAt,
  staleThresholdMinutes = 1440,
  onRefresh,
  refreshing = false,
}: DataRefreshIndicatorProps) {
  if (!lastRefreshedAt) {
    return <span style={{ color: 'var(--tw-color-text-muted, #6B7280)', fontSize: 12 }}>No refresh data</span>;
  }

  const date = typeof lastRefreshedAt === 'string' ? new Date(lastRefreshedAt) : lastRefreshedAt;
  if (Number.isNaN(date.getTime())) {
    return <span style={{ color: 'var(--tw-color-text-muted, #6B7280)', fontSize: 12 }}>Invalid date</span>;
  }

  const minutesAgo = (Date.now() - date.getTime()) / 60000;
  const isStale = minutesAgo > staleThresholdMinutes;

  const formatted = formatRefreshTime(date);

  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: isStale ? 'var(--tw-color-status-warning-fg, #D97706)' : 'var(--tw-color-text-muted, #6B7280)',
    fontFamily: 'system-ui, sans-serif',
  };

  const iconStyle: CSSProperties = {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '1.5px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: refreshing ? 'tw-refresh-spin 0.8s linear infinite' : 'none',
  };

  const content = (
    <>
      <span style={iconStyle} aria-hidden />
      <span>
        Last refreshed: {formatted}
        {isStale ? ' (stale)' : ''}
      </span>
      <style>{'@keyframes tw-refresh-spin { to { transform: rotate(360deg); } }'}</style>
    </>
  );

  if (onRefresh) {
    return (
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          ...containerStyle,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: refreshing ? 'wait' : 'pointer',
        }}
      >
        {content}
      </button>
    );
  }

  return <span style={containerStyle}>{content}</span>;
}

function formatRefreshTime(date: Date): string {
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (sameDay) return `Today, ${time}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday, ${time}`;

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
  });
  return `${dateStr}, ${time}`;
}
