/**
 * Inline cell editors for the AR Mgmt grid.
 *
 *   - <OwnerCell>     : native <select> styled with Tailwind. Empty → "Unassigned".
 *                       Fires ar.update-owner on commit.
 *   - <DueDateCell>   : native date input styled with Tailwind. Empty → "—".
 *                       Fires ar.update-due-date.
 *   - <PriorityCell>  : read-only <Badge> with variant per tier.
 *   - <StatusCell>    : read-only <Badge> with variant per status.
 *   - <BalanceCell>   : right-aligned tabular money rendering.
 *
 * Why native <select> / <input type="date"> instead of design-system <Select>
 * / <DatePicker>? Inline grid cells need to be dense (24 px tall) and 100%
 * keyboard-accessible by default — native form controls are the better fit
 * for that density. The design-system <Select> and <DatePicker> are sized
 * and styled for full-page forms, not 24-pixel-tall inline editors.
 *
 * Editors are local-state-controlled with optimistic dispatch — the action
 * dispatcher applies an optimistic patch on send, so the UI reflects the
 * change immediately and reverts only on failure.
 */

import { useState } from 'react';
import { Badge, formatMoney } from '@tensaw/design-system';
import { useActionDispatcher } from '@tensaw/actions';
import type {
  ARRow,
  ClaimStatus,
  Priority,
  RefDataItem,
} from '@tensaw/mock-server';

// ---------------------------------------------------------------------------
// Owner cell
// ---------------------------------------------------------------------------

const SELECT_BASE_CLASS =
  'h-6 max-w-[140px] rounded border border-transparent bg-transparent px-1 text-xs ' +
  'cursor-pointer transition-colors ' +
  'hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export interface OwnerCellProps {
  row: ARRow;
  owners: readonly RefDataItem[];
}

export function OwnerCell({ row, owners }: OwnerCellProps) {
  const dispatch = useActionDispatcher();
  const [pending, setPending] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value === '' ? null : e.target.value;
    if (next === row.ownerId) return;
    setPending(true);
    await dispatch('ar.update-owner', { rowId: row.id, ownerId: next });
    setPending(false);
  };

  return (
    <select
      value={row.ownerId ?? ''}
      onChange={(e) => {
        void onChange(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      disabled={pending}
      className={
        SELECT_BASE_CLASS +
        (row.ownerId ? ' text-foreground' : ' text-muted-foreground')
      }
    >
      <option value="">Unassigned</option>
      {owners.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Due Date cell
// ---------------------------------------------------------------------------

const DATE_INPUT_BASE_CLASS =
  'h-6 w-[130px] rounded border border-transparent bg-transparent px-1 text-xs ' +
  'transition-colors ' +
  'hover:border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export interface DueDateCellProps {
  row: ARRow;
}

export function DueDateCell({ row }: DueDateCellProps) {
  const dispatch = useActionDispatcher();
  const [pending, setPending] = useState(false);

  // Native date input expects YYYY-MM-DD.
  const inputValue = row.dueAt ? row.dueAt.slice(0, 10) : '';

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const nextIso = v === '' ? null : new Date(`${v}T17:00:00Z`).toISOString();
    if (nextIso === row.dueAt) return;
    setPending(true);
    await dispatch('ar.update-due-date', { rowId: row.id, dueAt: nextIso });
    setPending(false);
  };

  // Highlight overdue dates in red.
  const isOverdue =
    row.dueAt !== null && new Date(row.dueAt).getTime() < Date.now();

  return (
    <input
      type="date"
      value={inputValue}
      onChange={(e) => {
        void onChange(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      disabled={pending}
      className={
        DATE_INPUT_BASE_CLASS +
        (isOverdue ? ' text-destructive' : ' text-foreground')
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Priority badge (read-only)
// ---------------------------------------------------------------------------

const PRIORITY_VARIANT: Record<Priority, 'error' | 'warning' | 'default' | 'secondary'> = {
  P1: 'error',
  P2: 'warning',
  P3: 'default',
  P4: 'secondary',
};

export function PriorityCell({ row }: { row: ARRow }) {
  return (
    <Badge variant={PRIORITY_VARIANT[row.priority]} size="sm">
      {row.priority}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Status badge (read-only)
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<
  ClaimStatus,
  'success' | 'default' | 'secondary' | 'error' | 'warning' | 'outline'
> = {
  completed: 'success',
  filed: 'default',
  secondary: 'secondary',
  denied: 'error',
  rejected: 'warning',
  closed: 'outline',
};

const STATUS_LABELS: Record<ClaimStatus, string> = {
  completed: 'Completed',
  filed: 'Filed',
  secondary: 'Secondary',
  denied: 'Denied',
  rejected: 'Rejected',
  closed: 'Closed',
};

export function StatusCell({ row }: { row: ARRow }) {
  return (
    <Badge variant={STATUS_VARIANT[row.status]} size="sm">
      {STATUS_LABELS[row.status]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Money cells (right-aligned, tabular nums)
// ---------------------------------------------------------------------------

export function BalanceCell({ row }: { row: ARRow }) {
  return <span className="tabular-nums">{formatMoney(row.balance)}</span>;
}

export function BilledCell({ row }: { row: ARRow }) {
  return (
    <span className="tabular-nums text-muted-foreground">
      {formatMoney(row.billed)}
    </span>
  );
}
