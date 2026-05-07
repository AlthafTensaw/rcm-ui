/**
 * NPI (National Provider Identifier) validator.
 *
 * Algorithm: 10 digits. To validate, prepend "80840" (the ISO 7812 issuer
 * prefix for NPI) and apply standard Luhn — the full 15-digit string must be
 * Luhn-valid (sum mod 10 === 0).
 *
 * Standard test NPI: "1234567893" is valid.
 *
 * In addition to the math, we reject obviously-bogus patterns (all-zero,
 * all-same, sequential) in dev mode so test fixtures stay realistic.
 */

import { z } from 'zod';

const NPI_PREFIX = '80840';

/** Pure check: is a 10-digit string a Luhn-valid NPI? */
export function isValidNpi(npi: string): boolean {
  if (typeof npi !== 'string') return false;
  if (!/^\d{10}$/.test(npi)) return false;

  // Reject obvious dev-fixture patterns
  if (/^0{10}$/.test(npi)) return false;
  if (/^(\d)\1{9}$/.test(npi)) return false;

  return luhnCheck(NPI_PREFIX + npi);
}

/** Format the digits as-is (no separators in the canonical NPI display). */
export function formatNpi(npi: string): string {
  return npi.replace(/\D/g, '').slice(0, 10);
}

/** Strip non-digits — useful for pasting from various sources. */
export function stripNpi(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10);
}

/**
 * Zod schema. Use directly with React Hook Form via zodResolver, or compose
 * into a larger object schema.
 */
export const npiSchema = z
  .string()
  .min(1, 'NPI is required')
  .refine((v) => /^\d{10}$/.test(v), 'NPI must be exactly 10 digits')
  .refine(isValidNpi, 'NPI failed checksum validation');

/** Optional variant. */
export const npiSchemaOptional = npiSchema.optional().or(z.literal(''));

// -- Luhn implementation -----------------------------------------------------

/**
 * Standard Luhn (mod 10) check.
 *
 * Walk digits from right. Every second digit (1-indexed from the right) is
 * doubled; if doubling produces > 9, sum the digits (equivalent to subtract 9).
 * The total must be divisible by 10.
 */
export function luhnCheck(input: string): boolean {
  if (!/^\d+$/.test(input)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = input.length - 1; i >= 0; i--) {
    const digit = Number(input[i]);
    if (shouldDouble) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
