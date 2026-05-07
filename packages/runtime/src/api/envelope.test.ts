import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  apiSuccessSchema,
  buildErrorEnvelope,
  buildSuccessEnvelope,
  isApiError,
  isApiSuccess,
  PLATFORM_ERROR_CODES,
  transformErrorResponse,
  transformResponse,
  type ApiError,
} from './envelope';
import { z } from 'zod';

describe('isApiSuccess / isApiError', () => {
  it('identifies a success envelope', () => {
    expect(
      isApiSuccess({
        success: true,
        data: { foo: 'bar' },
        meta: { correlationId: 'c-1', timestamp: 't' },
      }),
    ).toBe(true);
  });

  it('identifies an error envelope', () => {
    expect(
      isApiError({
        success: false,
        error: { code: 'X', message: 'boom' },
        meta: { correlationId: 'c-1', timestamp: 't' },
      }),
    ).toBe(true);
  });

  it('rejects malformed objects', () => {
    expect(isApiSuccess(null)).toBe(false);
    expect(isApiSuccess({ success: true })).toBe(false); // no data
    expect(isApiError({ success: false })).toBe(false); // no error
  });
});

describe('transformResponse', () => {
  it('unwraps a success envelope', () => {
    const result = transformResponse<{ id: number }>({
      success: true,
      data: { id: 42 },
      meta: { correlationId: 'c-1', timestamp: 't' },
    });
    expect(result).toEqual({ id: 42 });
  });

  it('throws an ApiError when the response is shaped as an error envelope', () => {
    const errorEnvelope = {
      success: false,
      error: { code: 'PATIENT_NOT_FOUND', message: 'No such patient' },
      meta: { correlationId: 'c-1', timestamp: 't' },
    };
    expect(() => transformResponse(errorEnvelope)).toThrow();
    try {
      transformResponse(errorEnvelope);
    } catch (e) {
      expect(isApiError(e)).toBe(true);
      expect((e as ApiError).error.code).toBe('PATIENT_NOT_FOUND');
    }
  });

  it('throws ENVELOPE_INVALID when the response is not envelope-shaped', () => {
    try {
      transformResponse({ random: 'shape' });
    } catch (e) {
      expect(isApiError(e)).toBe(true);
      expect((e as ApiError).error.code).toBe(PLATFORM_ERROR_CODES.ENVELOPE_INVALID);
    }
  });
});

describe('transformErrorResponse', () => {
  it('passes through an ApiError unchanged', () => {
    const apiError: ApiError = {
      success: false,
      error: { code: 'X', message: 'boom' },
      meta: { correlationId: 'c-1', timestamp: 't' },
    };
    expect(transformErrorResponse(apiError)).toEqual(apiError);
  });

  it('extracts ApiError from FetchBaseQueryError data', () => {
    const fetchError = {
      status: 404,
      data: {
        success: false,
        error: { code: 'PATIENT_NOT_FOUND', message: 'No such patient' },
        meta: { correlationId: 'c-1', timestamp: 't' },
      },
    };
    const result = transformErrorResponse(fetchError);
    expect(result.error.code).toBe('PATIENT_NOT_FOUND');
  });

  it('normalizes 401 to UNAUTHORIZED', () => {
    const result = transformErrorResponse({ status: 401, data: {} });
    expect(result.error.code).toBe(PLATFORM_ERROR_CODES.UNAUTHORIZED);
  });

  it('normalizes 403 to FORBIDDEN', () => {
    const result = transformErrorResponse({ status: 403, data: {} });
    expect(result.error.code).toBe(PLATFORM_ERROR_CODES.FORBIDDEN);
  });

  it('normalizes FETCH_ERROR to NETWORK_ERROR', () => {
    const result = transformErrorResponse({ status: 'FETCH_ERROR', error: 'failed' });
    expect(result.error.code).toBe(PLATFORM_ERROR_CODES.NETWORK_ERROR);
  });

  it('normalizes TIMEOUT_ERROR', () => {
    const result = transformErrorResponse({ status: 'TIMEOUT_ERROR', error: 'timeout' });
    expect(result.error.code).toBe(PLATFORM_ERROR_CODES.TIMEOUT);
  });

  it('falls back to UNKNOWN for unrecognized inputs', () => {
    const result = transformErrorResponse('a string');
    expect(result.error.code).toBe(PLATFORM_ERROR_CODES.UNKNOWN);
  });

  it('uses status-coded HTTP fallback when data is not envelope-shaped', () => {
    const result = transformErrorResponse({
      status: 500,
      data: { message: 'Internal server error' },
    });
    expect(result.error.code).toBe('HTTP_500');
    expect(result.error.message).toBe('Internal server error');
  });
});

// ---------------------------------------------------------------------------
// Builder helpers (Issue #2 — exported MSW envelope helpers)
// ---------------------------------------------------------------------------

describe('buildSuccessEnvelope', () => {
  it('produces an ApiSuccess envelope with the data attached', () => {
    const env = buildSuccessEnvelope({ id: 'p1', name: 'Patient' });
    expect(env.success).toBe(true);
    expect(env.data).toEqual({ id: 'p1', name: 'Patient' });
  });

  it('emits a meta block with correlationId, timestamp, and apiVersion', () => {
    const env = buildSuccessEnvelope({ value: 42 });
    expect(env.meta.correlationId).toMatch(/^[0-9a-f-]{8,}/i);
    expect(env.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // apiVersion is included for backend-shape parity even though the schema
    // marks it optional.
    expect((env.meta as { apiVersion?: string }).apiVersion).toBe('v1');
  });

  it('passes apiSuccessSchema validation against a matching data schema', () => {
    const env = buildSuccessEnvelope({ count: 7 });
    const schema = apiSuccessSchema(z.object({ count: z.number() }));
    expect(schema.safeParse(env).success).toBe(true);
  });

  it('round-trips through isApiSuccess', () => {
    const env = buildSuccessEnvelope([1, 2, 3]);
    expect(isApiSuccess(env)).toBe(true);
  });

  it('produces a fresh meta block on each call', () => {
    const a = buildSuccessEnvelope({ v: 1 });
    const b = buildSuccessEnvelope({ v: 2 });
    expect(a.meta.correlationId).not.toBe(b.meta.correlationId);
  });

  it('handles primitive payloads (number, string, boolean, null)', () => {
    expect(buildSuccessEnvelope(42).data).toBe(42);
    expect(buildSuccessEnvelope('hello').data).toBe('hello');
    expect(buildSuccessEnvelope(false).data).toBe(false);
    expect(buildSuccessEnvelope(null).data).toBe(null);
  });
});

describe('buildErrorEnvelope', () => {
  it('produces an ApiError envelope with the code and message attached', () => {
    const env = buildErrorEnvelope('CASE_NOT_FOUND', 'No such case.');
    expect(env.success).toBe(false);
    expect(env.error.code).toBe('CASE_NOT_FOUND');
    expect(env.error.message).toBe('No such case.');
  });

  it('omits details when not supplied', () => {
    const env = buildErrorEnvelope('X', 'msg');
    expect('details' in env.error).toBe(false);
  });

  it('attaches structured details when supplied', () => {
    const env = buildErrorEnvelope('VALIDATION_FAILED', 'Bad input', {
      fields: ['email'],
    });
    expect(env.error.details).toEqual({ fields: ['email'] });
  });

  it('passes apiErrorSchema validation', () => {
    const env = buildErrorEnvelope('CODE', 'msg', { hint: 'try again' });
    expect(apiErrorSchema.safeParse(env).success).toBe(true);
  });

  it('round-trips through isApiError', () => {
    const env = buildErrorEnvelope('CODE', 'msg');
    expect(isApiError(env)).toBe(true);
  });

  it('emits a meta block with correlationId, timestamp, and apiVersion', () => {
    const env = buildErrorEnvelope('CODE', 'msg');
    expect(env.meta.correlationId).toMatch(/^[0-9a-f-]{8,}/i);
    expect(env.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect((env.meta as { apiVersion?: string }).apiVersion).toBe('v1');
  });
});
