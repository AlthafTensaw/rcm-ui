/**
 * Operations Console routes.
 *
 * Mirrors `apps/patient/src/routes.tsx`, with two adjustments per
 * kickoff §16.3 ("if bundle exceeds 400 KB gzipped, lazy-load
 * Dashboard and Activity Stream"):
 *
 *   - DashboardPage (pulls Recharts via @tensaw/visualization/charts
 *     for the BarChart, plus KpiCard for the 3 KPIs) is lazy-loaded
 *   - ActivityStreamPage is lazy-loaded
 *
 * The non-chart routes (Sign-in, Cases, Case Detail, Stuck) load
 * synchronously since they're the most-trafficked landing destinations.
 *
 * `routeTable` is exported separately from `<AppRouter>` (per design
 * system buildout deviation #41) so tests can mount via
 * `createMemoryRouter`. Test routes inline the lazy components to
 * avoid Suspense / async-route timing issues in vitest.
 */

import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  type RouteObject,
} from 'react-router-dom';

import { useAuthStore } from '@tensaw/runtime';

import { AppLayout } from './AppLayout';
import { SignInPage } from './pages/sign-in/SignInPage';
import { CaseListPage } from './pages/cases/CaseListPage';
import { CaseDetailPage } from './pages/case-detail/CaseDetailPage';
import { StuckCasesPage } from './pages/stuck/StuckCasesPage';

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const location = useLocation();
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <Outlet />;
}

export const routeTable: RouteObject[] = [
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { DashboardPage } = await import(
                './pages/dashboard/DashboardPage'
              );
              return { Component: DashboardPage };
            },
          },
          { path: 'cases', element: <CaseListPage /> },
          { path: 'cases/:caseId', element: <CaseDetailPage /> },
          { path: 'stuck', element: <StuckCasesPage /> },
          {
            path: 'activity',
            lazy: async () => {
              const { ActivityStreamPage } = await import(
                './pages/activity/ActivityStreamPage'
              );
              return { Component: ActivityStreamPage };
            },
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routeTable);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
