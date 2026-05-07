import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, phoneSchema, stripPhone } from './phone';

describe('formatPhone', () => {
  it('formats progressively', () => {
    expect(formatPhone('2')).toBe('(2');
    expect(formatPhone('212')).toBe('(212');
    expect(formatPhone('2125')).toBe('(212) 5');
    expect(formatPhone('2125551234')).toBe('(212) 555-1234');
  });
  it('handles already-formatted input', () => {
    expect(formatPhone('(212) 555-1234')).toBe('(212) 555-1234');
  });
});

describe('isValidPhone', () => {
  it('accepts valid US numbers', () => {
    expect(isValidPhone('(212) 555-1234')).toBe(true);
    expect(isValidPhone('2125551234')).toBe(true);
  });
  it('rejects area code starting with 0 or 1', () => {
    expect(isValidPhone('(012) 555-1234')).toBe(false);
    expect(isValidPhone('(112) 555-1234')).toBe(false);
  });
  it('rejects 911 area code', () => {
    expect(isValidPhone('(911) 555-1234')).toBe(false);
  });
  it('rejects exchange code starting with 0 or 1', () => {
    expect(isValidPhone('(212) 055-1234')).toBe(false);
    expect(isValidPhone('(212) 155-1234')).toBe(false);
  });
  it('rejects 555-01XX (fictional reserved)', () => {
    expect(isValidPhone('(212) 555-0123')).toBe(false);
  });
  it('accepts non-fictional 555 numbers', () => {
    expect(isValidPhone('(212) 555-2345')).toBe(true);
  });
  it('rejects wrong length', () => {
    expect(isValidPhone('(212) 555-123')).toBe(false);
    expect(isValidPhone('(212) 555-12345')).toBe(false);
  });
});

describe('stripPhone', () => {
  it('strips formatting', () => {
    expect(stripPhone('(212) 555-1234')).toBe('2125551234');
  });
});

describe('phoneSchema', () => {
  it('accepts valid input', () => {
    expect(phoneSchema.parse('(212) 555-1234')).toBe('(212) 555-1234');
  });
  it('reformats unformatted input', () => {
    expect(phoneSchema.parse('2125551234')).toBe('(212) 555-1234');
  });
  it('rejects 911', () => {
    expect(() => phoneSchema.parse('(911) 555-1234')).toThrow();
  });
});
