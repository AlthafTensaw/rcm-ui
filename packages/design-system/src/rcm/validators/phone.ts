/**
 * US phone number validator.
 *
 * Rules per NANP:
 *   - 10 digits.
 *   - Area code: first digit 2-9 (not 0 or 1), full code not 911.
 *   - Exchange code (digits 4-6): first digit 2-9 (not 0 or 1).
 *   - Display: (XXX) XXX-XXXX. Optional extension supported via separate field.
 *
 * Note: 555-01XX is reserved for fictional use and is rejected; 555 outside
 * 01XX is accepted as it's now valid for some real services.
 */

import { z } from 'zod';

export function stripPhone(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10);
}

/** Format up to 10 digits as (XXX) XXX-XXXX. Partial input partially formatted. */
export function formatPhone(input: string): string {
  const d = stripPhone(input);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export function isValidPhone(input: string): boolean {
  // Reject input with too many digits before truncation. stripPhone caps at
  // 10 for formatting purposes, but for validation we want strict length.
  const rawDigits = input.replace(/\D/g, '');
  if (rawDigits.length !== 10) return false;

  const d = rawDigits;
  const area = d.slice(0, 3);
  const exchange = d.slice(3, 6);
  const subscriber = d.slice(6, 10);

  // Area code must start with 2-9
  if (!area[0] || Number(area[0]) < 2) return false;
  // 911 is not a valid area code
  if (area === '911') return false;
  // Exchange code must start with 2-9
  if (!exchange[0] || Number(exchange[0]) < 2) return false;
  // Fictional-use reservation: when the exchange (3-digit middle group) is
  // "555" and the subscriber line starts with "01", the number is reserved
  // for fictional/sample use and must be rejected.
  // Per NANP: e.g. (212) 555-0123 is reserved; (212) 555-2345 is not.
  if (exchange === '555' && subscriber.startsWith('01')) return false;
  // Subscriber digits — 4 of them, no other constraints
  if (subscriber.length !== 4) return false;

  return true;
}

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform((v) => formatPhone(v))
  .refine((v) => stripPhone(v).length === 10, 'Phone must be 10 digits')
  .refine(isValidPhone, 'Phone number is not a valid US number');

export const phoneSchemaOptional = phoneSchema.optional().or(z.literal(''));
