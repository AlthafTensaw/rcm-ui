/**
 * EIN (Employer Identification Number) validator.
 *
 * Format: XX-XXXXXXX (9 digits). The first 2 digits encode the IRS office
 * that issued it. Several prefixes are not in use; we reject those.
 *
 * Reference: IRS Publication 1635 — "Employer Identification Number".
 */

import { z } from 'zod';

/**
 * IRS prefixes that are not currently issued. We reject these with a soft
 * "format is invalid" error rather than naming the IRS rule, since the list
 * shifts over time.
 */
const INVALID_PREFIXES = new Set([
  '00', '07', '08', '09', '17', '18', '19',
  '28', '29', '49', '69', '70', '78', '79', '89',
  '96', '97',
]);

export function stripEin(input: string): string {
  return input.replace(/\D/g, '').slice(0, 9);
}

export function formatEin(input: string): string {
  const digits = stripEin(input);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export function isValidEin(input: string): boolean {
  // Count raw digits — reject if not exactly 9. We don't use stripEin here
  // because that truncates to 9, which would silently accept 10+ digit input.
  const rawDigits = input.replace(/\D/g, '');
  if (rawDigits.length !== 9) return false;
  const prefix = rawDigits.slice(0, 2);
  if (INVALID_PREFIXES.has(prefix)) return false;
  return true;
}

export const einSchema = z
  .string()
  .min(1, 'Tax ID (EIN) is required')
  .transform((v) => formatEin(v))
  .refine((v) => stripEin(v).length === 9, 'EIN must be 9 digits')
  .refine(isValidEin, 'EIN prefix is not a valid IRS-issued prefix');

export const einSchemaOptional = einSchema.optional().or(z.literal(''));
