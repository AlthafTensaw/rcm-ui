/**
 * Optimistic update patterns.
 *
 * Each pattern takes the current cached response shape (assumed to be
 * `{ rows: TRow[], totalCount: number }` for list patterns) and produces a
 * new shape with the patch applied.
 *
 * Returns a tuple `[next, undo]` so the dispatcher can roll back on failure.
 * The undo is a closure capturing the pre-patch shape.
 *
 * Patterns deliberately accept `unknown` for the cached value and use
 * narrow runtime checks. This keeps them framework-agnostic.
 */

import type { OptimisticPattern } from '../types';

/** Generic shape every list query is expected to return. */
interface ListShape<TRow = Record<string, unknown>> {
  rows: TRow[];
  totalCount: number;
}

/**
 * Apply an optimistic patch to a cached value. Returns `null` if the pattern
 * is `'none'` or the cached value isn't shaped like a list. Otherwise returns
 * the new value and a `revert` function that produces the pre-patch value.
 */
export function applyOptimistic(
  pattern: OptimisticPattern,
  request: unknown,
  cached: unknown,
): { next: unknown; revert: () => unknown } | null {
  if (pattern.pattern === 'none') return null;
  if (!isListShape(cached)) return null;

  const before = cloneList(cached);

  switch (pattern.pattern) {
    case 'update-row-field': {
      const id = pattern.rowIdFrom(request);
      const fields = pattern.fields(request);
      const next: ListShape = {
        rows: cached.rows.map((row) =>
          rowId(row) === id ? { ...row, ...fields } : row,
        ),
        totalCount: cached.totalCount,
      };
      return { next, revert: () => before };
    }
    case 'replace-row': {
      const id = pattern.rowIdFrom(request);
      const replacement = request as Record<string, unknown>;
      const next: ListShape = {
        rows: cached.rows.map((row) => (rowId(row) === id ? { ...replacement } : row)),
        totalCount: cached.totalCount,
      };
      return { next, revert: () => before };
    }
    case 'append-row': {
      const newRow = pattern.rowFrom(request) as Record<string, unknown>;
      const next: ListShape = {
        rows: [...cached.rows, newRow],
        totalCount: cached.totalCount + 1,
      };
      return { next, revert: () => before };
    }
    case 'prepend-row': {
      const newRow = pattern.rowFrom(request) as Record<string, unknown>;
      const next: ListShape = {
        rows: [newRow, ...cached.rows],
        totalCount: cached.totalCount + 1,
      };
      return { next, revert: () => before };
    }
    case 'remove-row': {
      const id = pattern.rowIdFrom(request);
      const next: ListShape = {
        rows: cached.rows.filter((row) => rowId(row) !== id),
        totalCount: Math.max(0, cached.totalCount - 1),
      };
      return { next, revert: () => before };
    }
    default: {
      // Exhaustiveness check at type level. If a new pattern is added to the
      // union, TypeScript will flag this branch.
      const _exhaustive: never = pattern;
      void _exhaustive;
      return null;
    }
  }
}

// ---------------------------------------------------------------------------

function isListShape(value: unknown): value is ListShape {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.rows) && typeof v.totalCount === 'number';
}

function rowId(row: unknown): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const r = row as Record<string, unknown>;
  // Common id field names. Apps can stick with 'id' or 'rowId' to stay in pattern.
  if (typeof r.id === 'string') return r.id;
  if (typeof r.rowId === 'string') return r.rowId;
  if (typeof r.id === 'number') return String(r.id);
  return undefined;
}

function cloneList(list: ListShape): ListShape {
  return {
    rows: list.rows.map((r) => ({ ...(r) })),
    totalCount: list.totalCount,
  };
}
