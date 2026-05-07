/**
 * TimelineEntry — single item in a vertical timeline.
 *
 * Used in Activity Log, Audit Log, and any "what happened when" view. Designed
 * to be stacked: each entry renders its own connector dot+line so wrapping in
 * a `<Timeline>` container is just `<div>` with vertical gap.
 *
 * Per-entry data:
 *   - timestamp (display string — caller formats to local timezone)
 *   - title (short label, e.g. "Payment posted")
 *   - body (optional rich content)
 *   - actor (who did it — name or system label)
 *   - tone (visual category — driver of dot color)
 *
 * The connector line drawing is internal to this component. The last entry
 * automatically has no trailing line — pass `isLast` to enable.
 */

import type { CSSProperties, ReactNode } from 'react';

export type TimelineTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface TimelineEntryProps {
  /** ISO or display timestamp. Whatever string you pass renders verbatim. */
  timestamp: string;
  /** Short title — required. */
  title: string;
  /** Optional rich body. */
  body?: ReactNode;
  /** Who triggered the event. */
  actor?: string;
  /** Visual category. */
  tone?: TimelineTone;
  /** True for the last entry (suppresses the trailing connector line). */
  isLast?: boolean;
  /** Optional click target for the whole entry. */
  onClick?: () => void;
}

const TONE_DOT: Record<TimelineTone, string> = {
  neutral: 'var(--tw-color-text-muted, #9CA3AF)',
  info: 'var(--tw-color-status-info-fg, #3B82F6)',
  success: 'var(--tw-color-status-success-fg, #10B981)',
  warning: 'var(--tw-color-status-warning-fg, #F59E0B)',
  danger: 'var(--tw-color-status-danger-fg, #DC2626)',
};

export function TimelineEntry({
  timestamp,
  title,
  body,
  actor,
  tone = 'neutral',
  isLast = false,
  onClick,
}: TimelineEntryProps) {
  const dotColor = TONE_DOT[tone];

  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '24px 1fr',
    gap: 10,
    padding: 0,
    fontFamily: 'system-ui, sans-serif',
    cursor: onClick ? 'pointer' : 'default',
  };

  const railStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const dotStyle: CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: dotColor,
    flexShrink: 0,
    marginTop: 4,
    boxShadow: '0 0 0 3px var(--tw-color-surface-raised, #FFFFFF)',
    zIndex: 1,
  };

  const lineStyle: CSSProperties = {
    width: 2,
    flex: 1,
    background: 'var(--tw-color-border-muted, #E5E7EB)',
    marginTop: 2,
  };

  const contentStyle: CSSProperties = {
    paddingBottom: isLast ? 0 : 12,
    minWidth: 0,
  };

  const timestampStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #9CA3AF)',
    marginBottom: 2,
  };

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--tw-color-text-primary, #1F2937)',
    lineHeight: 1.4,
  };

  const actorStyle: CSSProperties = {
    fontSize: 12,
    color: 'var(--tw-color-text-muted, #6B7280)',
    marginTop: 2,
  };

  const bodyStyle: CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: 'var(--tw-color-text-secondary, #4B5563)',
    lineHeight: 1.5,
  };

  return (
    <div
      style={rowStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div style={railStyle} aria-hidden>
        <span style={dotStyle} />
        {!isLast ? <span style={lineStyle} /> : null}
      </div>
      <div style={contentStyle}>
        <div style={timestampStyle}>{timestamp}</div>
        <div style={titleStyle}>{title}</div>
        {actor ? <div style={actorStyle}>by {actor}</div> : null}
        {body ? <div style={bodyStyle}>{body}</div> : null}
      </div>
    </div>
  );
}
