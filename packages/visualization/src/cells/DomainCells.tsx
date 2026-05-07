/**
 * Domain-aware grid cell renderers.
 *
 * - CodeCell: renders a CPT/ICD/POS code with hover tooltip showing description.
 * - StatusCell: wraps StatusBadge for table use.
 * - AssigneeCell: avatar initials + name.
 */

import type { CSSProperties } from 'react';
import { codes } from '@tensaw/codes';
import { StatusBadge } from '../status/StatusBadge';

const MUTED_STYLE: CSSProperties = {
  color: 'var(--tw-color-text-muted, #9CA3AF)',
};

// -- CodeCell --------------------------------------------------------------

export interface CodeCellProps {
  code: string | null | undefined;
  /** Which code system to look up. */
  system: 'cpt' | 'icd' | 'pos' | 'hcpcs' | 'carc' | 'rarc';
  /** Show description after the code (e.g. "99215 Office visit"). Default false. */
  showDescription?: boolean;
}

/**
 * Code cell with hover tooltip. CPT lookups go through the server adapter
 * (synchronous read from cache; if not cached, displays code only and a
 * separate flow can warm the cache).
 */
export function CodeCell({ code, system, showDescription = false }: CodeCellProps) {
  if (!code) return <span style={MUTED_STYLE}>—</span>;

  const description = lookupDescription(code, system);

  const codeStyle: CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    fontSize: 'inherit',
    fontVariantNumeric: 'tabular-nums',
  };

  if (showDescription && description) {
    return (
      <span title={description}>
        <span style={codeStyle}>{code}</span>{' '}
        <span style={{ color: 'var(--tw-color-text-muted, #6B7280)' }}>
          {description.length > 40 ? `${description.slice(0, 40)}…` : description}
        </span>
      </span>
    );
  }

  return (
    <span style={codeStyle} title={description ?? undefined}>
      {code}
    </span>
  );
}

function lookupDescription(code: string, system: CodeCellProps['system']): string | null {
  switch (system) {
    case 'cpt': {
      const entry = codes.cpt.get(code);
      return entry?.description ?? null;
    }
    case 'icd': {
      const entry = codes.icd.get(code);
      return entry?.description ?? null;
    }
    case 'pos': {
      const entry = codes.pos.get(code);
      return entry?.description ?? null;
    }
    case 'hcpcs': {
      const entry = codes.hcpcs.get(code);
      return entry?.description ?? null;
    }
    case 'carc': {
      const entry = codes.carc.get(code);
      return entry?.description ?? null;
    }
    case 'rarc': {
      const entry = codes.rarc.get(code);
      return entry?.description ?? null;
    }
  }
}

// -- StatusCell ------------------------------------------------------------

export interface StatusCellProps {
  taxonomy: string;
  status: string | null | undefined;
}

/** Wrapper around StatusBadge with table-friendly fallback. */
export function StatusCell({ taxonomy, status }: StatusCellProps) {
  if (!status) return <span style={MUTED_STYLE}>—</span>;
  return <StatusBadge taxonomy={taxonomy} status={status} size="compact" />;
}

// -- AssigneeCell ----------------------------------------------------------

export interface AssigneeCellProps {
  name: string | null | undefined;
  /** Color for the avatar background. Default deterministic from name. */
  avatarColor?: string;
  /** Show full name beside avatar. Default true. */
  showName?: boolean;
}

/**
 * Avatar (initials) + name. The initials are computed from the name; avatar
 * color is deterministic per name (hash-based) so the same person gets the
 * same color across the app.
 */
export function AssigneeCell({ name, avatarColor, showName = true }: AssigneeCellProps) {
  if (!name) return <span style={MUTED_STYLE}>—</span>;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const bg = avatarColor ?? colorFromName(name);

  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  const avatarStyle: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: bg,
    color: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    flexShrink: 0,
  };

  return (
    <span style={containerStyle}>
      <span style={avatarStyle} aria-hidden>
        {initials}
      </span>
      {showName ? <span>{name}</span> : null}
    </span>
  );
}

const AVATAR_COLORS = [
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#F97316', // orange
  '#10B981', // emerald
  '#6366F1', // indigo
  '#EC4899', // pink
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return (
    AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ??
    AVATAR_COLORS[0] ??
    '#6B7280'
  );
}
