/**
 * Tiny colored dot for SLA / aging / priority indication. Smaller and more
 * subtle than a full StatusBadge — used in dense tables and worklists.
 */

import type { CSSProperties } from 'react';

export interface PriorityDotProps {
  /** Priority level. */
  level: 'high' | 'medium' | 'low' | 'none' | 'sla-breached';
  /** Optional title for screen readers and hover tooltips. */
  title?: string;
  /** Size in px. Default 8. */
  size?: number;
}

const COLORS: Record<PriorityDotProps['level'], string> = {
  high: 'var(--tw-color-priority-high, #DC2626)',
  medium: 'var(--tw-color-priority-medium, #F59E0B)',
  low: 'var(--tw-color-priority-low, #10B981)',
  none: 'var(--tw-color-priority-none, #9CA3AF)',
  'sla-breached': '#DC2626',
};

const DEFAULT_TITLES: Record<PriorityDotProps['level'], string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
  none: 'No priority',
  'sla-breached': 'SLA breached',
};

export function PriorityDot({ level, title, size = 8 }: PriorityDotProps) {
  const style: CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    background: COLORS[level],
    flexShrink: 0,
    boxShadow: level === 'sla-breached' ? `0 0 0 2px rgba(220, 38, 38, 0.2)` : 'none',
  };
  return (
    <span
      style={style}
      role="img"
      aria-label={title ?? DEFAULT_TITLES[level]}
      title={title ?? DEFAULT_TITLES[level]}
    />
  );
}
