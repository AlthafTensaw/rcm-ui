import { describe, expect, it } from 'vitest';
import { formatSsn, isValidSsn, maskSsn, ssnSchema, stripSsn } from './ssn';

describe('formatSsn', () => {
  it('inserts dashes progressively', () => {
    expect(formatSsn('1')).toBe('1');
    expect(formatSsn('123')).toBe('123');
    expect(formatSsn('1234')).toBe('123-4');
    expect(formatSsn('12345')).toBe('123-45');
    expect(formatSsn('123456789')).toBe('123-45-6789');
  });
  it('strips existing punctuation first', () => {
    expect(formatSsn('123-45-6789')).toBe('123-45-6789');
    expect(formatSsn('123 45 6789')).toBe('123-45-6789');
  });
});

describe('isValidSsn', () => {
  it('accepts a structurally valid SSN', () => {
    expect(isValidSsn('123-45-6789')).toBe(true);
    expect(isValidSsn('123456789')).toBe(true);
  });
  it('rejects 000 area', () => {
    expect(isValidSsn('000-12-3456')).toBe(false);
  });
  it('rejects 666 area', () => {
    expect(isValidSsn('666-12-3456')).toBe(false);
  });
  it('rejects 9XX area', () => {
    expect(isValidSsn('900-12-3456')).toBe(false);
    expect(isValidSsn('999-12-3456')).toBe(false);
  });
  it('rejects 00 group', () => {
    expect(isValidSsn('123-00-6789')).toBe(false);
  });
  it('rejects 0000 serial', () => {
    expect(isValidSsn('123-45-0000')).toBe(false);
  });
  it('rejects too few digits', () => {
    expect(isValidSsn('123-45-678')).toBe(false);
  });
});

describe('maskSsn', () => {
  it('preserves last 4', () => {
    expect(maskSsn('123-45-6789')).toBe('***-**-6789');
  });
  it('returns full mask for short input', () => {
    expect(maskSsn('123')).toBe('***-**-****');
  });
});

describe('stripSsn', () => {
  it('strips dashes', () => {
    expect(stripSsn('123-45-6789')).toBe('123456789');
  });
});

describe('ssnSchema', () => {
  it('accepts valid SSN', () => {
    expect(ssnSchema.parse('123-45-6789')).toBe('123-45-6789');
  });
  it('reformats unformatted input', () => {
    expect(ssnSchema.parse('123456789')).toBe('123-45-6789');
  });
  it('rejects 666 area', () => {
    expect(() => ssnSchema.parse('666-12-3456')).toThrow();
  });
});
