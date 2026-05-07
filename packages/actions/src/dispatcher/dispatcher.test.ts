import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  useAuthStore,
  useNotificationsStore,
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
} from '../index';
import { deriveCacheKey } from '../utils/cacheKey';

// Stub env vars before any module that loads runtime config evaluates.
import './testEnvSetup';

// ---------------------------------------------------------------------------
// Test harness — Zustand era
// ---------------------------------------------------------------------------

/**
 * Sign in a test user with the given permissions. Replaces the old
 * `makeStore()` factory; the dispatcher reads auth via `useAuthStore.getState()`
 * directly, so we just populate that store.
 */
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

function mockFetchOnce(response: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function mockFetchSequence(responses: { body: unknown; status?: number }[]) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
      status: r.status ?? 200,
      json: () => Promise.resolve(r.body),
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function envelope<T>(data: T) {
  return {
    success: true as const,
    data,
    meta: {
      correlationId: 'cor-1',
      timestamp: '2026-01-01T00:00:00Z',
    },
  };
}

function errorEnvelope(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
    meta: {
      correlationId: 'cor-1',
      timestamp: '2026-01-01T00:00:00Z',
    },
  };
}

// ---------------------------------------------------------------------------

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
// Query
// ---------------------------------------------------------------------------

describe('dispatchAction — query', () => {
  it('fetches, unwraps envelope, returns data, populates cache', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({ pageIndex: z.number() }),
      response: z.object({ rows: z.array(z.object({ id: z.string() })), totalCount: z.number() }),
      cache: { tag: 'ar-list' },
    });

    mockFetchOnce(envelope({ rows: [{ id: 'r1' }], totalCount: 1 }));

    const result = await dispatchAction('ar.list', { pageIndex: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ rows: [{ id: 'r1' }], totalCount: 1 });
    }

    // Cache populated under derived key.
    const key = deriveCacheKey('ar.list', { pageIndex: 0 });
    expect(readCacheValue(key)).toEqual({ rows: [{ id: 'r1' }], totalCount: 1 });
  });

  it('fails on validation error before any network call', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({ pageIndex: z.number() }),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    const fetchMock = mockFetchOnce(envelope({ rows: [], totalCount: 0 }));

    const result = await dispatchAction('ar.list', { pageIndex: 'bad' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the backend error from a non-success envelope', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    mockFetchOnce(errorEnvelope('NOT_AUTHORIZED', 'Insufficient role'), 403);

    const result = await dispatchAction('ar.list', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_AUTHORIZED');
      expect(result.error.message).toBe('Insufficient role');
    }
  });

  it('blocks on missing permission with PLATFORM_FORBIDDEN', async () => {
    signInWithPermissions([]);
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      permission: 'ar.read',
    });
    const fetchMock = mockFetchOnce(envelope({ rows: [], totalCount: 0 }));

    const result = await dispatchAction('ar.list', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PLATFORM_FORBIDDEN');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes permission check when user has the right permission', async () => {
    signInWithPermissions(['ar.read']);
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      permission: 'ar.read',
    });
    mockFetchOnce(envelope({ rows: [], totalCount: 0 }));
    const result = await dispatchAction('ar.list', {});
    expect(result.ok).toBe(true);
  });

  it('throws on unknown actionId (programmer error)', async () => {
    signInWithPermissions();
    await expect(dispatchAction('nope.no', {})).rejects.toThrow(/Unknown actionId/);
  });
});

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

describe('dispatchAction — mutation', () => {
  it('fires PATCH with body and substituted path params', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
      request: z.object({ rowId: z.string(), ownerId: z.string().nullable() }),
      response: z.object({ rowId: z.string(), ownerId: z.string().nullable() }),
    });
    const fetchMock = mockFetchOnce(envelope({ rowId: 'r1', ownerId: 'u9' }));

    const result = await dispatchAction('ar.update-owner', { rowId: 'r1', ownerId: 'u9' });
    expect(result.ok).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) throw new Error('fetch not called');
    const [url, init] = firstCall;
    expect(url).toMatch(/\/api\/v1\/ar\/r1\/owner$/);
    expect((init as { method: string }).method).toBe('PATCH');
    expect(JSON.parse((init as { body: string }).body)).toEqual({ ownerId: 'u9' });
  });

  it('applies optimistic update-row-field before the network response', async () => {
    signInWithPermissions();

    // Pre-seed the cache by dispatching the query first.
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({
        rows: z.array(z.object({ id: z.string(), ownerId: z.string().nullable() })),
        totalCount: z.number(),
      }),
      cache: { tag: 'ar-list' },
    });
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
      request: z.object({ rowId: z.string(), ownerId: z.string().nullable() }),
      response: z.object({ rowId: z.string(), ownerId: z.string().nullable() }),
      optimistic: {
        pattern: 'update-row-field',
        target: 'ar-list',
        rowIdFrom: (req) => (req as { rowId: string }).rowId,
        fields: (req) => ({ ownerId: (req as { ownerId: string | null }).ownerId }),
      },
      onSuccess: { toast: 'Owner updated' },
    });

    mockFetchSequence([
      { body: envelope({ rows: [{ id: 'r1', ownerId: null }, { id: 'r2', ownerId: null }], totalCount: 2 }) },
      { body: envelope({ rowId: 'r1', ownerId: 'u9' }) },
    ]);

    await dispatchAction('ar.list', {});
    const cacheKey = deriveCacheKey('ar.list', {});
    expect((readCacheValue(cacheKey)!).rows[0]?.ownerId).toBeNull();

    await dispatchAction('ar.update-owner', { rowId: 'r1', ownerId: 'u9' });
    expect((readCacheValue(cacheKey)!).rows[0]?.ownerId).toBe('u9');

    // Toast should have fired.
    const toasts = useNotificationsStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.severity).toBe('success');
    expect(toasts[0]?.title).toBe('Owner updated');
  });

  it('rolls back the optimistic update on network failure', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({
        rows: z.array(z.object({ id: z.string(), ownerId: z.string().nullable() })),
        totalCount: z.number(),
      }),
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
      onError: { toast: { kind: 'error-message' } },
    });

    mockFetchSequence([
      { body: envelope({ rows: [{ id: 'r1', ownerId: null }], totalCount: 1 }) },
      { body: errorEnvelope('CONFLICT', 'Row was modified by another user'), status: 409 },
    ]);

    await dispatchAction('ar.list', {});
    const cacheKey = deriveCacheKey('ar.list', {});

    const result = await dispatchAction('ar.update-owner', { rowId: 'r1', ownerId: 'u9' });
    expect(result.ok).toBe(false);

    // Cache rolled back to original.
    expect((readCacheValue(cacheKey)!).rows[0]?.ownerId).toBeNull();
  });

  it('invalidates listed cache tags on success', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar',
      request: z.object({}),
      response: z.object({
        rows: z.array(z.object({ id: z.string() })),
        totalCount: z.number(),
      }),
      cache: { tag: 'ar-list' },
    });
    defineAction({
      actionId: 'claims.add-to-workflow',
      kind: 'mutation',
      endpoint: 'POST /api/v1/workflow/cases',
      request: z.object({ claimIds: z.array(z.string()) }),
      response: z.object({}),
      invalidates: ['ar-list'],
    });

    mockFetchSequence([
      { body: envelope({ rows: [{ id: 'r1' }], totalCount: 1 }) },
      { body: envelope({}) },
    ]);

    await dispatchAction('ar.list', {});
    const result = await dispatchAction('claims.add-to-workflow', { claimIds: ['c1'] });
    expect(result.ok).toBe(true);
    // Invalidation marks the entry stale (refreshedAt = 0), keeping the value
    // for now but allowing isCacheFresh to return false on the next read.
  });
});

// ---------------------------------------------------------------------------
// Surface
// ---------------------------------------------------------------------------

describe('dispatchAction — surface', () => {
  it('dispatches openSurface with mapped props', async () => {
    signInWithPermissions();
    defineAction({
      actionId: 'ar.preview-eob',
      kind: 'surface',
      surfaceKind: 'drawer',
      componentId: 'eob.preview-widget',
      request: z.object({ rowId: z.string(), claimNumber: z.string() }),
      propsFromArgs: (a) => ({ rowId: a.rowId, claimNumber: a.claimNumber }),
    });

    const result = await dispatchAction('ar.preview-eob', { rowId: 'r1', claimNumber: 'cl42' });
    expect(result.ok).toBe(true);

    const stack = useSurfacesStore.getState().stack;
    expect(stack).toHaveLength(1);
    expect(stack[0]?.componentId).toBe('eob.preview-widget');
    expect(stack[0]?.kind).toBe('drawer');
    expect(stack[0]?.props).toEqual({ rowId: 'r1', claimNumber: 'cl42' });
  });
});

// ---------------------------------------------------------------------------
// Navigate
// ---------------------------------------------------------------------------

describe('dispatchAction — navigate', () => {
  it('calls the router adapter with computed target', async () => {
    signInWithPermissions();
    const push = vi.fn();
    setRouterAdapter({ push });
    defineAction({
      actionId: 'ar.open-detail',
      kind: 'navigate',
      request: z.object({ rowId: z.string() }),
      to: (a) => `/ar/${a.rowId}`,
    });
    await dispatchAction('ar.open-detail', { rowId: 'r42' });
    expect(push).toHaveBeenCalledWith('/ar/r42');
  });

  it('returns NAVIGATE_NO_ADAPTER when adapter is missing', async () => {
    signInWithPermissions();
    setRouterAdapter(null);
    defineAction({
      actionId: 'ar.open-detail',
      kind: 'navigate',
      request: z.object({ rowId: z.string() }),
      to: (a) => `/ar/${a.rowId}`,
    });
    const result = await dispatchAction('ar.open-detail', { rowId: 'r42' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NAVIGATE_NO_ADAPTER');
    }
  });
});
