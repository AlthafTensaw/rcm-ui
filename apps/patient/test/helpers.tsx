/**
 * Shared helpers for integration tests.
 *
 * Two render entry points:
 *   - `renderWithProviders(ui, client)` — bare ProviderTree, used when
 *     mounting a single page (e.g. <ARMgmtPage onRowClick={...} />).
 *   - `renderApp(initialEntries, client)` — full route tree behind a memory
 *     router + AppThemeProvider, used when testing chrome / auth / nav.
 *
 * Bootstrap notes:
 *   - `bootstrapForTest()` signs the user in by default. Pass `skipSignIn: true`
 *     to test the sign-in flow itself or RequireAuth's redirect.
 *   - The shared `queryClient` singleton is intentionally reused so dispatcher
 *     writes and component reads see the same cache.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import {
  queryClient,
  resetAllStoresForTesting,
  useAuthStore,
} from '@tensaw/runtime';
import { _clearActionRegistry, _clearActionCache } from '@tensaw/actions';

import { registerARActions } from '../src/pages/ar-mgmt/actions';
import { AppThemeProvider } from '../src/AppTheme';
import { routeTable } from '../src/routes';

export interface BootstrapOptions {
  /** Permissions to grant the signed-in test user. */
  permissions?: readonly string[];
  /** Skip auto sign-in (useful for sign-in / RequireAuth tests). */
  skipSignIn?: boolean;
}

/**
 * Reset all stores, prime auth (unless skipped), register actions, and
 * return the shared `queryClient` singleton (with test-friendly defaults).
 */
export function bootstrapForTest(options: BootstrapOptions = {}): QueryClient {
  // Reset every Zustand store to its initial state.
  resetAllStoresForTesting();

  // Reset action registry and cache (the latter clears the shared queryClient).
  _clearActionRegistry();
  _clearActionCache();

  // Sign in a test user unless the test asked to skip.
  if (!options.skipSignIn) {
    useAuthStore.getState().signIn({
      user: {
        userId: 'u-test',
        username: 'tester',
        email: 'test@tensaw.local',
        fullName: 'Test User',
        roles: ['account_manager'],
        permissions: options.permissions ?? [
          'ar.read',
          'ar.write',
          'claims.workflow.assign',
        ],
        clinicIds: ['clinic-1'],
      },
      clinicId: 'clinic-1',
    });
  }

  // Register the AR action set (idempotent after the registry clear above).
  registerARActions();

  // Test-friendly defaults — fail fast on errors, never retry.
  queryClient.setDefaultOptions({
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  });

  return queryClient;
}

/**
 * Mount a UI element wrapped in a QueryClientProvider that uses the same
 * `queryClient` singleton the dispatcher reads from.
 */
export function renderWithProviders(ui: ReactElement, client: QueryClient) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/**
 * Mount the full app (route tree + AppThemeProvider) at the requested
 * memory-router entry. Use for any test that exercises chrome, navigation,
 * auth-gating, or sign-in.
 */
export function renderApp(initialEntries: string[], client: QueryClient) {
  const router = createMemoryRouter(routeTable, { initialEntries });
  return render(
    <QueryClientProvider client={client}>
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>
    </QueryClientProvider>,
  );
}
