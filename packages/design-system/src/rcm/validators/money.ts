/**
 * USD money parser/formatter.
 *
 * Rules locked per the v3 plan, US-only / USD-only:
 *   - Up to 2 decimals.
 *   - Negative values allowed (overpayments, refunds, credit balance).
 *   - Negative display: leading minus (`-$164.86`), not parentheses.
 *   - Display includes thousands separator: `$1,234,567.89`.
 *   - Input accepts: `$`, commas, leading minus, decimal point. Rejects letters
 *     and other symbols.
 *
 * Internal value is always a number (not a string). The formatter handles
 * conversion to and from the display string.
 */

import { z } from 'zod';

const MONEY_REGEX = /^-?\$?\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$|^-?\$?\s*\d+(?:\.\d{1,2})?$/;

/**
 * Parse a money string into a number. Returns null on invalid input.
 * Empty string returns null (caller decides if that means 0 or undefined).
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  const trimmed = input.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '$') return null;

  const cleaned = trimmed.replace(/[$,\s]/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Format a number as USD with the locked convention.
 * Negative values render as `-$164.86`.
 */
export function formatMoney(value: number | null | undefined, opts?: { showSymbol?: boolean }): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const showSymbol = opts?.showSymbol ?? true;
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const fixed = absVal.toFixed(2);
  const [intPart, fracPart = '00'] = fixed.split('.');
  const withCommas = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = `${withCommas}.${fracPart}`;
  const symbol = showSymbol ? '$' : '';
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Format for plain display in tables (no symbol option). Negative renders red
 * is the renderer's job; this returns plain text.
 */
export function formatMoneyPlain(value: number | null | undefined): string {
  return formatMoney(value, { showSymbol: true });
}

/** Validate that a string parses to a valid money value. */
export function isValidMoney(input: string): boolean {
  if (input === '') return false;
  return parseMoney(input) !== null && MONEY_REGEX.test(input.trim());
}

/**
 * Zod schema producing a number (not a formatted string). Callers wire this
 * into RHF and store the numeric value; the renderer handles display.
 */
export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const parsed = parseMoney(v);
    if (parsed === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid USD amount',
      });
      return z.NEVER;
    }
    return parsed;
  });

export const moneySchemaOptional = moneySchema.optional();

/** Schema variant that requires a positive amount (charges, allowed). */
export const positiveMoneySchema = moneySchema.refine(
  (v) => v > 0,
  'Amount must be greater than zero',
);

/** Schema variant that requires a non-negative amount (deductibles, copays). */
export const nonNegativeMoneySchema = moneySchema.refine(
  (v) => v >= 0,
  'Amount cannot be negative',
);
