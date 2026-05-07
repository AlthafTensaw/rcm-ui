/**
 * Authenticated fetch.
 *
 * Replaces `authenticatedBaseQuery` (RTK Query). Plain async function that
 * wraps `fetch` with:
 *   - JWT injection via the configured token provider
 *   - X-Correlation-Id, X-Request-Id, X-Clinic-Id, X-App-Id, X-Build-Version headers
 *   - 30s default timeout (override per call via `init.timeoutMs`)
 *   - 401 → refresh-and-retry once. If the second attempt also 401s,
 *     `useAuthStore.getState().expireSession()` is called and ApiError is
 *     thrown.
 *   - Envelope unwrap via the existing transformResponse/transformErrorResponse.
 *
 * Errors are thrown as `ApiError` so TanStack Query's mutation/query lifecycle
 * sees them. The dispatcher in `@tensaw/actions` catches them and returns
 * the standard `{ ok: false, error }` shape.
 */

import { config } from '../config';
import { getTokenProvider } from '../auth/tokenProvider';
import { useAuthStore } from '../stores/authStore';
import {
  apiErrorSchema,
  apiSuccessSchema,
  type ApiErrorBody,
} from './envelope';
import { z } from 'zod';

/** Thrown by authenticatedFetch on any non-OK response or network failure. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(
    code: string,
    status: number,
    message: string,
    details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface AuthenticatedFetchInit extends Omit<RequestInit, 'body'> {
  /** Per-request timeout. Default 30,000ms. */
  timeoutMs?: number;
  /** JSON body. Will be stringified. */
  body?: unknown;
  /** Optional response schema. When supplied, the unwrapped data is validated. */
  responseSchema?: z.ZodTypeAny;
}

const DEFAULT_TIMEOUT_MS = 30_000;

// One in-flight refresh at a time so multiple parallel 401s don't hammer Cognito.
let refreshPromise: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const newToken = await getTokenProvider().getAccessToken({
        forceRefresh: true,
      });
      return newToken !== null;
    } catch {
      return false;
    } finally {
      // Allow the next 401 to trigger a new refresh.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();
  return refreshPromise;
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `c-${crypto.randomUUID()}`;
  }
  return `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `r-${crypto.randomUUID()}`;
  }
  return `r-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

async function buildHeaders(
  extra?: HeadersInit,
): Promise<Headers> {
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('X-Correlation-Id', generateCorrelationId());
  headers.set('X-Request-Id', generateRequestId());
  headers.set('X-Build-Version', config.app.buildVersion);
  headers.set('X-App-Id', config.app.id);

  const token = await getTokenProvider().getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const clinicId = useAuthStore.getState().clinicId;
  if (clinicId !== null) {
    headers.set('X-Clinic-Id', String(clinicId));
  }

  return headers;
}

async function performFetch(
  path: string,
  init: AuthenticatedFetchInit,
): Promise<{ response: Response; timeoutMs: number }> {
  const headers = await buildHeaders(init.headers);
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => { controller.abort(); }, timeoutMs);

  try {
    const response = await fetch(`${config.api.baseUrl}${path}`, {
      ...init,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal ?? controller.signal,
    });
    return { response, timeoutMs };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Make an authenticated request. Returns the unwrapped `data` field of the
 * envelope on success. Throws `ApiError` on any non-success response.
 *
 * 401 handling: one refresh-and-retry, then `expireSession()` is called and
 * the error is thrown.
 */
export async function authenticatedFetch<T = unknown>(
  path: string,
  init: AuthenticatedFetchInit = {},
): Promise<T> {
  let response: Response;
  let timeoutMs: number;
  try {
    const result = await performFetch(path, init);
    response = result.response;
    timeoutMs = result.timeoutMs;
  } catch (e) {
    const aborted =
      e instanceof Error && (e.name === 'AbortError' || e.message.includes('aborted'));
    const requestedTimeout = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    throw new ApiError(
      aborted ? 'PLATFORM_TIMEOUT' : 'PLATFORM_NETWORK_ERROR',
      0,
      aborted
        ? `Request timed out after ${String(requestedTimeout)}ms`
        : e instanceof Error
          ? e.message
          : 'Network error',
    );
  }
  // timeoutMs is in scope for any future retry-error message.
  void timeoutMs;

  // 401 — refresh once, retry once.
  if (response.status === 401) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      try {
        const result = await performFetch(path, init);
        response = result.response;
      } catch (e) {
        throw new ApiError(
          'PLATFORM_NETWORK_ERROR',
          0,
          e instanceof Error ? e.message : 'Network error',
        );
      }
    }
    if (!refreshed || response.status === 401) {
      // Permanent auth failure.
      useAuthStore.getState().expireSession();
      throw new ApiError('PLATFORM_UNAUTHORIZED', 401, 'Session expired');
    }
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      'PLATFORM_ENVELOPE_INVALID',
      response.status,
      'Response was not valid JSON',
    );
  }

  // Error envelope?
  const errorParse = apiErrorSchema.safeParse(body);
  if (errorParse.success) {
    const err: ApiErrorBody = errorParse.data.error;
    throw new ApiError(err.code, response.status, err.message, err.details);
  }

  // Validate success envelope shape, optionally with a data schema.
  const dataSchema = init.responseSchema ?? z.unknown();
  const successParse = apiSuccessSchema(dataSchema).safeParse(body);
  if (!successParse.success) {
    throw new ApiError(
      'PLATFORM_ENVELOPE_INVALID',
      response.status,
      'Response did not match expected envelope or schema',
      successParse.error.flatten(),
    );
  }

  return successParse.data.data as T;
}
