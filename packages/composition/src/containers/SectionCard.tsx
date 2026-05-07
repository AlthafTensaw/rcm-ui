/**
 * SectionCard and CollapsibleSection.
 *
 * SectionCard: titled bordered region. Used directly for one-off panels (e.g.
 * "Active Filters" right-rail panel) and as the chrome for ContainerRenderer.
 *
 * CollapsibleSection: SectionCard + chevron + remembered expand/collapse
 * state. The expand/collapse state is local — for cross-page persistence,
 * use ContainerRenderer (which goes through the ui slice).
 */

import { useState, type CSSProperties, type ReactNode } from 'react';

export interface SectionCardProps {
  title?: string;
  /** Right-side action area in the header. */
  actions?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Padding density. Default 'normal'. */
  density?: 'normal' | 'compact';
  /** Optional className escape hatch. */
  className?: string;
  /** Optional inline style escape hatch. */
  style?: CSSProperties;
}

export function SectionCard({
  title,
  actions,
  children,
  density = 'normal',
  className,
  style,
}: SectionCardProps) {
  const padding = density === 'compact' ? 12 : 16;
  const headerHeight = density === 'compact' ? 36 : 44;

  const containerStyle: CSSProperties = {
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: 'var(--tw-shadow-card, 0 1px 2px rgba(0,0,0,0.04))',
    ...style,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: headerHeight,
    padding: `0 ${String(padding)}px`,
    borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    background: 'var(--tw-color-surface-muted, #F9FAFB)',
  };

  const titleStyle: CSSProperties = {
    fontSize: density === 'compact' ? 13 : 14,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    margin: 0,
  };

  const bodyStyle: CSSProperties = {
    padding,
  };

  return (
    <div style={containerStyle} className={className}>
      {(title || actions) ? (
        <div style={headerStyle}>
          {title ? <h3 style={titleStyle}>{title}</h3> : <span />}
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Initial collapsed state. */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Called when user toggles (only fires in controlled or uncontrolled-with-handler mode). */
  onCollapsedChange?: (collapsed: boolean) => void;
  density?: 'normal' | 'compact';
}

export function CollapsibleSection({
  title,
  children,
  actions,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  density = 'normal',
}: CollapsibleSectionProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  function toggle() {
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }

  const padding = density === 'compact' ? 12 : 16;
  const headerHeight = density === 'compact' ? 36 : 44;

  const containerStyle: CSSProperties = {
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: headerHeight,
    padding: `0 ${String(padding)}px`,
    borderBottom: collapsed ? 'none' : '1px solid var(--tw-color-border-muted, #E5E7EB)',
    background: 'var(--tw-color-surface-muted, #F9FAFB)',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  };

  const chevronStyle: CSSProperties = {
    display: 'inline-block',
    transition: 'transform 120ms ease',
    transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    color: 'var(--tw-color-text-muted, #6B7280)',
    fontSize: 14,
    width: 14,
    textAlign: 'center',
  };

  const titleStyle: CSSProperties = {
    fontSize: density === 'compact' ? 13 : 14,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    margin: 0,
  };

  const bodyStyle: CSSProperties = {
    padding,
    display: collapsed ? 'none' : 'block',
  };

  return (
    <div style={containerStyle}>
      <div
        style={headerStyle}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
      >
        <div style={titleRowStyle}>
          <span aria-hidden style={chevronStyle}>▼</span>
          <h3 style={titleStyle}>{title}</h3>
        </div>
        {actions ? (
          <div onClick={(e) => { e.stopPropagation(); }}>{actions}</div>
        ) : null}
      </div>
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
