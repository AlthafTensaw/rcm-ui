/**
 * SSN (Social Security Number) validator.
 *
 * Format: AAA-GG-SSSS where:
 *   - Area (first 3) ≠ 000, 666, 900-999
 *   - Group (middle 2) ≠ 00
 *   - Serial (last 4) ≠ 0000
 *
 * SSN is PHI. Components that handle SSN MUST wrap in <PrivacyField> and
 * MUST emit PHI_REVEALED audit events on unmask.
 */

import { z } from 'zod';

/** Strip dashes, spaces, and non-digits. Returns up to 9 digits. */
export function stripSsn(input: string): string {
  return input.replace(/\D/g, '').slice(0, 9);
}

/** Format 9 digits as XXX-XX-XXXX. Partial input is partially formatted. */
export function formatSsn(input: string): string {
  const digits = stripSsn(input);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
}

/** Mask all but last 4: "***-**-1234". */
export function maskSsn(input: string): string {
  const digits = stripSsn(input);
  if (digits.length < 4) return '***-**-****';
  return `***-**-${digits.slice(-4)}`;
}

export function isValidSsn(input: string): boolean {
  const digits = stripSsn(input);
  if (digits.length !== 9) return false;
  const area = digits.slice(0, 3);
  const group = digits.slice(3, 5);
  const serial = digits.slice(5, 9);

  if (area === '000' || area === '666') return false;
  const areaNum = Number(area);
  if (areaNum >= 900) return false;
  if (group === '00') return false;
  if (serial === '0000') return false;

  return true;
}

export const ssnSchema = z
  .string()
  .min(1, 'SSN is required')
  .transform((v) => formatSsn(v))
  .refine((v) => stripSsn(v).length === 9, 'SSN must be 9 digits')
  .refine(isValidSsn, 'SSN format is invalid');

export const ssnSchemaOptional = ssnSchema.optional().or(z.literal(''));
