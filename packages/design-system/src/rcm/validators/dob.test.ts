import { describe, expect, it } from 'vitest';
import {
  computeAge,
  dobSchema,
  formatAge,
  isValidDob,
  maskDob,
  parseDob,
} from './dob';

describe('parseDob', () => {
  it('parses MM/DD/YYYY', () => {
    const d = parseDob('05/15/1990');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(1990);
    expect(d?.getMonth()).toBe(4); // May = index 4
    expect(d?.getDate()).toBe(15);
  });
  it('returns null for malformed input', () => {
    expect(parseDob('not a date')).toBeNull();
    expect(parseDob('1990-05-15')).toBeNull(); // wrong format
  });
});

describe('isValidDob', () => {
  const now = new Date('2026-04-29');

  it('accepts a typical adult DOB', () => {
    expect(isValidDob('05/15/1990', now)).toBe(true);
  });
  it('accepts a same-day DOB (newborn)', () => {
    expect(isValidDob('04/29/2026', now)).toBe(true);
  });
  it('rejects a future date', () => {
    expect(isValidDob('05/15/2030', now)).toBe(false);
  });
  it('rejects a date more than 120 years ago', () => {
    expect(isValidDob('01/01/1800', now)).toBe(false);
  });
  it('rejects malformed input', () => {
    expect(isValidDob('invalid', now)).toBe(false);
  });
});

describe('computeAge', () => {
  it('returns years for adults', () => {
    const dob = new Date('1990-04-29');
    const now = new Date('2026-04-29');
    expect(computeAge(dob, now).display).toBe('36 yrs');
  });
  it('returns months for infants', () => {
    const dob = new Date('2026-01-29');
    const now = new Date('2026-04-29');
    expect(computeAge(dob, now).display).toBe('3 mo');
  });
  it('returns days for newborns', () => {
    const dob = new Date('2026-04-26');
    const now = new Date('2026-04-29');
    expect(computeAge(dob, now).display).toBe('3 days');
  });
  it('singular forms are correct', () => {
    expect(computeAge(new Date('2025-04-29'), new Date('2026-04-29')).display).toBe('1 yr');
    expect(computeAge(new Date('2026-04-28'), new Date('2026-04-29')).display).toBe('1 day');
  });
});

describe('formatAge', () => {
  it('returns empty string for invalid input', () => {
    expect(formatAge('not-a-date', new Date('2026-04-29'))).toBe('');
  });
});

describe('maskDob', () => {
  it('keeps year only', () => {
    expect(maskDob('05/15/1990')).toBe('**/**/1990');
  });
});

describe('dobSchema', () => {
  it('accepts a valid DOB', () => {
    expect(() => dobSchema.parse('05/15/1990')).not.toThrow();
  });
  it('rejects future', () => {
    const future = '12/31/2099';
    expect(() => dobSchema.parse(future)).toThrow();
  });
  it('rejects > 120 years ago', () => {
    expect(() => dobSchema.parse('01/01/1800')).toThrow();
  });
});
