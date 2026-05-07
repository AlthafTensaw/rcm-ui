import { describe, expect, it } from 'vitest';
import {
  buildQueryString,
  parseEndpoint,
  resolveEndpoint,
} from './endpoint';

describe('parseEndpoint', () => {
  it('splits method and path', () => {
    expect(parseEndpoint('GET /api/v1/foo')).toEqual({
      method: 'GET',
      pathTemplate: '/api/v1/foo',
    });
    expect(parseEndpoint('POST /api/v1/foo/bar')).toEqual({
      method: 'POST',
      pathTemplate: '/api/v1/foo/bar',
    });
  });

  it('uppercases method', () => {
    expect(parseEndpoint('get /foo').method).toBe('GET');
  });

  it('throws on malformed input', () => {
    expect(() => parseEndpoint('GET')).toThrow();
    expect(() => parseEndpoint('')).toThrow();
    expect(() => parseEndpoint('  ')).toThrow();
  });
});

describe('resolveEndpoint', () => {
  it('substitutes a single path parameter', () => {
    const r = resolveEndpoint('PATCH /api/v1/ar/{rowId}/owner', {
      rowId: 'r123',
      ownerId: 'u9',
    });
    expect(r.method).toBe('PATCH');
    expect(r.path).toBe('/api/v1/ar/r123/owner');
    expect(r.remainder).toEqual({ ownerId: 'u9' });
  });

  it('substitutes multiple path parameters', () => {
    const r = resolveEndpoint('GET /api/v1/clinics/{clinicId}/claims/{claimId}', {
      clinicId: 'c1',
      claimId: 'cl42',
      include: 'notes',
    });
    expect(r.path).toBe('/api/v1/clinics/c1/claims/cl42');
    expect(r.remainder).toEqual({ include: 'notes' });
  });

  it('URL-encodes path parameter values', () => {
    const r = resolveEndpoint('GET /api/v1/x/{name}', { name: 'a/b c' });
    expect(r.path).toBe('/api/v1/x/a%2Fb%20c');
  });

  it('throws when a path param is missing from the request', () => {
    expect(() =>
      resolveEndpoint('PATCH /api/v1/ar/{rowId}', { ownerId: 'u9' }),
    ).toThrow(/path parameter "rowId"/);
  });

  it('throws when a path param is empty/null/undefined', () => {
    expect(() =>
      resolveEndpoint('PATCH /api/v1/ar/{rowId}', { rowId: '' }),
    ).toThrow(/null\/undefined\/empty/);
    expect(() =>
      resolveEndpoint('PATCH /api/v1/ar/{rowId}', { rowId: null }),
    ).toThrow();
  });

  it('returns request unchanged when no path params', () => {
    const r = resolveEndpoint('POST /api/v1/x', { a: 1, b: 2 });
    expect(r.path).toBe('/api/v1/x');
    expect(r.remainder).toEqual({ a: 1, b: 2 });
  });
});

describe('buildQueryString', () => {
  it('returns empty string for no params', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('serializes scalar values', () => {
    expect(buildQueryString({ a: 1, b: 'hi' })).toBe('?a=1&b=hi');
  });

  it('skips undefined and null', () => {
    expect(buildQueryString({ a: 1, b: undefined, c: null })).toBe('?a=1');
  });

  it('serializes arrays as repeated keys', () => {
    expect(buildQueryString({ statuses: ['A', 'B', 'C'] })).toBe(
      '?statuses=A&statuses=B&statuses=C',
    );
  });

  it('skips null array items', () => {
    expect(buildQueryString({ x: [1, null, 2] })).toBe('?x=1&x=2');
  });

  it('serializes nested objects as JSON strings', () => {
    const out = buildQueryString({ filter: { foo: 'bar' } });
    expect(out).toContain('filter=');
    expect(decodeURIComponent(out.split('=')[1] ?? '')).toBe('{"foo":"bar"}');
  });

  it('encodes special characters', () => {
    expect(buildQueryString({ q: 'hello world&foo' })).toBe(
      '?q=hello+world%26foo',
    );
  });
});
