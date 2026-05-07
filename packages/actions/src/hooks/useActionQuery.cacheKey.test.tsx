/**
 * Regression test for Issue #1 (cache key mismatch when request schema has
 * `.default(...)`).
 *
 * Symptom: a component calls `useActionQuery(actionId, { limit: 200 })` where
 * the action's request schema has `.default(0)` for the omitted `offset` field.
 * The dispatcher fires the request and writes data to the cache under the
 * key derived from the *validated* request `{limit: 200, offset: 0}`. The
 * hook subscribes to the cache key derived from the *raw* request
 * `{limit: 200}`. The keys diverge, the subscription never fires, and the
 * component renders forever with `data === undefined`.
 *
 * The fix is to pre-validate the request inside `useActionQuery` so the
 * subscription key matches what the dispatcher actually writes to.
 *
 * This test fails against the unfixed hook and passes after the fix.
 */
import './testEnvSetup';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import {
  queryClient,
  resetAllStoresForTesting,
  useAuthStore,
} from '@tensaw/runtime';

import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
  useActionQuery,
} from '../index';

// ---- Test harness ---------------------------------------------------------

function signIn(): void {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u1',
      username: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: [],
      permissions: [],
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
      correlationId: 'cor-1',
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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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

// ---- Test ----------------------------------------------------------------

describe('useActionQuery — cache key with .default() in schema', () => {
  it('delivers data to the component when the caller omits a defaulted field', async () => {
    signIn();

    // Action whose request schema has `.default(...)` for a field the
    // caller will omit. Mirrors the operations console's `admin.stuck-cases`
    // signature — `limit` required, `offset` defaults to 0.
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
        total: z.number(),
      }),
      cache: { tag: 'admin-stuck-cases' },
    });

    mockFetchOnce(envelope({ items: [{ id: 'case-1' }], total: 1 }));

    // Caller passes a partial request — `offset` omitted. The hook must
    // pre-validate (filling in `offset: 0`) before deriving the cache key
    // so it matches the dispatcher's key.
    const { result, unmount } = renderHook(
      () => useActionQuery('admin.stuck-cases', { limit: 200 }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.data).toEqual({
          items: [{ id: 'case-1' }],
          total: 1,
        });
      },
      { timeout: 2000 },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    unmount();
  });

  it('also works when the caller supplies the defaulted field explicitly', async () => {
    // Sanity check — the patient-app pattern (full request object) must not
    // regress. This test exists to catch the easy mistake of fixing the
    // partial-request case while breaking the full-request case.
    signIn();

    defineAction({
      actionId: 'admin.stuck-cases-full',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/stuck-cases',
      request: z.object({
        limit: z.number(),
        offset: z.number().default(0),
      }),
      response: z.object({
        items: z.array(z.object({ id: z.string() })),
      }),
      cache: { tag: 'admin-stuck-cases-full' },
    });

    mockFetchOnce(envelope({ items: [{ id: 'case-2' }] }));

    const { result, unmount } = renderHook(
      () => useActionQuery('admin.stuck-cases-full', { limit: 50, offset: 0 }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.data).toEqual({ items: [{ id: 'case-2' }] });
      },
      { timeout: 2000 },
    );
    unmount();
  });

  it('preserves the raw request when the schema has no defaults', async () => {
    // Sanity check — actions without `.default()` shouldn't change behavior.
    signIn();

    defineAction({
      actionId: 'admin.no-defaults',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/no-defaults',
      request: z.object({ id: z.string() }),
      response: z.object({ ok: z.literal(true) }),
      cache: { tag: 'admin-no-defaults' },
    });

    mockFetchOnce(envelope({ ok: true as const }));

    const { result, unmount } = renderHook(
      () => useActionQuery('admin.no-defaults', { id: 'x' }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.data).toEqual({ ok: true });
      },
      { timeout: 2000 },
    );
    unmount();
  });

  it('falls back to the raw request when validation fails', async () => {
    // If the caller passes something the schema rejects, the hook should
    // not crash. Behavior is: fall back to the raw request for cache-key
    // derivation; the dispatcher will surface the validation error normally.
    signIn();

    defineAction({
      actionId: 'admin.strict',
      kind: 'query',
      endpoint: 'GET /api/v1/admin/strict',
      request: z.object({ id: z.string() }),
      response: z.object({ ok: z.literal(true) }),
      cache: { tag: 'admin-strict' },
    });

    // Caller passes invalid request shape (id is wrong type). The dispatcher
    // returns a validation error. The hook reflects that as `error` set,
    // `data` undefined, no crash.
    const { result, unmount } = renderHook(
      () =>
        // Intentionally wrong shape — id should be string, we pass number
        // to test the validation-failure fallback path.
        // @ts-expect-error — wrong type intentional
        useActionQuery('admin.strict', { id: 42 }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 2000 },
    );

    expect(result.current.data).toBeUndefined();

    // Unmount before afterEach clears the registry — otherwise React 18's
    // post-cleanup effect cycle dispatches once more and hits "Unknown
    // actionId", surfacing as an unhandled rejection.
    unmount();
  });
});
