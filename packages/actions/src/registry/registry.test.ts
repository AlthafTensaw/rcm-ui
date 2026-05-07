import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  _clearActionRegistry,
  defineAction,
  getAction,
  getInvalidationsFor,
  hasAction,
  listActions,
} from './index';

beforeEach(() => {
  _clearActionRegistry();
});

afterEach(() => {
  _clearActionRegistry();
  vi.restoreAllMocks();
});

describe('defineAction — validation', () => {
  it('rejects malformed actionId', () => {
    expect(() =>
      defineAction({
        actionId: 'BadId',
        kind: 'navigate',
        request: z.object({}),
        to: () => '/',
      }),
    ).toThrow(/Invalid actionId/);
    expect(() =>
      defineAction({
        actionId: 'no-dot',
        kind: 'navigate',
        request: z.object({}),
        to: () => '/',
      }),
    ).toThrow();
    expect(() =>
      defineAction({
        actionId: 'two.dots.here',
        kind: 'navigate',
        request: z.object({}),
        to: () => '/',
      }),
    ).toThrow();
  });

  it('accepts valid actionIds', () => {
    expect(() =>
      defineAction({
        actionId: 'ar.list',
        kind: 'query',
        endpoint: 'GET /api/v1/ar',
        request: z.object({}),
        response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      }),
    ).not.toThrow();
    expect(() =>
      defineAction({
        actionId: 'claims.add-to-workflow',
        kind: 'mutation',
        endpoint: 'POST /api/v1/claims',
        request: z.object({}),
        response: z.object({}),
      }),
    ).not.toThrow();
  });

  it('rejects malformed endpoint', () => {
    expect(() =>
      defineAction({
        actionId: 'ar.list',
        kind: 'query',
        endpoint: 'GET',
        request: z.object({}),
        response: z.object({}),
      }),
    ).toThrow(/endpoint must be of form/);
  });

  it('rejects unsupported HTTP method', () => {
    expect(() =>
      defineAction({
        actionId: 'ar.list',
        kind: 'query',
        endpoint: 'TRACE /foo',
        request: z.object({}),
        response: z.object({}),
      }),
    ).toThrow(/unsupported HTTP method/);
  });

  it('requires componentId on surface actions', () => {
    expect(() =>
      defineAction({
        actionId: 'ar.preview',
        kind: 'surface',
        surfaceKind: 'drawer',
        // @ts-expect-error — testing runtime check
        componentId: '',
        request: z.object({}),
      }),
    ).toThrow(/must declare componentId/);
  });
});

describe('defineAction — collision', () => {
  it('warns and overwrites when same id registers a different declaration', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar/v1',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /api/v1/ar/v2',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('registered twice'));
    expect(getAction('ar.list')?.kind).toBe('query');
    if (getAction('ar.list')?.kind === 'query') {
      expect(
        (getAction('ar.list') as { endpoint: string }).endpoint,
      ).toBe('GET /api/v1/ar/v2');
    }
  });
});

describe('lookup', () => {
  it('hasAction / getAction', () => {
    expect(hasAction('ar.list')).toBe(false);
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /x',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    expect(hasAction('ar.list')).toBe(true);
    expect(getAction('ar.list')?.actionId).toBe('ar.list');
    expect(getAction('nonexistent')).toBeUndefined();
  });

  it('listActions returns all', () => {
    defineAction({
      actionId: 'a.x',
      kind: 'query',
      endpoint: 'GET /x',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
    });
    defineAction({
      actionId: 'b.y',
      kind: 'navigate',
      request: z.object({}),
      to: () => '/',
    });
    expect(listActions().map((a) => a.actionId).sort()).toEqual(['a.x', 'b.y']);
  });
});

describe('invalidation index', () => {
  it('builds from query.cache.invalidatedBy direction', () => {
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      cache: { tag: 'ar-list', invalidatedBy: ['ar.update-owner'] },
    });
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /ar/{rowId}/owner',
      request: z.object({ rowId: z.string() }),
      response: z.object({}),
    });
    expect(getInvalidationsFor('ar.update-owner')).toEqual(['ar-list']);
  });

  it('builds from mutation.invalidates direction', () => {
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /ar/{rowId}/owner',
      request: z.object({ rowId: z.string() }),
      response: z.object({}),
      invalidates: ['ar-list', 'ar-summary'],
    });
    expect(getInvalidationsFor('ar.update-owner').sort()).toEqual([
      'ar-list',
      'ar-summary',
    ]);
  });

  it('combines both directions without duplication', () => {
    defineAction({
      actionId: 'ar.list',
      kind: 'query',
      endpoint: 'GET /ar',
      request: z.object({}),
      response: z.object({ rows: z.array(z.unknown()), totalCount: z.number() }),
      cache: { tag: 'ar-list', invalidatedBy: ['ar.update-owner'] },
    });
    defineAction({
      actionId: 'ar.update-owner',
      kind: 'mutation',
      endpoint: 'PATCH /ar/{rowId}/owner',
      request: z.object({ rowId: z.string() }),
      response: z.object({}),
      invalidates: ['ar-list'], // duplicate of what query declared
    });
    expect(getInvalidationsFor('ar.update-owner')).toEqual(['ar-list']);
  });
});
