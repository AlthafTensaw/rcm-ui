/**
 * Standardized API envelope.
 *
 * Implements Phase 1.5 of the v3 plan. Every backend response is one of:
 *   - ApiSuccess<T> — { success: true, data, meta }
 *   - ApiError      — { success: false, error, meta }
 *
 * The shared transformResponse and transformErrorResponse helpers below let
 * RTK Query endpoints unwrap the envelope automatically and normalize errors
 * into a consistent ApiError shape regardless of HTTP status, network failure,
 * or backend error.
 *
 * No PHI may appear in error.message or error.details. The PHI scrubber runs
 * over every error before it reaches telemetry; see ../privacy/scrubber.
 */

import { z } from 'zod';

// -- Schemas (used at runtime to validate envelope shape in dev) -------------

const metaSchema = z.object({
  /** Server-generated correlation id; matches X-Correlation-Id header. */
  correlationId: z.string(),
  /** Server-generated request id. */
  requestId: z.string().optional(),
  /** Server timestamp in ISO-8601. */
  timestamp: z.string(),
  /** API version string. */
  apiVersion: z.string().optional(),
});

const apiErrorBodySchema = z.object({
  /** Stable, machine-readable code (e.g. "PATIENT_NOT_FOUND", "VALIDATION_FAILED"). */
  code: z.string(),
  /** Human-readable message. PHI must already be scrubbed by the backend. */
  message: z.string(),
  /** Optional structured detail; e.g. field-level validation errors. */
  details: z.unknown().optional(),
});

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: metaSchema,
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: apiErrorBodySchema,
  meta: metaSchema,
});

export type ApiMeta = z.infer<typeof metaSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Sentinel error codes the platform itself produces. Backend codes are arbitrary
 * strings; these are reserved for client-side normalization.
 */
export const PLATFORM_ERROR_CODES = {
  NETWORK_ERROR: 'PLATFORM_NETWORK_ERROR',
  TIMEOUT: 'PLATFORM_TIMEOUT',
  UNAUTHORIZED: 'PLATFORM_UNAUTHORIZED',
  FORBIDDEN: 'PLATFORM_FORBIDDEN',
  ENVELOPE_INVALID: 'PLATFORM_ENVELOPE_INVALID',
  UNKNOWN: 'PLATFORM_UNKNOWN_ERROR',
} as const;

export type PlatformErrorCode = (typeof PLATFORM_ERROR_CODES)[keyof typeof PLATFORM_ERROR_CODES];

// -- Transforms used by RTK Query endpoints ----------------------------------

/**
 * Default transformResponse. Unwraps the envelope and returns the raw data.
 * Used by every endpoint unless an endpoint explicitly opts out.
 *
 * If the response shape is invalid, throws — RTK Query will catch and the
 * error handler middleware (Phase 2) will surface it as a toast.
 *
 * The generic `T` is intentionally only in the return position — callers
 * supply the type explicitly so the unwrap is a single-cast convenience
 * helper. The lint rule for "single-use type parameter" is suppressed here
 * because removing T would force every caller to add their own cast.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function transformResponse<T>(response: unknown): T {
  if (!isApiSuccess(response)) {
    if (isApiError(response)) {
      // Backend returned an envelope-shaped error with HTTP 200 — unusual, but
      // some gateways do this. Convert to a thrown error RTK Query understands.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw response;
    }
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw {
      success: false,
      error: {
        code: PLATFORM_ERROR_CODES.ENVELOPE_INVALID,
        message: 'Response did not match the expected API envelope shape.',
      },
      meta: makeClientMeta(),
    } satisfies ApiError;
  }
  return response.data as T;
}

/**
 * Default transformErrorResponse. Normalizes whatever RTK Query hands us into
 * an ApiError so consumers always see the same shape.
 *
 * Inputs we have to handle:
 *   - FetchBaseQueryError with `{ status: number, data: <envelope or anything> }`
 *   - FetchBaseQueryError with `{ status: 'FETCH_ERROR' | 'TIMEOUT_ERROR' | 'PARSING_ERROR', error: string }`
 *   - SerializedError (something thrown inside transformResponse)
 */
export function transformErrorResponse(rawError: unknown): ApiError {
  // Already-shaped ApiError thrown from transformResponse.
  if (isApiError(rawError)) {
    return rawError;
  }

  // FetchBaseQueryError with HTTP status
  if (
    isObject(rawError) &&
    'status' in rawError &&
    typeof rawError.status === 'number' &&
    'data' in rawError
  ) {
    const { status, data } = rawError;

    // Backend returned a proper ApiError envelope.
    if (isApiError(data)) return data;

    // Common HTTP status normalizations.
    if (status === 401) {
      return {
        success: false,
        error: {
          code: PLATFORM_ERROR_CODES.UNAUTHORIZED,
          message: 'Your session has expired. Please sign in again.',
        },
        meta: makeClientMeta(),
      };
    }
    if (status === 403) {
      return {
        success: false,
        error: {
          code: PLATFORM_ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to perform this action.',
        },
        meta: makeClientMeta(),
      };
    }

    return {
      success: false,
      error: {
        code: `HTTP_${String(status)}`,
        message:
          isObject(data) && typeof data.message === 'string'
            ? data.message
            : 'Request failed.',
      },
      meta: makeClientMeta(),
    };
  }

  // Network / timeout / parsing
  if (isObject(rawError) && 'status' in rawError && typeof rawError.status === 'string') {
    const fetchStatus = rawError.status;
    if (fetchStatus === 'FETCH_ERROR') {
      return {
        success: false,
        error: {
          code: PLATFORM_ERROR_CODES.NETWORK_ERROR,
          message: 'Network error. Check your connection and try again.',
        },
        meta: makeClientMeta(),
      };
    }
    if (fetchStatus === 'TIMEOUT_ERROR') {
      return {
        success: false,
        error: {
          code: PLATFORM_ERROR_CODES.TIMEOUT,
          message: 'The request timed out. Please try again.',
        },
        meta: makeClientMeta(),
      };
    }
  }

  return {
    success: false,
    error: {
      code: PLATFORM_ERROR_CODES.UNKNOWN,
      message: 'Something went wrong. Please try again.',
    },
    meta: makeClientMeta(),
  };
}

// -- Type guards -------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isApiSuccess<T = unknown>(v: unknown): v is ApiSuccess<T> {
  return isObject(v) && v.success === true && 'data' in v && 'meta' in v;
}

export function isApiError(v: unknown): v is ApiError {
  return (
    isObject(v) &&
    v.success === false &&
    'error' in v &&
    isObject(v.error) &&
    typeof v.error.code === 'string' &&
    typeof v.error.message === 'string'
  );
}

// -- Helpers -----------------------------------------------------------------

function makeClientMeta(): ApiMeta {
  return {
    correlationId: `client-${cryptoRandomId()}`,
    timestamp: new Date().toISOString(),
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Non-crypto fallback for unusual environments. Correlation ids are not security-critical.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// -- Envelope builders (for MSW handlers, tests, and any caller that --------
//    needs to construct an envelope-shaped response by hand) ---------------

/**
 * Build an `ApiSuccess<T>` envelope around a data payload.
 *
 * Use this in MSW handlers, test fixtures, and any code that constructs a
 * platform response by hand. `authenticatedFetch` validates every backend
 * response against `apiSuccessSchema`/`apiErrorSchema` — returning a raw
 * data shape from a handler will produce a `PLATFORM_ENVELOPE_INVALID` error.
 *
 * Example (MSW handler):
 * ```ts
 * import { buildSuccessEnvelope } from '@tensaw/runtime';
 * import { http, HttpResponse } from 'msw';
 *
 * http.get('/api/v1/cases/:id', ({ params }) => {
 *   return HttpResponse.json(buildSuccessEnvelope({ id: params.id, ... }));
 * });
 * ```
 *
 * The returned object is a plain envelope — wrap with `HttpResponse.json(...)`
 * (or your equivalent) to produce a real HTTP response. Status code defaults
 * to 200; for non-2xx successes (rare) supply a `status` to your HTTP-response
 * constructor.
 */
export function buildSuccessEnvelope<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: makeServerLikeMeta(),
  };
}

/**
 * Build an `ApiError` envelope.
 *
 * The returned object is a plain envelope. To return it from an MSW handler
 * with a non-200 status, wrap it: `HttpResponse.json(buildErrorEnvelope(...),
 * { status: 404 })`.
 *
 * `details` is optional — include structured field-level information (e.g.
 * Zod validation issues) when relevant. PHI must already be scrubbed.
 */
export function buildErrorEnvelope(
  code: string,
  message: string,
  details?: unknown,
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    meta: makeServerLikeMeta(),
  };
}

/**
 * Server-shaped meta for builder helpers. Distinct from `makeClientMeta`,
 * which produces a `client-` prefixed correlation id; the builders simulate
 * a backend response so they emit a plain UUID. Includes `apiVersion` so the
 * shape matches what real backends return.
 */
function makeServerLikeMeta(): ApiMeta & { apiVersion: string } {
  return {
    correlationId: cryptoRandomId(),
    timestamp: new Date().toISOString(),
    apiVersion: 'v1',
  };
}
