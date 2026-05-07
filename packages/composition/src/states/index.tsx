/**
 * Standard state components.
 *
 * Used by WidgetHost to render lifecycle states uniformly. Also exported for
 * any consumer (e.g. a list widget showing its own empty state).
 *
 * All four follow the same visual pattern:
 *   - Centered content
 *   - Optional icon
 *   - Title (always)
 *   - Body (optional)
 *   - Optional action
 *
 * Sized to fit inside a container — small padding, no enormous illustrations.
 */

import type { CSSProperties, ReactNode } from 'react';

interface StateBaseProps {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  /** Icon glyph or component. Defaults vary per state. */
  icon?: ReactNode | false;
  /** Compact mode for tight container widgets. */
  compact?: boolean;
}

const containerStyle = (compact: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: compact ? 12 : 24,
  gap: 8,
  fontFamily: 'system-ui, sans-serif',
  color: 'var(--tw-color-text-secondary, #4B5563)',
  minHeight: compact ? 80 : 140,
});

const iconStyle = (color: string): CSSProperties => ({
  fontSize: 24,
  color,
  opacity: 0.6,
  marginBottom: 4,
});

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--tw-color-text-primary, #1F2937)',
};

const bodyStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--tw-color-text-muted, #6B7280)',
  maxWidth: 360,
  lineHeight: 1.5,
};

const actionWrapperStyle: CSSProperties = {
  marginTop: 8,
};

// ---------------------------------------------------------------------------

export function LoadingState({ title = 'Loading...', compact = false }: { title?: string; compact?: boolean }) {
  return (
    <div style={containerStyle(compact)} role="status" aria-busy="true">
      <span aria-hidden style={{ ...iconStyle('var(--tw-color-text-muted, #6B7280)'), animation: 'tensaw-spin 1s linear infinite' }}>
        ⟳
      </span>
      <span style={titleStyle}>{title}</span>
      <SpinnerKeyframes />
    </div>
  );
}

function SpinnerKeyframes() {
  // Inject the keyframe rule once so the spin animation works without a global stylesheet.
  return (
    <style>{`
@keyframes tensaw-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
    `}</style>
  );
}

// ---------------------------------------------------------------------------

export interface EmptyStateProps extends StateBaseProps {
  title: string;
}

export function EmptyState({
  title,
  body,
  action,
  icon = '∅',
  compact = false,
}: EmptyStateProps) {
  return (
    <div style={containerStyle(compact)}>
      {icon !== false ? (
        <span aria-hidden style={iconStyle('var(--tw-color-text-muted, #6B7280)')}>
          {icon}
        </span>
      ) : null}
      <span style={titleStyle}>{title}</span>
      {body ? <span style={bodyStyle}>{body}</span> : null}
      {action ? <div style={actionWrapperStyle}>{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface ErrorStateProps extends Omit<StateBaseProps, 'title'> {
  title?: string;
  /** When provided, renders a "Retry" button calling this. */
  onRetry?: () => void;
  /** Optional error code to display in small print (helps support). */
  errorCode?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  action,
  onRetry,
  errorCode,
  icon = '⊗',
  compact = false,
}: ErrorStateProps) {
  return (
    <div style={containerStyle(compact)} role="alert">
      {icon !== false ? (
        <span aria-hidden style={iconStyle('var(--tw-color-status-danger-fg, #DC2626)')}>
          {icon}
        </span>
      ) : null}
      <span style={titleStyle}>{title}</span>
      {body ? <span style={bodyStyle}>{body}</span> : null}
      {errorCode ? (
        <span style={{ fontSize: 11, color: 'var(--tw-color-text-muted, #9CA3AF)', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
          {errorCode}
        </span>
      ) : null}
      {(action || onRetry) ? (
        <div style={actionWrapperStyle}>
          {action ?? null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: 'var(--tw-color-brand-primary, #14B8A6)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface PermissionDeniedStateProps {
  /** Permission key that was missing. Shown in small print to help support. */
  missingPermission?: string;
  body?: ReactNode;
  compact?: boolean;
}

export function PermissionDeniedState({
  missingPermission,
  body = 'You do not have permission to view this content.',
  compact = false,
}: PermissionDeniedStateProps) {
  return (
    <div style={containerStyle(compact)} role="status">
      <span aria-hidden style={iconStyle('var(--tw-color-text-muted, #6B7280)')}>
        🔒
      </span>
      <span style={titleStyle}>Access denied</span>
      <span style={bodyStyle}>{body}</span>
      {missingPermission ? (
        <span style={{ fontSize: 11, color: 'var(--tw-color-text-muted, #9CA3AF)', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
          Required permission: {missingPermission}
        </span>
      ) : null}
    </div>
  );
}
