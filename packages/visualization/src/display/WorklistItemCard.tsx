/**
 * WorklistItemCard — the left-rail building block on every detail page.
 *
 * Shows: name, identifier (MRN / claim # / etc.), status, optional age/SLA,
 * optional assignee. Selectable, clickable, keyboard-navigable.
 *
 * Click behavior (per locked decision):
 *   1. If `onClick` is provided, it runs and is the single source of truth.
 *      The caller decides whether to also publish events.
 *   2. If `onClick` is absent and `domain` + `rowId` are provided, the card
 *      publishes WORKLIST_ROW_OPENED on click. This is the "drop in and it
 *      works" path for stock worklists.
 *   3. If neither is provided, the card is non-interactive (display-only).
 */

import { buildEvent, publishEvent } from '@tensaw/runtime';
import type { CSSProperties, ReactNode } from 'react';
import { StatusBadge } from '../status/StatusBadge';
import { PriorityDot } from '../status/PriorityDot';

export interface WorklistItemCardProps {
  /** Display name. e.g. "Andrews, Jenny". Required. */
  name: string;
  /** Secondary identifier line. e.g. "MRN 11403", "Claim #10123". */
  identifier?: string;
  /** Tertiary metadata line. e.g. "Stress Echo · BSW Frisco". */
  metadata?: string;
  /** Date / age string. e.g. "07/14/1991", "2 days ago". */
  date?: string;
  /** Optional money or count badge top-right. */
  rightBadge?: ReactNode;
  /** Optional StatusBadge prop pair. */
  status?: { taxonomy: string; status: string };
  /** Priority indicator. */
  priority?: 'high' | 'medium' | 'low' | 'sla_breached';
  /** Assignee initials/short label. e.g. "AS", "Kishore". */
  assignee?: string;
  /** Domain string for the event-bus fallback (e.g. "patient", "claim"). */
  domain?: string;
  /** Stable row id for the event-bus fallback. */
  rowId?: string;
  /**
   * Explicit click handler. If present, takes precedence over the event-bus
   * fallback. Receives the rowId for convenience.
   */
  onClick?: (rowId: string | undefined) => void;
  /** Selected state — bold left border + tinted background. */
  selected?: boolean;
  /** Page id where this card is rendered — used for event meta. */
  sourcePageId?: string;
}

export function WorklistItemCard({
  name,
  identifier,
  metadata,
  date,
  rightBadge,
  status,
  priority,
  assignee,
  domain,
  rowId,
  onClick,
  selected = false,
  sourcePageId = 'unknown',
}: WorklistItemCardProps) {
  const interactive = onClick !== undefined || (domain !== undefined && rowId !== undefined);

  function handleClick() {
    if (onClick) {
      onClick(rowId);
      return;
    }
    if (domain && rowId) {
      publishEvent(
        buildEvent(
          'WORKLIST_ROW_OPENED',
          { domain, rowId },
          { sourcePageId, correlationId: makeCorrelationId() },
        ),
      );
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 12px',
    background: selected
      ? 'var(--tw-color-brand-tint, #EBF7F6)'
      : 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid',
    borderColor: selected
      ? 'var(--tw-color-brand-accent, #218D8D)'
      : 'var(--tw-color-border-muted, #E5E7EB)',
    borderLeftWidth: selected ? 4 : 1,
    borderRadius: 8,
    cursor: interactive ? 'pointer' : 'default',
    fontFamily: 'system-ui, sans-serif',
    transition: 'background 120ms ease',
  };

  const topRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  };

  const nameStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    lineHeight: 1.3,
  };

  const dateStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  const identifierStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  };

  const metadataStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const bottomRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 6,
  };

  const assigneeStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  const rightBadgeStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
  };

  return (
    <div
      style={containerStyle}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-selected={selected || undefined}
    >
      <div style={topRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          {priority ? (
            <PriorityDot
              level={priority === 'sla_breached' ? 'sla-breached' : priority}
            />
          ) : null}
          <span style={nameStyle}>{name}</span>
        </div>
        {date ? <span style={dateStyle}>{date}</span> : null}
        {rightBadge !== undefined ? <span style={rightBadgeStyle}>{rightBadge}</span> : null}
      </div>

      {identifier ? <span style={identifierStyle}>{identifier}</span> : null}
      {metadata ? <span style={metadataStyle}>{metadata}</span> : null}

      {(status || assignee) ? (
        <div style={bottomRowStyle}>
          {status ? (
            <StatusBadge taxonomy={status.taxonomy} status={status.status} size="compact" />
          ) : (
            <span />
          )}
          {assignee ? <span style={assigneeStyle}>{assignee}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function makeCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
