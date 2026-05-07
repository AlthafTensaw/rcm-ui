/**
 * AlertCard — inline banner shown inside a panel or card.
 *
 * Distinct from a toast (which is transient/global). AlertCard stays in place
 * and is meant for content-level messages: "Data for the most recent 3 days
 * may be incomplete", "Patient has not consented to data sharing", etc.
 *
 * Severity colors match the StatusBadge tone palette so an info AlertCard and
 * an info StatusBadge in the same view feel consistent.
 */

import type { CSSProperties, ReactNode } from 'react';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AlertCardProps {
  severity: AlertSeverity;
  title?: string;
  /** Body content. Plain string or rich nodes. */
  children: ReactNode;
  /** Optional dismiss callback. If provided, an X button shows in the corner. */
  onDismiss?: () => void;
  /** Optional action button at the right edge ("View All", "Retry", etc.). */
  action?: ReactNode;
  /** Optional leading icon. Defaults to a tone-appropriate glyph. */
  icon?: ReactNode | false;
}

const TONE: Record<
  AlertSeverity,
  { bg: string; border: string; text: string; iconColor: string; defaultIcon: string }
> = {
  info: {
    bg: 'var(--tw-color-status-info-bg, #EFF6FF)',
    border: 'var(--tw-color-status-info-border, #60A5FA)',
    text: 'var(--tw-color-status-info-fg, #1E40AF)',
    iconColor: '#3B82F6',
    defaultIcon: 'ⓘ',
  },
  success: {
    bg: 'var(--tw-color-status-success-bg, #ECFDF5)',
    border: 'var(--tw-color-status-success-border, #34D399)',
    text: 'var(--tw-color-status-success-fg, #065F46)',
    iconColor: '#10B981',
    defaultIcon: '✓',
  },
  warning: {
    bg: 'var(--tw-color-status-warning-bg, #FEF3C7)',
    border: 'var(--tw-color-status-warning-border, #FBBF24)',
    text: 'var(--tw-color-status-warning-fg, #92400E)',
    iconColor: '#F59E0B',
    defaultIcon: '⚠',
  },
  error: {
    bg: 'var(--tw-color-status-danger-bg, #FEE2E2)',
    border: 'var(--tw-color-status-danger-border, #F87171)',
    text: 'var(--tw-color-status-danger-fg, #991B1B)',
    iconColor: '#DC2626',
    defaultIcon: '⊗',
  },
};

export function AlertCard({
  severity,
  title,
  children,
  onDismiss,
  action,
  icon,
}: AlertCardProps) {
  const tone = TONE[severity];

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    background: tone.bg,
    border: `1px solid ${tone.border}`,
    borderRadius: 8,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    lineHeight: 1.5,
    color: tone.text,
  };

  const iconStyle: CSSProperties = {
    flexShrink: 0,
    width: 18,
    height: 18,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tone.iconColor,
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1,
    marginTop: 1,
  };

  const titleStyle: CSSProperties = {
    fontWeight: 600,
    marginBottom: 2,
  };

  const actionStyle: CSSProperties = {
    flexShrink: 0,
    marginLeft: 8,
  };

  const dismissStyle: CSSProperties = {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    color: tone.text,
    opacity: 0.6,
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: 16,
    lineHeight: 1,
    marginLeft: 4,
  };

  return (
    <div style={containerStyle} role="alert" aria-live={severity === 'error' ? 'assertive' : 'polite'}>
      {icon !== false ? <span aria-hidden style={iconStyle}>{icon ?? tone.defaultIcon}</span> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div style={titleStyle}>{title}</div> : null}
        <div>{children}</div>
      </div>
      {action ? <div style={actionStyle}>{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={dismissStyle}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
