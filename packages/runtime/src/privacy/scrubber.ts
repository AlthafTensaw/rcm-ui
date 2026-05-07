/**
 * PHI scrubber.
 *
 * Phase 2 of the v3 plan, HIPAA primitive. Strips obvious PHI patterns from
 * strings before they reach any external sink (logger, telemetry, error
 * tracking). This is defense in depth — code should already avoid putting PHI
 * in log lines, but the scrubber catches mistakes.
 *
 * Patterns scrubbed:
 *   - SSN: 9-digit with or without dashes (XXX-XX-XXXX or 9 contiguous digits in
 *     a context that suggests SSN)
 *   - Phone numbers: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXX.XXX.XXXX
 *   - Email addresses
 *   - Credit card numbers: 13–19 digit groupings
 *   - Dates of birth: explicit DOB:/Born: contexts
 *   - MRN: explicit MRN:/MRN # contexts
 *   - Member IDs: explicit Member ID:/Subscriber ID: contexts
 *
 * The scrubber is conservative — it preserves enough context that a developer
 * reading the scrubbed log can reproduce the issue, but never enough to
 * identify a patient.
 */

const REDACT = '[REDACTED]';

const PATTERNS: { name: string; regex: RegExp }[] = [
  // SSN with separators
  { name: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  // SSN without separators in identifiable context
  { name: 'ssn_unformatted', regex: /\b(?:SSN|Social\s*Security)[:\s#]*\d{9}\b/gi },
  // Phone numbers
  { name: 'phone_paren', regex: /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g },
  { name: 'phone_dash', regex: /\b\d{3}[-.]\d{3}[-.]\d{4}\b/g },
  // Email
  { name: 'email', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  // Credit card-ish digit groups (13-19 digits, possibly separated)
  { name: 'card', regex: /\b(?:\d[ -]?){12,18}\d\b/g },
  // MRN
  { name: 'mrn', regex: /\bMRN\s*[:#]?\s*[A-Za-z0-9-]+/gi },
  // Member / Subscriber ID
  { name: 'member', regex: /\b(?:Member|Subscriber)\s*ID\s*[:#]?\s*[A-Za-z0-9-]+/gi },
  // DOB
  { name: 'dob', regex: /\b(?:DOB|Date\s*of\s*Birth|Born)\s*[:#]?\s*[\d/.-]+/gi },
];

/**
 * Scrub PHI from a string. Returns a new string; safe to call repeatedly.
 *
 * For deeply nested objects, use `scrubObject` which walks the tree.
 */
export function scrubString(input: string): string {
  if (!input) return input;
  let output = input;
  for (const { regex } of PATTERNS) {
    output = output.replace(regex, REDACT);
  }
  return output;
}

/**
 * Recursively scrub PHI from any value. Strings are scrubbed; objects/arrays
 * are walked; primitives pass through. The returned value is structurally
 * identical to the input with strings replaced.
 *
 * Cycles are handled safely (cyclic references are returned as REDACT).
 */
export function scrubObject<T>(value: T, seen = new WeakSet()): T {
  if (typeof value === 'string') {
    return scrubString(value) as unknown as T;
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (seen.has(value)) {
    return REDACT as unknown as T;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v: unknown) => scrubObject(v, seen)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    // Allow-list for keys we definitely don't want to scrub (correlation ids, codes, etc.)
    if (
      k === 'correlationId' ||
      k === 'requestId' ||
      k === 'code' ||
      k === 'errorCode' ||
      k === 'eventName' ||
      k === 'category' ||
      k === 'timestamp' ||
      k === 'occurredAt'
    ) {
      out[k] = v;
      continue;
    }
    // Specific keys we always redact wholesale, even non-string values, because
    // the field name indicates PHI.
    if (
      k === 'ssn' ||
      k === 'mrn' ||
      k === 'memberId' ||
      k === 'subscriberId' ||
      k === 'dob' ||
      k === 'dateOfBirth' ||
      k === 'phone' ||
      k === 'phoneNumber' ||
      k === 'email' ||
      k === 'emailAddress' ||
      k === 'address' ||
      k === 'address1' ||
      k === 'address2' ||
      k === 'fullName' ||
      k === 'firstName' ||
      k === 'lastName' ||
      k === 'patientName' ||
      k === 'patientDisplayName' ||
      k === 'cardNumber' ||
      k === 'cvc' ||
      k === 'cardCvc'
    ) {
      out[k] = REDACT;
      continue;
    }
    out[k] = scrubObject(v, seen);
  }
  return out as unknown as T;
}
