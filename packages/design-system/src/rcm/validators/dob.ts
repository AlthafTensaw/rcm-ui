/**
 * Date of birth validator.
 *
 * Rules:
 *   - Must be a valid calendar date.
 *   - Cannot be in the future.
 *   - Cannot be more than 120 years ago.
 *
 * Also exposes formatAge(dob) → "47 yrs", "6 mo", "3 days" for inline display
 * beside the field, matching the established UI pattern.
 *
 * Format: input/output is MM/DD/YYYY (US, locked). DateOfBirthField wraps in
 * <PrivacyField> by default — DOB is PHI.
 */

import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isValid,
  parse,
  subYears,
} from 'date-fns';
import { z } from 'zod';

const FORMAT = 'MM/dd/yyyy';

/** Parse MM/DD/YYYY into a Date or null if invalid. */
export function parseDob(input: string): Date | null {
  if (!input) return null;
  const parsed = parse(input, FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function formatDobInput(date: Date): string {
  // Hand-rolled to avoid date-fns format() and locale considerations.
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = String(date.getFullYear()).padStart(4, '0');
  return `${m}/${d}/${y}`;
}

export function isValidDob(input: string, now: Date = new Date()): boolean {
  const date = parseDob(input);
  if (!date) return false;
  if (isAfter(date, now)) return false; // future
  const min = subYears(now, 120);
  if (isAfter(min, date)) return false; // > 120 years ago
  return true;
}

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  /** Compact display string: "47 yrs", "6 mo", "3 days". */
  display: string;
}

export function computeAge(dob: Date, now: Date = new Date()): AgeBreakdown {
  const years = differenceInYears(now, dob);
  if (years >= 1) {
    return {
      years,
      months: differenceInMonths(now, dob),
      days: differenceInDays(now, dob),
      display: `${String(years)} ${years === 1 ? 'yr' : 'yrs'}`,
    };
  }
  const months = differenceInMonths(now, dob);
  if (months >= 1) {
    return {
      years: 0,
      months,
      days: differenceInDays(now, dob),
      display: `${String(months)} mo`,
    };
  }
  const days = differenceInDays(now, dob);
  return {
    years: 0,
    months: 0,
    days,
    display: `${String(days)} ${days === 1 ? 'day' : 'days'}`,
  };
}

/** Format an age beside a DOB field, given the raw input string. */
export function formatAge(dobInput: string, now: Date = new Date()): string {
  const date = parseDob(dobInput);
  if (!date || !isValidDob(dobInput, now)) return '';
  return computeAge(date, now).display;
}

/** Mask DOB display for PHI views: returns "**\/**\/1990" with year only. */
export function maskDob(dobInput: string): string {
  const date = parseDob(dobInput);
  if (!date) return '**/**/****';
  return `**/**/${String(date.getFullYear())}`;
}

export const dobSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine((v) => parseDob(v) !== null, 'Use format MM/DD/YYYY')
  .refine((v) => {
    const d = parseDob(v);
    return d !== null && !isAfter(d, new Date());
  }, 'Date of birth cannot be in the future')
  .refine((v) => {
    const d = parseDob(v);
    if (!d) return false;
    const min = subYears(new Date(), 120);
    return !isAfter(min, d);
  }, 'Date of birth cannot be more than 120 years ago');

export const dobSchemaOptional = dobSchema.optional().or(z.literal(''));
