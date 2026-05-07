/**
 * Regression test for Issue #1 (cache-key mismatch with `.default(...)`).
 *
 * Scenario: a request schema has `.default(...)` for one or more fields. The
 * caller invokes `useActionQuery(actionId, partialRequest)` omitting the
 * defaulted field.
 *
 * Pre-fix bug:
 *   - Hook subscribes to cache key derived from raw `{limit: 200}`
 *   - Dispatcher writes to cache key derived from validated
 *     `{limit: 200, offset: 0}` (Zod fills in the default)
 *   - Subscription never fires; component sees `data === undefined` forever
 *
 * Post-fix:
 *   - Hook pre-validates the request through `getAction(actionId).request`
 *   - Subscription, dispatch, and cache write all key off the validated shape
 *   - Component receives data after dispatch resolves
 *
 * This file asserts the post-fix behavior. It MUST fail against `useActionQuery`
 * before the fix is applied.
 */

import './dispatcher/testEnvSetup';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useAuthStore,
  resetAllStoresForTesting,
} from '@tensaw/runtime';

import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
} from './index';
import { useActionQuery } from './hooks';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

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
    meta: {
      correlationId: 'cor-test',
      timestamp: '2026-01-01T00:00:00Z',
    },
  };
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
// Issue #1 regression
// ---------------------------------------------------------------------------

describe('useActionQuery — cache-key parity with dispatcher when schema has .default()', () => {
  it('delivers data to the subscriber when caller omits a field with a Zod default', async () => {
    signInWithPermissions();

    // Schema with TWO defaults; caller will omit both.
    defineAction({
      actionId: 'admin.stuck-cases',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/stuck-cases',
      request: z.object({
        limit: z.number(),
        offset: z.number().default(0),
        sort: z.enum(['age_desc', 'age_asc']).default('age_desc'),
      }),
      response: z.object({
        items: z.array(z.object({ id: z.string() })),
        total: z.number(),
      }),
      cache: { tag: 'admin-stuck-cases' },
    });

    mockFetchOnce(envelope({ items: [{ id: 'c1' }, { id: 'c2' }], total: 2 }));

    // Caller passes ONLY `limit`. Both `offset` and `sort` come from defaults.
    const { result } = renderHook(() =>
      useActionQuery<{ items: { id: string }[]; total: number }>(
        'admin.stuck-cases',
        { limit: 200 },
      ),
    );

    await waitFor(
      () => {
        expect(result.current.data).toBeDefined();
      },
      { timeout: 2000 },
    );

    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isFetching).toBe(false);
  });

  it('still works when caller passes the full validated request (no defaults applied)', async () => {
    signInWithPermissions();

    defineAction({
      actionId: 'admin.stuck-cases',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/stuck-cases',
      request: z.object({
        limit: z.number(),
        offset: z.number().default(0),
        sort: z.enum(['age_desc', 'age_asc']).default('age_desc'),
      }),
      response: z.object({
        items: z.array(z.object({ id: z.string() })),
        total: z.number(),
      }),
      cache: { tag: 'admin-stuck-cases' },
    });

    mockFetchOnce(envelope({ items: [{ id: 'c1' }], total: 1 }));

    const { result } = renderHook(() =>
      useActionQuery<{ items: { id: string }[]; total: number }>(
        'admin.stuck-cases',
        { limit: 200, offset: 0, sort: 'age_desc' },
      ),
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.items).toHaveLength(1);
  });

  it('two callers passing equivalent partial vs full requests share one fetch', async () => {
    // Stronger evidence the keys are aligned: a partial request and a full
    // request that resolve to the same validated shape should hit the same
    // cache entry. After the fix, only ONE fetch fires.
    signInWithPermissions();

    defineAction({
      actionId: 'admin.stuck-cases',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/stuck-cases',
      request: z.object({
        limit: z.number(),
        offset: z.number().default(0),
      }),
      response: z.object({
        items: z.array(z.object({ id: z.string() })),
      }),
      cache: { tag: 'admin-stuck-cases' },
    });

    const fetchMock = mockFetchOnce(envelope({ items: [{ id: 'a' }] }));

    const { result: r1 } = renderHook(() =>
      useActionQuery<{ items: { id: string }[] }>(
        'admin.stuck-cases',
        { limit: 50 },
      ),
    );
    await waitFor(() => {
      expect(r1.current.data).toBeDefined();
    });

    // Second call with the explicit `offset: 0` (matching the default).
    // Should hit the cache, not refetch.
    const { result: r2 } = renderHook(() =>
      useActionQuery<{ items: { id: string }[] }>(
        'admin.stuck-cases',
        { limit: 50, offset: 0 },
      ),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(r2.current.data).toEqual(r1.current.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
