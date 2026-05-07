/**
 * @tensaw/runtime/api — public surface.
 *
 * After the Redux → Zustand + TanStack Query migration:
 *   - The standardized API envelope schemas (unchanged shape, exposed for
 *     dispatcher and callers that hand-roll requests).
 *   - `authenticatedFetch`: the JWT-injecting fetch wrapper.
 *   - `ApiError`: the thrown error class (replaces `transformErrorResponse`'s
 *     return shape as the throwable).
 *   - `queryClient` and `buildQueryClient`: the TanStack Query client.
 *   - `queryKeys`: the central query-key registry.
 *
 * Note: envelope.ts also exports a type literally named `ApiError` (the body
 * shape inside an error envelope). To avoid a name clash with the thrown class,
 * we re-export it as `ApiErrorBodyShape`.
 */
export {
  apiSuccessSchema,
  apiErrorSchema,
  PLATFORM_ERROR_CODES,
  transformResponse,
  transformErrorResponse,
  isApiSuccess,
  isApiError,
  buildSuccessEnvelope,
  buildErrorEnvelope,
  type ApiMeta,
  type ApiErrorBody,
  type ApiSuccess,
  type ApiError as ApiErrorBodyShape,
  type ApiResponse,
  type PlatformErrorCode,
} from './envelope';

export {
  authenticatedFetch,
  ApiError,
  type AuthenticatedFetchInit,
} from './authenticatedFetch';

export { queryClient, buildQueryClient } from './queryClient';

export {
  queryKeys,
  buildActionQueryKey,
  type ActionQueryKey,
} from './queryKeys';
