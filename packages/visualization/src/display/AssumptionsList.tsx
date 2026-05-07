/**
 * AssumptionsList — vertically-stacked list with checkmark or bullet icons.
 *
 * Pattern from PromptQL Workspace right panel: "Assumptions (3)", "Definitions",
 * "Warnings & Caveats". Each item is a single-line statement; tone determines
 * the leading icon.
 */

import type { CSSProperties, ReactNode } from 'react';

export type AssumptionTone = 'check' | 'info' | 'warning' | 'neutral';

export interface AssumptionsListItem {
  /** Stable key for React diffing. */
  id: string;
  /** Item content — string or rich nodes. */
  content: ReactNode;
  /** Per-item tone override. Falls back to list-level default. */
  tone?: AssumptionTone;
}

export interface AssumptionsListProps {
  items: AssumptionsListItem[];
  /** Default tone used for items that don't specify one. */
  defaultTone?: AssumptionTone;
  /** Render the list with smaller text and tighter spacing. */
  compact?: boolean;
}

const TONE_ICON: Record<AssumptionTone, { icon: string; color: string }> = {
  check: { icon: '✓', color: 'var(--tw-color-status-success-fg, #059669)' },
  info: { icon: 'ⓘ', color: 'var(--tw-color-status-info-fg, #1E40AF)' },
  warning: { icon: '⚠', color: 'var(--tw-color-status-warning-fg, #92400E)' },
  neutral: { icon: '•', color: 'var(--tw-color-text-muted, #6B7280)' },
};

export function AssumptionsList({
  items,
  defaultTone = 'check',
  compact = false,
}: AssumptionsListProps) {
  const listStyle: CSSProperties = {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    fontFamily: 'system-ui, sans-serif',
    fontSize: compact ? 12 : 13,
    color: 'var(--tw-color-text-primary, #1F2937)',
    lineHeight: 1.5,
  };

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: compact ? '4px 0' : '6px 0',
  };

  const iconStyle = (color: string): CSSProperties => ({
    flexShrink: 0,
    width: 16,
    height: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color,
    fontWeight: 700,
    fontSize: 12,
    marginTop: 1,
  });

  return (
    <ul style={listStyle}>
      {items.map((item) => {
        const tone = TONE_ICON[item.tone ?? defaultTone];
        return (
          <li key={item.id} style={itemStyle}>
            <span aria-hidden style={iconStyle(tone.color)}>
              {tone.icon}
            </span>
            <span style={{ flex: 1 }}>{item.content}</span>
          </li>
        );
      })}
    </ul>
  );
}
