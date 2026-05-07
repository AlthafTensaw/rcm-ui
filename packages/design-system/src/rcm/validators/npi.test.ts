import { describe, expect, it } from 'vitest';
import { isValidNpi, luhnCheck, npiSchema, stripNpi } from './npi';

describe('luhnCheck', () => {
  it('accepts known Luhn-valid numbers', () => {
    expect(luhnCheck('4242424242424242')).toBe(true); // Stripe test card
    expect(luhnCheck('79927398713')).toBe(true); // Wikipedia example
  });
  it('rejects Luhn-invalid numbers', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
    expect(luhnCheck('1234567890')).toBe(false);
  });
  it('rejects non-digit input', () => {
    expect(luhnCheck('abcd')).toBe(false);
    expect(luhnCheck('123 456')).toBe(false);
  });
});

describe('isValidNpi', () => {
  it('accepts the canonical test NPI', () => {
    expect(isValidNpi('1234567893')).toBe(true);
  });
  it('accepts other valid NPIs', () => {
    // Generated using the same algorithm
    expect(isValidNpi('1003000126')).toBe(true);
  });
  it('rejects wrong length', () => {
    expect(isValidNpi('123456789')).toBe(false);
    expect(isValidNpi('12345678901')).toBe(false);
  });
  it('rejects all-zero', () => {
    expect(isValidNpi('0000000000')).toBe(false);
  });
  it('rejects all-same digits', () => {
    expect(isValidNpi('1111111111')).toBe(false);
    expect(isValidNpi('9999999999')).toBe(false);
  });
  it('rejects non-digits', () => {
    expect(isValidNpi('123-456-789')).toBe(false);
    expect(isValidNpi('123456789a')).toBe(false);
  });
  it('rejects checksum failures', () => {
    // 1234567893 is valid; flipping the last digit breaks it.
    expect(isValidNpi('1234567894')).toBe(false);
  });
});

describe('stripNpi', () => {
  it('strips non-digits', () => {
    expect(stripNpi('123-456-7893')).toBe('1234567893');
  });
  it('caps at 10 digits', () => {
    expect(stripNpi('12345678901234')).toBe('1234567890');
  });
});

describe('npiSchema', () => {
  it('accepts a valid NPI', () => {
    expect(npiSchema.parse('1234567893')).toBe('1234567893');
  });
  it('rejects empty', () => {
    expect(() => npiSchema.parse('')).toThrow();
  });
  it('rejects wrong length', () => {
    expect(() => npiSchema.parse('123456789')).toThrow();
  });
});
