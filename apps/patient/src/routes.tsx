/**
 * Routes — top-level route table for the patient app.
 *
 * Layout:
 *   /sign-in            → public sign-in page (no AppLayout chrome)
 *   *                   → AppLayout shell, behind <RequireAuth>
 *     /                 → redirect to /ar
 *     /ar               → AR Mgmt list page
 *     /ar/:rowId        → AR detail page
 *     /dashboard        → placeholder dashboard
 *
 * `<RequireAuth>` checks the auth store and redirects unauthenticated
 * users to `/sign-in?next=<current-path>` so they return after signing in.
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
import { ARMgmtRoute } from './pages/ar-mgmt/ARMgmtRoute';
import { ARDetailRoute } from './pages/ar-detail/ARDetailRoute';
import { SignInPage } from './pages/sign-in/SignInPage';
import { DashboardPlaceholderPage } from './pages/dashboard/DashboardPlaceholderPage';

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
          { index: true, element: <Navigate to="/ar" replace /> },
          { path: 'ar', element: <ARMgmtRoute /> },
          { path: 'ar/:rowId', element: <ARDetailRoute /> },
          { path: 'dashboard', element: <DashboardPlaceholderPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routeTable);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
