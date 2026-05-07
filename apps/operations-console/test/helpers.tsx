/**
 * Shared helpers for Operations Console integration tests.
 *
 * Mirrors `apps/patient/test/helpers.tsx` with operations-console-
 * specific sign-in (role + permission resolution).
 *
 *   - `bootstrapForTest()` defaults to a signed-in
 *     RCM_OPS_SENIOR_REVIEWER user with cross-tenant clinic scope
 *   - Pass `role` to swap the role; permissions auto-resolve
 *   - Pass `clinicIds` to override the user's clinic scope
 *   - Pass `skipSignIn: true` to test the sign-in flow / RequireAuth gate
 *
 * The shared `queryClient` singleton is reused so dispatcher writes and
 * component reads see the same cache (per the patient-app pattern).
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

import { registerOperationsConsoleActions } from '../src/actions';
import { AppThemeProvider } from '../src/AppTheme';
import { routeTable } from '../src/routes';
import { type Role, resolvePermissions } from '../src/auth/permissions';

export interface BootstrapOptions {
  /** Skip auto sign-in (useful for sign-in / RequireAuth tests). */
  skipSignIn?: boolean;
  /** Role to sign in as. Default: RCM_OPS_SENIOR_REVIEWER (full read+write). */
  role?: Role;
  /** Clinic IDs to grant. Default: empty (cross-clinic visibility). */
  clinicIds?: readonly string[];
  /** Override email; otherwise derived from role. */
  email?: string;
}

/**
 * Reset all stores, prime auth (unless skipped), register actions, and
 * return the shared `queryClient` singleton with test-friendly defaults.
 */
export function bootstrapForTest(options: BootstrapOptions = {}): QueryClient {
  // Reset every Zustand store to its initial state.
  resetAllStoresForTesting();

  // Reset action registry and cache (the latter clears the shared queryClient).
  _clearActionRegistry();
  _clearActionCache();

  // Sign in a test user unless the test asked to skip.
  if (!options.skipSignIn) {
    const role: Role = options.role ?? 'RCM_OPS_SENIOR_REVIEWER';
    const clinicIds = options.clinicIds ?? [];
    const email = options.email ?? `test-${role.toLowerCase()}@tensaw.local`;

    useAuthStore.getState().signIn({
      user: {
        userId: `u-test-${role.toLowerCase()}`,
        username: 'tester',
        email,
        fullName: `Test ${role}`,
        roles: [role],
        permissions: resolvePermissions([role]),
        clinicIds: [...clinicIds],
      },
      clinicId: clinicIds[0] ?? null,
    });
  }

  // Register the operations-console action set.
  registerOperationsConsoleActions();

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

/** Mount a UI element wrapped in a QueryClientProvider. */
export function renderWithProviders(ui: ReactElement, client: QueryClient) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/**
 * Mount the full app (route tree + AppThemeProvider) at the requested
 * memory-router entry.
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
