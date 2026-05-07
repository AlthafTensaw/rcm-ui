import { describe, expect, it } from 'vitest';
import { einSchema, formatEin, isValidEin } from './ein';

describe('formatEin', () => {
  it('inserts dash after first 2', () => {
    expect(formatEin('12345')).toBe('12-345');
    expect(formatEin('873263971')).toBe('87-3263971');
  });
  it('handles already-formatted input', () => {
    expect(formatEin('87-3263971')).toBe('87-3263971');
  });
});

describe('isValidEin', () => {
  it('accepts a valid EIN', () => {
    expect(isValidEin('87-3263971')).toBe(true);
    expect(isValidEin('873263971')).toBe(true);
  });
  it('rejects invalid IRS prefixes', () => {
    expect(isValidEin('00-1234567')).toBe(false);
    expect(isValidEin('07-1234567')).toBe(false);
    expect(isValidEin('89-1234567')).toBe(false);
  });
  it('rejects wrong length', () => {
    expect(isValidEin('87-326397')).toBe(false);
    expect(isValidEin('87-32639712')).toBe(false);
  });
});

describe('einSchema', () => {
  it('accepts a valid EIN', () => {
    expect(einSchema.parse('87-3263971')).toBe('87-3263971');
  });
  it('reformats unformatted input', () => {
    expect(einSchema.parse('873263971')).toBe('87-3263971');
  });
  it('rejects an invalid prefix', () => {
    expect(() => einSchema.parse('00-1234567')).toThrow();
  });
});
