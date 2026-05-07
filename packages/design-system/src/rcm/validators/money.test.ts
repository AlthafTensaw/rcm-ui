import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  isValidMoney,
  moneySchema,
  nonNegativeMoneySchema,
  parseMoney,
  positiveMoneySchema,
} from './money';

describe('parseMoney', () => {
  it('parses plain numbers', () => {
    expect(parseMoney('100')).toBe(100);
    expect(parseMoney('100.50')).toBe(100.5);
  });
  it('parses with $ symbol', () => {
    expect(parseMoney('$100')).toBe(100);
    expect(parseMoney('$1,234.56')).toBe(1234.56);
  });
  it('parses negatives', () => {
    expect(parseMoney('-100')).toBe(-100);
    expect(parseMoney('-$164.86')).toBe(-164.86);
  });
  it('returns null for invalid', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('$')).toBeNull();
    expect(parseMoney('1.234.5')).toBeNull();
  });
  it('passes through numbers', () => {
    expect(parseMoney(123.45)).toBe(123.45);
    expect(parseMoney(-50)).toBe(-50);
  });
  it('rejects more than 2 decimals', () => {
    expect(parseMoney('100.123')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('formats positive with comma separator', () => {
    expect(formatMoney(1234.56)).toBe('$1,234.56');
    expect(formatMoney(1000000)).toBe('$1,000,000.00');
  });
  it('uses leading minus for negative', () => {
    expect(formatMoney(-164.86)).toBe('-$164.86');
    expect(formatMoney(-1234.56)).toBe('-$1,234.56');
  });
  it('always shows 2 decimals', () => {
    expect(formatMoney(100)).toBe('$100.00');
    expect(formatMoney(0)).toBe('$0.00');
  });
  it('omits symbol when requested', () => {
    expect(formatMoney(100, { showSymbol: false })).toBe('100.00');
    expect(formatMoney(-50, { showSymbol: false })).toBe('-50.00');
  });
  it('returns empty string for null/undefined', () => {
    expect(formatMoney(null)).toBe('');
    expect(formatMoney(undefined)).toBe('');
  });
});

describe('isValidMoney', () => {
  it('accepts valid money strings', () => {
    expect(isValidMoney('$100')).toBe(true);
    expect(isValidMoney('1,234.56')).toBe(true);
    expect(isValidMoney('-$164.86')).toBe(true);
  });
  it('rejects invalid strings', () => {
    expect(isValidMoney('abc')).toBe(false);
    expect(isValidMoney('')).toBe(false);
  });
});

describe('moneySchema', () => {
  it('parses string to number', () => {
    expect(moneySchema.parse('$100.50')).toBe(100.5);
    expect(moneySchema.parse('1,234.56')).toBe(1234.56);
  });
  it('passes through numbers', () => {
    expect(moneySchema.parse(50)).toBe(50);
  });
  it('rejects garbage', () => {
    expect(() => moneySchema.parse('not money')).toThrow();
  });
});

describe('positiveMoneySchema', () => {
  it('accepts positive', () => {
    expect(positiveMoneySchema.parse(50)).toBe(50);
  });
  it('rejects zero and negative', () => {
    expect(() => positiveMoneySchema.parse(0)).toThrow();
    expect(() => positiveMoneySchema.parse(-1)).toThrow();
  });
});

describe('nonNegativeMoneySchema', () => {
  it('accepts zero and positive', () => {
    expect(nonNegativeMoneySchema.parse(0)).toBe(0);
    expect(nonNegativeMoneySchema.parse(10)).toBe(10);
  });
  it('rejects negative', () => {
    expect(() => nonNegativeMoneySchema.parse(-1)).toThrow();
  });
});
