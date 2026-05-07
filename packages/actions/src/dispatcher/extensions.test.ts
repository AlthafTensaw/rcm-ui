/**
 * Tests for the three §15 additions to the action contract:
 *   - dryRun mode (per-call DispatchOptions)
 *   - timeoutMs override (per-action declaration field)
 *   - cacheKey override (per-action declaration field, query only)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  useAuthStore,
  useSurfacesStore,
  resetAllStoresForTesting,
} from '@tensaw/runtime';
import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
  dispatchAction,
  readCacheValue,
  setRouterAdapter,
  type DryRunResult,
} from '../index';

import './testEnvSetup';

function signInWithPermissions(permissions: string[] = []): void {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u1',
      username: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: [],
      permissions,
      clinicIds: [],
    },
    clinicId: 'c1',
  });
}

function envelope<T>(data: T) {
  return {
    success: true as const,
    data,
    meta: { correlationId: 'cor-1', timestamp: '2026-01-01T00:00:00Z' },
  };
}

beforeEach(() => {
  resetAllStoresForTesting();
  _clearActionRegistry();
  _clearActionCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  _clearActionRegistry();
  _clearActionCache();
});

// ---------------------------------------------------------------------------
// dryRun
// ---------------------------------------------------------------------------

describe('dispatchAction — dryRun', () => {
  it('query: returns DryRunResult and does not call fetch', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({ pageIndex: z.number() }),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatchAction('ar.list', { pageIndex: 0 }, { dryRun: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dr = result.data as DryRunResult;
      expect(dr.dryRun).toBe(true);
      expect(dr.kind).toBe('query');
      expect(dr.actionId).toBe('ar.list');
      expect(dr.wouldDispatch?.method).toBe('GET');
      expect(dr.wouldDispatch?.url).toContain('/api/v1/ar');
      expect(dr.wouldDispatch?.url).toContain('pageIndex=0');
      expect(dr.wouldDispatch?.body).toBeUndefined();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mutation: returns DryRunResult with body, does not call fetch, no cache mutation', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      cache: { tag: 'ar-list' },
    });
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
      request: z.object({ rowId: z.string(), ownerId: z.string().nullable() }),
      response: z.object({}),
      optimistic: {
        pattern: 'update-row-field',
        target: 'ar-list',
        rowIdFrom: (req) => (req as { rowId: string }).rowId,
        fields: (req) => ({ ownerId: (req as { ownerId: string | null }).ownerId }),
      },
    });

    // Pre-seed the cache so we can verify the optimistic patch is NOT applied.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve(
            envelope({ rows: [{ id: 'r1', ownerId: null }], totalCount: 1 }),
          ),
      });
    vi.stubGlobal('fetch', fetchMock);
    await dispatchAction('ar.list', {});
    const cacheBefore = readCacheValue('ar.list::{}');
    expect(cacheBefore).toBeDefined();

    // Now dryRun the mutation. Cache should be untouched, no fetch.
    const result = await dispatchAction(
      'ar.update-owner',
      { rowId: 'r1', ownerId: 'u9' },
      { dryRun: true },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dr = result.data as DryRunResult;
      expect(dr.kind).toBe('mutation');
      expect(dr.wouldDispatch?.method).toBe('PATCH');
      expect(dr.wouldDispatch?.url).toMatch(/\/api\/v1\/ar\/r1\/owner$/);
      expect(JSON.parse(dr.wouldDispatch?.body ?? '{}')).toEqual({ ownerId: 'u9' });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the initial query

    const cacheAfter = readCacheValue('ar.list::{}')!;
    expect(cacheAfter.rows[0]?.ownerId).toBeNull(); // optimistic patch NOT applied
  });

  it('surface: returns DryRunResult and does not dispatch openSurface', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.preview-eob',
      kind: 'surface',
      surfaceKind: 'drawer',
      componentId: 'eob.preview-widget',
      request: z.object({ rowId: z.string() }),
      propsFromArgs: (a) => ({ rowId: a.rowId }),
    });

    const result = await dispatchAction('ar.preview-eob', { rowId: 'r1' }, { dryRun: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dr = result.data as DryRunResult;
      expect(dr.kind).toBe('surface');
      expect(dr.wouldOpenSurface?.componentId).toBe('eob.preview-widget');
      expect(dr.wouldOpenSurface?.surfaceKind).toBe('drawer');
      expect(dr.wouldOpenSurface?.props).toEqual({ rowId: 'r1' });
    }
    expect(useSurfacesStore.getState().stack).toHaveLength(0);
  });

  it('navigate: returns DryRunResult with target, does not call router', async () => {
    signInWithPermissions();
    const push = vi.fn();
    setRouterAdapter({ push });
    defineAction({
      actionId: 'ar.open-detail',
      kind: 'navigate',
      request: z.object({ rowId: z.string() }),
      to: (a) => `/ar/${a.rowId}`,
    });

    const result = await dispatchAction('ar.open-detail', { rowId: 'r42' }, { dryRun: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dr = result.data as DryRunResult;
      expect(dr.kind).toBe('navigate');
      expect(dr.wouldNavigate).toBe('/ar/r42');
    }
    expect(push).not.toHaveBeenCalled();
  });

  it('still surfaces validation failures (does not bypass safety)', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({ pageIndex: z.number() }),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    const result = await dispatchAction('ar.list', { pageIndex: 'bad' }, { dryRun: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
    }
  });

  it('still enforces permissions (does not bypass safety)', async () => {
    signInWithPermissions([]);
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      permission: 'ar.read',
    });
    const result = await dispatchAction('ar.list', {}, { dryRun: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PLATFORM_FORBIDDEN');
    }
  });
});

// ---------------------------------------------------------------------------
// timeoutMs
// ---------------------------------------------------------------------------

describe('dispatchAction — timeoutMs', () => {
  it('returns PLATFORM_TIMEOUT when the request exceeds timeoutMs', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'claims.add-to-workflow',
      kind: 'mutation',
      endpoint: 'POST /api/v1/workflow/cases',
      request: z.object({ claimIds: z.array(z.string()) }),
      response: z.object({}),
      timeoutMs: 50, // very short, so the timeout fires before the slow fetch resolves
    });

    // Fetch that takes longer than the timeout to resolve, but respects the
    // AbortSignal — fetch must reject when its signal aborts.
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
          // Never resolves on its own; only rejects via the abort listener above.
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await dispatchAction('claims.add-to-workflow', { claimIds: ['c1'] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PLATFORM_TIMEOUT');
      expect(result.error.message).toContain('50');
    }
  });

  it('respects per-action timeout instead of the 30s default', async () => {
    // Indirect proof: a short timeout aborts a slow fetch quickly. If the
    // dispatcher ignored timeoutMs, the test would hang well past Vitest's
    // default test timeout.
    signInWithPermissions();
    defineAction({
      actionId: 'slow.action',
      kind: 'query',
      endpoint: 'GET /slow',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      timeoutMs: 30,
    });

    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const start = Date.now();
    const result = await dispatchAction('slow.action', {});
    const elapsed = Date.now() - start;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PLATFORM_TIMEOUT');
    }
    // Should be well under 1s — the 30ms timeout fired, not the default 30s.
    expect(elapsed).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// cacheKey override
// ---------------------------------------------------------------------------

describe('dispatchAction — cacheKey override', () => {
  it('uses the custom cache-key function instead of the default', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({
        pageIndex: z.number(),
        _localOnly: z.boolean().optional(),
      }),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      cache: { tag: 'ar-list' },
      // Strip _localOnly from the cache key so { pageIndex: 0 } and
      // { pageIndex: 0, _localOnly: true } share the same slot.
      cacheKey: (req) => `ar.list::pageIndex=${String(req.pageIndex)}`,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(envelope({ rows: [{ id: 'r1' }], totalCount: 1 })),
    });
    vi.stubGlobal('fetch', fetchMock);

    await dispatchAction('ar.list', { pageIndex: 0 });
    expect(readCacheValue('ar.list::pageIndex=0')).toBeDefined();

    // A request that differs only in _localOnly should hit the SAME cache slot.
    // (The default deterministic-stringify would create a different key.)
    const cached = readCacheValue('ar.list::pageIndex=0');
    await dispatchAction('ar.list', { pageIndex: 0, _localOnly: true });
    // Cache value at the same key is structurally unchanged (same data shape).
    // Note: we don't assert reference equality because the dispatcher may
    // legitimately refetch and produce a fresh deserialized object — the
    // contract is that the *key* is shared, not that the value is memoized.
    expect(readCacheValue('ar.list::pageIndex=0')).toEqual(cached);
  });
});
