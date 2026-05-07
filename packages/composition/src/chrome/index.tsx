/**
 * Top-level page chrome components.
 *
 * Each is small enough to live in this single file. They share a similar
 * pattern (icon button + popover) and pulling them into separate files would
 * fragment the surface for marginal gain.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNotificationsStore } from '@tensaw/runtime';

// ---------------------------------------------------------------------------
// AppLauncher — top-bar icon grid for switching between Tensaw apps
// ---------------------------------------------------------------------------

export interface AppLauncherEntry {
  appId: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface AppLauncherProps {
  apps: AppLauncherEntry[];
  /** App id of the currently active app. */
  activeAppId?: string;
}

export function AppLauncher({ apps, activeAppId }: AppLauncherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-label="Open app launcher"
        aria-expanded={open}
        style={iconButtonStyle()}
      >
        ▦
      </button>
      {open ? (
        <div style={{ ...popoverStyle(), top: '100%', left: 0, marginTop: 6 }}>
          <div style={appLauncherGridStyle}>
            {apps.map((app) => {
              const isActive = app.appId === activeAppId;
              return (
                <a
                  key={app.appId}
                  href={app.href}
                  onClick={(e) => {
                    if (!app.href) e.preventDefault();
                    app.onClick?.();
                    setOpen(false);
                  }}
                  style={appTileStyle(isActive)}
                >
                  <span style={{ fontSize: 22 }}>{app.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{app.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationBell — bell icon + count badge + dropdown of recent toasts
// ---------------------------------------------------------------------------

export interface NotificationBellProps {
  /** Optional override for the count display. */
  count?: number;
}

export function NotificationBell({ count }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toasts = useNotificationsStore((s) => s.toasts);

  const displayCount = count ?? toasts.length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-label={`Notifications (${String(displayCount)})`}
        aria-expanded={open}
        style={iconButtonStyle()}
      >
        <span aria-hidden>🔔</span>
        {displayCount > 0 ? (
          <span style={badgeStyle}>{displayCount > 99 ? '99+' : displayCount}</span>
        ) : null}
      </button>
      {open ? (
        <div style={{ ...popoverStyle(), top: '100%', right: 0, marginTop: 6, width: 320 }}>
          <div style={popoverHeaderStyle}>Notifications</div>
          {toasts.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--tw-color-text-muted, #6B7280)', textAlign: 'center' }}>
              No new notifications
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {toasts.map((t) => (
                <div key={t.toastId} style={notificationRowStyle}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
                    {t.title}
                  </div>
                  {t.body ? (
                    <div style={{ fontSize: 11, color: 'var(--tw-color-text-muted, #6B7280)' }}>
                      {t.body}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => { useNotificationsStore.getState().dismissToast(t.toastId); }}
                    style={dismissButtonStyle}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UserMenu — avatar + dropdown
// ---------------------------------------------------------------------------

export interface UserMenuItem {
  label: string;
  onClick: () => void;
  /** Visual variant. 'danger' for sign out. */
  variant?: 'default' | 'danger';
}

export interface UserMenuProps {
  /** Display name shown in the dropdown header. */
  userName: string;
  /** Subline shown under name (e.g. email or role). */
  userSubtitle?: string;
  /** Initials shown in the avatar. */
  initials: string;
  items: UserMenuItem[];
}

export function UserMenu({ userName, userSubtitle, initials, items }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-label={`User menu for ${userName}`}
        aria-expanded={open}
        style={avatarButtonStyle()}
      >
        {initials}
      </button>
      {open ? (
        <div style={{ ...popoverStyle(), top: '100%', right: 0, marginTop: 6, minWidth: 220 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
            {userSubtitle ? (
              <div style={{ fontSize: 11, color: 'var(--tw-color-text-muted, #6B7280)' }}>
                {userSubtitle}
              </div>
            ) : null}
          </div>
          {items.map((item, i) => (
            <button
              key={`${item.label}-${String(i)}`}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              style={menuItemStyle(item.variant)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HelpButton — simple ? icon that calls a handler (typically opens an assistant pane)
// ---------------------------------------------------------------------------

export function HelpButton({ onClick, label = 'Help' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={iconButtonStyle()}
    >
      ?
    </button>
  );
}

// ---------------------------------------------------------------------------
// GlobalAlertBanner — full-width banner above the page header
// ---------------------------------------------------------------------------

export interface GlobalAlertBannerProps {
  severity?: 'info' | 'warning' | 'error';
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
}

export function GlobalAlertBanner({
  severity = 'info',
  children,
  onDismiss,
  action,
}: GlobalAlertBannerProps) {
  const palette = {
    info: { bg: '#EFF6FF', border: '#60A5FA', text: '#1E40AF' },
    warning: { bg: '#FEF3C7', border: '#FBBF24', text: '#92400E' },
    error: { bg: '#FEE2E2', border: '#F87171', text: '#991B1B' },
  }[severity];

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '6px 12px',
    background: palette.bg,
    borderBottom: `1px solid ${palette.border}`,
    color: palette.text,
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
  };

  return (
    <div role="alert" style={containerStyle}>
      <span>{children}</span>
      {action ? <span>{action}</span> : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            color: palette.text,
            opacity: 0.7,
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SavedViewSelector — dropdown showing the user's saved views for a page
// ---------------------------------------------------------------------------

export interface SavedView {
  viewId: string;
  label: string;
  /** Optional indicator (e.g. "(Default)"). */
  badge?: string;
}

export interface SavedViewSelectorProps {
  views: SavedView[];
  selectedViewId: string | null;
  onSelect: (viewId: string) => void;
  /** Optional handler for "Save current view as..." */
  onSaveAs?: () => void;
  /** Optional handler for "Manage views..." */
  onManage?: () => void;
}

export function SavedViewSelector({
  views,
  selectedViewId,
  onSelect,
  onSaveAs,
  onManage,
}: SavedViewSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); };
  }, [open]);

  const selected = views.find((v) => v.viewId === selectedViewId);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--tw-color-surface-muted, #F9FAFB)',
          border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--tw-color-text-primary, #1F2937)',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
        aria-expanded={open}
      >
        <span>{selected ? selected.label : 'Select view'}</span>
        <span aria-hidden style={{ fontSize: 10, color: 'var(--tw-color-text-muted, #6B7280)' }}>▼</span>
      </button>
      {open ? (
        <div style={{ ...popoverStyle(), top: '100%', right: 0, marginTop: 6, minWidth: 240 }}>
          {views.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--tw-color-text-muted, #6B7280)' }}>
              No saved views
            </div>
          ) : (
            views.map((v) => (
              <button
                key={v.viewId}
                type="button"
                onClick={() => {
                  onSelect(v.viewId);
                  setOpen(false);
                }}
                style={menuItemStyle(v.viewId === selectedViewId ? 'active' : 'default')}
              >
                <span>{v.label}</span>
                {v.badge ? (
                  <span style={{ fontSize: 10, color: 'var(--tw-color-text-muted, #6B7280)' }}>
                    {v.badge}
                  </span>
                ) : null}
              </button>
            ))
          )}
          {(onSaveAs || onManage) ? (
            <div style={{ borderTop: '1px solid var(--tw-color-border-muted, #E5E7EB)' }}>
              {onSaveAs ? (
                <button type="button" onClick={() => { onSaveAs(); setOpen(false); }} style={menuItemStyle()}>
                  Save current view as…
                </button>
              ) : null}
              {onManage ? (
                <button type="button" onClick={() => { onManage(); setOpen(false); }} style={menuItemStyle()}>
                  Manage views…
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabsWithCount — tab bar where each tab has an optional count badge
// ---------------------------------------------------------------------------

export interface TabsWithCountTab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsWithCountProps {
  tabs: TabsWithCountTab[];
  activeTabId: string;
  onChange: (tabId: string) => void;
}

export function TabsWithCount({ tabs, activeTabId, onChange }: TabsWithCountProps) {
  return (
    <div style={tabBarOuterStyle} role="tablist">
      {tabs.map((t) => {
        const active = t.id === activeTabId;
        return (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => { onChange(t.id); }}
            role="tab"
            aria-selected={active}
            style={tabButtonInnerStyle(active, t.disabled === true)}
          >
            <span>{t.label}</span>
            {typeof t.count === 'number' ? (
              <span style={countPillStyle(active)}>{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// -- Shared styles ------------------------------------------------------------

function iconButtonStyle(): CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: 'var(--tw-color-text-muted, #6B7280)',
    cursor: 'pointer',
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    borderRadius: 6,
    position: 'relative',
  };
}

function avatarButtonStyle(): CSSProperties {
  return {
    background: 'var(--tw-color-brand-accent, #218D8D)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
  };
}

function popoverStyle(): CSSProperties {
  return {
    position: 'absolute',
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 100,
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden',
  };
}

const popoverHeaderStyle: CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--tw-color-text-muted, #6B7280)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
};

const badgeStyle: CSSProperties = {
  position: 'absolute',
  top: 2,
  right: 2,
  minWidth: 16,
  height: 16,
  padding: '0 4px',
  borderRadius: 8,
  background: '#DC2626',
  color: 'white',
  fontSize: 9,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const appLauncherGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 4,
  padding: 8,
  width: 240,
};

const appTileStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 12,
  borderRadius: 6,
  background: active ? 'var(--tw-color-brand-tint, #EBF7F6)' : 'transparent',
  color: 'var(--tw-color-text-primary, #1F2937)',
  textDecoration: 'none',
  cursor: 'pointer',
});

const notificationRowStyle: CSSProperties = {
  position: 'relative',
  padding: '10px 28px 10px 12px',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
};

const dismissButtonStyle: CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 8,
  background: 'none',
  border: 'none',
  color: 'var(--tw-color-text-muted, #9CA3AF)',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
};

const menuItemStyle = (variant?: 'default' | 'danger' | 'active'): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '8px 12px',
  background: variant === 'active' ? 'var(--tw-color-brand-tint, #EBF7F6)' : 'transparent',
  border: 'none',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: variant === 'active' ? 600 : 500,
  color:
    variant === 'danger'
      ? 'var(--tw-color-status-danger-fg, #DC2626)'
      : 'var(--tw-color-text-primary, #1F2937)',
  cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
});

const tabBarOuterStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  fontFamily: 'system-ui, sans-serif',
};

const tabButtonInnerStyle = (active: boolean, disabled: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid var(--tw-color-brand-accent, #218D8D)' : '2px solid transparent',
  marginBottom: -1,
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  color: disabled
    ? 'var(--tw-color-text-disabled, #D1D5DB)'
    : active
      ? 'var(--tw-color-brand-accent, #218D8D)'
      : 'var(--tw-color-text-muted, #6B7280)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
});

const countPillStyle = (active: boolean): CSSProperties => ({
  background: active ? 'var(--tw-color-brand-accent, #218D8D)' : 'var(--tw-color-surface-muted, #F3F4F6)',
  color: active ? 'white' : 'var(--tw-color-text-muted, #6B7280)',
  fontSize: 10,
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: 8,
  minWidth: 18,
  textAlign: 'center',
});
