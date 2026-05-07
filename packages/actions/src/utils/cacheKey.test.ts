import { describe, expect, it } from 'vitest';
import { deriveCacheKey, deterministicStringify } from './cacheKey';

describe('deterministicStringify', () => {
  it('produces stable output regardless of property order', () => {
    const a = deterministicStringify({ b: 2, a: 1, c: 3 });
    const b = deterministicStringify({ c: 3, a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it('treats undefined fields as absent', () => {
    expect(deterministicStringify({ a: 1, b: undefined })).toBe(
      deterministicStringify({ a: 1 }),
    );
  });

  it('treats null distinctly from undefined', () => {
    expect(deterministicStringify({ a: null })).not.toBe(
      deterministicStringify({}),
    );
  });

  it('handles nested objects with deterministic key order', () => {
    const a = deterministicStringify({ outer: { z: 1, a: 2 } });
    const b = deterministicStringify({ outer: { a: 2, z: 1 } });
    expect(a).toBe(b);
  });

  it('preserves array order', () => {
    expect(deterministicStringify([1, 2, 3])).not.toBe(
      deterministicStringify([3, 2, 1]),
    );
  });

  it('handles primitives', () => {
    expect(deterministicStringify(null)).toBe('null');
    expect(deterministicStringify(true)).toBe('true');
    expect(deterministicStringify(42)).toBe('42');
    expect(deterministicStringify('hi')).toBe('"hi"');
  });
});

describe('deriveCacheKey', () => {
  it('produces same key for equivalent requests', () => {
    const k1 = deriveCacheKey('ar.list', { pageIndex: 0, pageSize: 25 });
    const k2 = deriveCacheKey('ar.list', { pageSize: 25, pageIndex: 0 });
    expect(k1).toBe(k2);
  });

  it('produces different keys for different actions', () => {
    expect(deriveCacheKey('a', {})).not.toBe(deriveCacheKey('b', {}));
  });

  it('produces different keys for different requests', () => {
    expect(
      deriveCacheKey('ar.list', { pageIndex: 0 }),
    ).not.toBe(
      deriveCacheKey('ar.list', { pageIndex: 1 }),
    );
  });

  it('starts with the action id followed by ::', () => {
    expect(deriveCacheKey('ar.list', { x: 1 })).toMatch(/^ar\.list::/);
  });
});
