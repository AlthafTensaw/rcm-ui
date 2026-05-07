import { describe, expect, it } from 'vitest';
import {
  formatDeltaMoney,
  formatDeltaPercent,
  formatInteger,
  formatIntegerCompact,
  formatMoneyCompact,
  formatMoneyUsd,
  formatMoneyUsdNoCents,
  formatPercent,
} from './formatters';

describe('formatMoneyUsd', () => {
  it('formats positive with cents', () => {
    expect(formatMoneyUsd(1234.56)).toBe('$1,234.56');
  });
  it('formats negative with leading minus (locked v3 convention)', () => {
    expect(formatMoneyUsd(-164.86)).toBe('-$164.86');
  });
  it('handles zero', () => {
    expect(formatMoneyUsd(0)).toBe('$0.00');
  });
  it('returns em-dash for null/undefined/NaN', () => {
    expect(formatMoneyUsd(null)).toBe('—');
    expect(formatMoneyUsd(undefined)).toBe('—');
    expect(formatMoneyUsd(NaN)).toBe('—');
  });
});

describe('formatMoneyCompact', () => {
  it('uses no-cents for under $1000', () => {
    expect(formatMoneyCompact(450)).toBe('$450');
  });
  it('uses K for thousands', () => {
    expect(formatMoneyCompact(392136)).toMatch(/\$392K/);
  });
  it('uses M for millions', () => {
    expect(formatMoneyCompact(1_200_000)).toMatch(/\$1\.2M/);
  });
  it('handles negatives', () => {
    expect(formatMoneyCompact(-50000)).toMatch(/-\$50K/);
  });
});

describe('formatPercent', () => {
  it('formats one decimal by default', () => {
    expect(formatPercent(14.2)).toBe('14.2%');
  });
  it('respects custom decimals', () => {
    expect(formatPercent(14.234, 2)).toBe('14.23%');
    expect(formatPercent(14.5, 0)).toBe('15%');
  });
  it('handles negatives', () => {
    expect(formatPercent(-3.5)).toBe('-3.5%');
  });
});

describe('formatDeltaPercent', () => {
  it('uses up arrow for positive', () => {
    expect(formatDeltaPercent(14.2)).toBe('↑14.2%');
  });
  it('uses down arrow for negative (no double-negative sign)', () => {
    expect(formatDeltaPercent(-11.0)).toBe('↓11.0%');
  });
  it('uses dot for zero', () => {
    expect(formatDeltaPercent(0)).toBe('·0.0%');
  });
});

describe('formatDeltaMoney', () => {
  it('formats positive', () => {
    expect(formatDeltaMoney(24851)).toBe('$24,851');
  });
  it('formats negative with leading minus', () => {
    expect(formatDeltaMoney(-7813)).toBe('-$7,813');
  });
});

describe('formatInteger', () => {
  it('adds thousands separators', () => {
    expect(formatInteger(1234567)).toBe('1,234,567');
  });
  it('rounds floats', () => {
    expect(formatInteger(1234.7)).toBe('1,235');
  });
  it('em-dash for null', () => {
    expect(formatInteger(null)).toBe('—');
  });
});

describe('formatIntegerCompact', () => {
  it('uses comma separators under 1000', () => {
    expect(formatIntegerCompact(945)).toBe('945');
  });
  it('uses K for thousands', () => {
    expect(formatIntegerCompact(45000)).toBe('45K');
  });
});

describe('formatMoneyUsdNoCents', () => {
  it('formats without cents', () => {
    expect(formatMoneyUsdNoCents(1234.56)).toBe('$1,235');
  });
});
