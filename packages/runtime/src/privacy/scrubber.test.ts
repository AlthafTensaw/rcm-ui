import { describe, expect, it } from 'vitest';
import { scrubObject, scrubString } from './scrubber';

describe('scrubString', () => {
  it('redacts SSN with dashes', () => {
    expect(scrubString('SSN is 123-45-6789 for record')).toContain('[REDACTED]');
    expect(scrubString('SSN is 123-45-6789 for record')).not.toContain('123-45-6789');
  });

  it('redacts phone numbers', () => {
    expect(scrubString('Call (555) 123-4567')).toContain('[REDACTED]');
    expect(scrubString('Call 555-123-4567 today')).toContain('[REDACTED]');
  });

  it('redacts emails', () => {
    expect(scrubString('Contact john.doe@example.com please')).toContain('[REDACTED]');
    expect(scrubString('Contact john.doe@example.com please')).not.toContain('john.doe');
  });

  it('redacts MRN context', () => {
    expect(scrubString('MRN: 12345 for visit')).toContain('[REDACTED]');
  });

  it('passes through harmless strings', () => {
    expect(scrubString('Patient appointment scheduled successfully')).toBe(
      'Patient appointment scheduled successfully',
    );
  });

  it('redacts long card-like digit groups', () => {
    expect(scrubString('Card 4242 4242 4242 4242 was declined')).toContain('[REDACTED]');
  });
});

describe('scrubObject', () => {
  it('redacts well-known PHI keys regardless of value', () => {
    const out = scrubObject({
      ssn: '123-45-6789',
      patientName: 'Jane Doe',
      claimId: 'safe-id',
      amount: 100,
    });
    expect(out.ssn).toBe('[REDACTED]');
    expect(out.patientName).toBe('[REDACTED]');
    expect(out.claimId).toBe('safe-id');
    expect(out.amount).toBe(100);
  });

  it('walks nested structures', () => {
    const out = scrubObject({
      claim: { id: 'claim-1', patient: { ssn: '123-45-6789', firstName: 'Jane' } },
    });
    expect(out.claim.patient.ssn).toBe('[REDACTED]');
    expect(out.claim.patient.firstName).toBe('[REDACTED]');
    expect(out.claim.id).toBe('claim-1');
  });

  it('walks arrays', () => {
    const out = scrubObject([{ patientName: 'X' }, { patientName: 'Y' }]);
    expect(out[0]?.patientName).toBe('[REDACTED]');
    expect(out[1]?.patientName).toBe('[REDACTED]');
  });

  it('handles cyclic references safely', () => {
    const a: Record<string, unknown> = { name: 'A' };
    const b: Record<string, unknown> = { name: 'B', other: a };
    a.other = b;
    expect(() => scrubObject(a)).not.toThrow();
  });

  it('preserves correlationId and other allow-listed keys', () => {
    const out = scrubObject({
      correlationId: 'c-abc-123',
      requestId: 'r-xyz',
      eventName: 'PATIENT_SELECTED',
      ssn: '123-45-6789',
    });
    expect(out.correlationId).toBe('c-abc-123');
    expect(out.requestId).toBe('r-xyz');
    expect(out.eventName).toBe('PATIENT_SELECTED');
    expect(out.ssn).toBe('[REDACTED]');
  });
});
