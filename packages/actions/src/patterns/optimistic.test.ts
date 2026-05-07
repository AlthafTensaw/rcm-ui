import { describe, expect, it } from 'vitest';
import { applyOptimistic } from './optimistic';
import type { OptimisticPattern } from '../types';

const cached = {
  rows: [
    { id: 'r1', ownerId: null, balance: 100 },
    { id: 'r2', ownerId: 'u1', balance: 200 },
    { id: 'r3', ownerId: null, balance: 300 },
  ],
  totalCount: 3,
};

/**
 * Local helper: assert applyOptimistic returned a result and return the
 * narrowed value. Avoids `!` non-null assertions which are banned by lint.
 */
function expectResult(
  result: ReturnType<typeof applyOptimistic>,
): { next: unknown; revert: () => unknown } {
  if (result === null) {
    throw new Error('applyOptimistic returned null when a result was expected');
  }
  return result;
}

describe('applyOptimistic — none', () => {
  it('returns null', () => {
    expect(applyOptimistic({ pattern: 'none' }, {}, cached)).toBeNull();
  });
});

describe('applyOptimistic — non-list cached value', () => {
  const pattern: OptimisticPattern = {
    pattern: 'update-row-field',
    target: 't',
    rowIdFrom: () => 'r1',
    fields: () => ({}),
  };

  it('returns null when cached is not a list shape', () => {
    expect(applyOptimistic(pattern, {}, { foo: 'bar' })).toBeNull();
    expect(applyOptimistic(pattern, {}, null)).toBeNull();
  });
});

describe('applyOptimistic — update-row-field', () => {
  it('updates fields on the matching row', () => {
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'update-row-field',
          target: 'ar-list',
          rowIdFrom: (req) => (req as { rowId: string }).rowId,
          fields: (req) => ({ ownerId: (req as { ownerId: string }).ownerId }),
        },
        { rowId: 'r1', ownerId: 'u9' },
        cached,
      ),
    );
    const next = out.next as typeof cached;
    expect(next.rows[0]?.ownerId).toBe('u9');
    expect(next.rows[0]?.balance).toBe(100); // unchanged
    expect(next.rows[1]?.ownerId).toBe('u1'); // not the target row
    expect(next.totalCount).toBe(3);
  });

  it('revert restores the original list', () => {
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'update-row-field',
          target: 'ar-list',
          rowIdFrom: () => 'r1',
          fields: () => ({ ownerId: 'u9' }),
        },
        {},
        cached,
      ),
    );
    expect(out.revert()).toEqual(cached);
  });

  it('does not mutate the original cached list', () => {
    const original = { ...cached, rows: [...cached.rows] };
    applyOptimistic(
      {
        pattern: 'update-row-field',
        target: 'ar-list',
        rowIdFrom: () => 'r1',
        fields: () => ({ ownerId: 'u9' }),
      },
      {},
      cached,
    );
    expect(cached).toEqual(original);
  });
});

describe('applyOptimistic — append-row', () => {
  it('appends a new row and increments totalCount', () => {
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'append-row',
          target: 'ar-list',
          rowFrom: () => ({ id: 'r4', ownerId: null, balance: 50 }),
        },
        {},
        cached,
      ),
    );
    const next = out.next as typeof cached;
    expect(next.rows).toHaveLength(4);
    expect(next.rows[3]?.id).toBe('r4');
    expect(next.totalCount).toBe(4);
  });
});

describe('applyOptimistic — prepend-row', () => {
  it('prepends a new row', () => {
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'prepend-row',
          target: 'ar-list',
          rowFrom: () => ({ id: 'r0', ownerId: null, balance: 50 }),
        },
        {},
        cached,
      ),
    );
    const next = out.next as typeof cached;
    expect(next.rows[0]?.id).toBe('r0');
    expect(next.totalCount).toBe(4);
  });
});

describe('applyOptimistic — remove-row', () => {
  it('removes the matching row and decrements totalCount', () => {
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'remove-row',
          target: 'ar-list',
          rowIdFrom: () => 'r2',
        },
        {},
        cached,
      ),
    );
    const next = out.next as typeof cached;
    expect(next.rows).toHaveLength(2);
    expect(next.rows.find((r) => r.id === 'r2')).toBeUndefined();
    expect(next.totalCount).toBe(2);
  });

  it('clamps totalCount at 0', () => {
    const empty = { rows: [{ id: 'r1' }], totalCount: 0 };
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'remove-row',
          target: 'ar-list',
          rowIdFrom: () => 'r1',
        },
        {},
        empty,
      ),
    );
    const next = out.next as { totalCount: number };
    expect(next.totalCount).toBe(0);
  });
});

describe('applyOptimistic — replace-row', () => {
  it('replaces the matching row with the request', () => {
    const replacement = { id: 'r2', ownerId: 'u99', balance: 999 };
    const out = expectResult(
      applyOptimistic(
        {
          pattern: 'replace-row',
          target: 'ar-list',
          rowIdFrom: () => 'r2',
        },
        replacement,
        cached,
      ),
    );
    const next = out.next as typeof cached;
    expect(next.rows[1]).toEqual(replacement);
  });
});
