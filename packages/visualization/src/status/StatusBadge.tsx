/**
 * StatusBadge — single component for every status pill in the platform.
 *
 * Usage:
 *   <StatusBadge taxonomy="claim" status="denied" />
 *   <StatusBadge taxonomy="eob" status="parsed_needs_review" />
 *   <StatusBadge taxonomy="appointment" status="no_show" size="compact" />
 *
 * If the taxonomy or status key isn't registered, renders a fallback "neutral"
 * pill with the raw key string (instead of breaking). Dev-mode logs a warning
 * so missing entries surface during development.
 */

import type { CSSProperties } from 'react';
import { getStatusEntry, type StatusEntry, type StatusTone } from './taxonomy';

export interface StatusBadgeProps {
  /** Taxonomy name (built-in or custom-registered). */
  taxonomy: string;
  /** Status key within the taxonomy. */
  status: string;
  /** Override the registry's label (rare — for translations or i18n). */
  label?: string;
  /** Compact density. Smaller font, less padding. */
  size?: 'default' | 'compact';
  /** Show a leading dot indicator. */
  withDot?: boolean;
}

const TONE_STYLES: Record<StatusTone, { bg: string; border: string; text: string; dot: string }> = {
  neutral: {
    bg: 'var(--tw-color-status-neutral-bg, #F3F4F6)',
    border: 'var(--tw-color-status-neutral-border, #D1D5DB)',
    text: 'var(--tw-color-status-neutral-fg, #374151)',
    dot: '#6B7280',
  },
  info: {
    bg: 'var(--tw-color-status-info-bg, #EFF6FF)',
    border: 'var(--tw-color-status-info-border, #60A5FA)',
    text: 'var(--tw-color-status-info-fg, #1E40AF)',
    dot: '#3B82F6',
  },
  success: {
    bg: 'var(--tw-color-status-success-bg, #ECFDF5)',
    border: 'var(--tw-color-status-success-border, #34D399)',
    text: 'var(--tw-color-status-success-fg, #065F46)',
    dot: '#10B981',
  },
  warning: {
    bg: 'var(--tw-color-status-warning-bg, #FEF3C7)',
    border: 'var(--tw-color-status-warning-border, #FBBF24)',
    text: 'var(--tw-color-status-warning-fg, #92400E)',
    dot: '#F59E0B',
  },
  danger: {
    bg: 'var(--tw-color-status-danger-bg, #FEE2E2)',
    border: 'var(--tw-color-status-danger-border, #F87171)',
    text: 'var(--tw-color-status-danger-fg, #991B1B)',
    dot: '#DC2626',
  },
  pending: {
    bg: 'var(--tw-color-status-pending-bg, #FEF3C7)',
    border: 'var(--tw-color-status-pending-border, #FCD34D)',
    text: 'var(--tw-color-status-pending-fg, #92400E)',
    dot: '#F59E0B',
  },
  inactive: {
    bg: 'var(--tw-color-status-inactive-bg, #F3F4F6)',
    border: 'var(--tw-color-status-inactive-border, #D1D5DB)',
    text: 'var(--tw-color-status-inactive-fg, #6B7280)',
    dot: '#9CA3AF',
  },
};

const isDev =
  (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') ||
  (typeof import.meta !== 'undefined' &&
    'env' in import.meta &&
    (import.meta.env as { DEV?: boolean }).DEV === true);

export function StatusBadge({
  taxonomy,
  status,
  label,
  size = 'default',
  withDot = false,
}: StatusBadgeProps) {
  const entry: StatusEntry = getStatusEntry(taxonomy, status) ?? {
    label: status,
    tone: 'neutral',
  };

  if (isDev && !getStatusEntry(taxonomy, status)) {
     
    console.warn(
      `[StatusBadge] Unknown status "${status}" in taxonomy "${taxonomy}". Falling back to neutral. ` +
        `Add it to the taxonomy in @tensaw/visualization/status/taxonomy.ts or call registerTaxonomy().`,
    );
  }

  const styles = TONE_STYLES[entry.tone];
  const displayLabel = label ?? entry.label;

  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: size === 'compact' ? '2px 8px' : '3px 10px',
    fontSize: size === 'compact' ? 11 : 12,
    fontWeight: 500,
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.4,
    color: styles.text,
    background: styles.bg,
    border: `1px solid ${styles.border}`,
    borderRadius: 9999,
    whiteSpace: 'nowrap',
  };

  const dotStyle: CSSProperties = {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: styles.dot,
    flexShrink: 0,
  };

  return (
    <span style={baseStyle} role="status" aria-label={`${taxonomy} status: ${displayLabel}`}>
      {withDot ? <span aria-hidden style={dotStyle} /> : null}
      {displayLabel}
    </span>
  );
}
