/**
 * PageHeader.
 *
 * Standard page-top bar: optional back button, breadcrumbs, title, optional
 * star/favorite toggle, right-side actions. Used by every archetype shell.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface Breadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  /** Right-side action area. */
  actions?: ReactNode;
  /** Optional back button handler. If omitted, no back button shown. */
  onBack?: () => void;
  /** Optional star/favorite state and toggle. */
  starred?: boolean;
  onStarToggle?: () => void;
  /** Compact density. */
  compact?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  onBack,
  starred,
  onStarToggle,
  compact = false,
}: PageHeaderProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: compact ? '8px 16px' : '12px 20px',
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    fontFamily: 'system-ui, sans-serif',
  };

  const leftStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    flex: 1,
  };

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const titleStyle: CSSProperties = {
    fontSize: compact ? 15 : 17,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    color: 'var(--tw-color-text-muted, #6B7280)',
  };

  const breadcrumbsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
  };

  const iconButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--tw-color-text-muted, #6B7280)',
    cursor: 'pointer',
    padding: 4,
    fontSize: 16,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
  };

  return (
    <header style={containerStyle}>
      <div style={leftStyle}>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav style={breadcrumbsStyle} aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${String(i)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {i > 0 ? <span aria-hidden style={{ color: 'var(--tw-color-text-muted, #9CA3AF)' }}>›</span> : null}
                {b.href || b.onClick ? (
                  <a
                    href={b.href}
                    onClick={
                      b.onClick
                        ? (e) => {
                            if (!b.href) e.preventDefault();
                            b.onClick?.();
                          }
                        : undefined
                    }
                    style={{ color: 'var(--tw-color-text-link, #218D8D)', textDecoration: 'none' }}
                  >
                    {b.label}
                  </a>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <div style={titleRowStyle}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              style={iconButtonStyle}
            >
              ←
            </button>
          ) : null}
          <h1 style={titleStyle}>{title}</h1>
          {onStarToggle ? (
            <button
              type="button"
              onClick={onStarToggle}
              aria-label={starred ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={starred ?? false}
              style={{
                ...iconButtonStyle,
                color: starred ? 'var(--tw-color-status-warning-fg, #F59E0B)' : 'var(--tw-color-text-muted, #6B7280)',
              }}
            >
              {starred ? '★' : '☆'}
            </button>
          ) : null}
        </div>
        {subtitle ? <span style={subtitleStyle}>{subtitle}</span> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div> : null}
    </header>
  );
}
