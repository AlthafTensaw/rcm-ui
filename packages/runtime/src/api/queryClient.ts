/**
 * Shared TanStack Query client.
 *
 * Replaces RTK Query's cache. Singleton — all queries and mutations across
 * the platform use this client.
 *
 * Global error policy (per §4.11 of the migration handoff):
 *   - Mutation errors push a toast automatically via `useNotificationsStore`.
 *   - Query errors do NOT auto-toast; queries surface their error state
 *     through `query.error` and the consumer decides. (Same as RTK Query
 *     behavior — list pages render an inline error, not a toast.)
 *
 * Per-call overrides go on the individual `useQuery`/`useMutation` call.
 */

import { QueryClient } from '@tanstack/react-query';
import { useNotificationsStore } from '../stores/notificationsStore';
import { ApiError } from './authenticatedFetch';

function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `t-${crypto.randomUUID()}`;
  }
  return `t-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** Build a fresh QueryClient. Apps can call this to make per-app instances; tests use it for isolation. */
export function buildQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60_000,
        // Surface errors via query.error rather than toasting.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // Default: any uncaught mutation error pushes an error toast.
        // Action-level success/error toast policy in `@tensaw/actions` runs
        // inside the mutation function and short-circuits this default by
        // catching its own errors. Queries reaching here are unhandled.
        onError: (err) => {
          useNotificationsStore.getState().pushToast({
            toastId: generateToastId(),
            severity: 'error',
            title: extractErrorMessage(err),
          });
        },
      },
    },
  });
}

/**
 * Singleton QueryClient. Wrap the app root in
 * `<QueryClientProvider client={queryClient}>`.
 */
export const queryClient = buildQueryClient();
