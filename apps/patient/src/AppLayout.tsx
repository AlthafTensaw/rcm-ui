/**
 * AppLayout — top-level chrome wrapping all routed pages.
 *
 * Composes:
 *   - `<AppShell>` (design-system) — the grid: top + side + main + (optional) right panel
 *   - `<TopNav>`   — branding, primary nav, utility nav
 *   - `<SideNav>`  — section nav, auto-active via route prefix
 *   - `<Outlet />` — current route's page renders here
 *
 * Side responsibilities:
 *   - Wires `setRouterAdapter` so action-dispatched `navigate` actions use
 *     React Router instead of `window.location.assign`. Adapter installs on
 *     mount and detaches on unmount. Without this, actions that emit
 *     `navigate` would fall back to a full page reload.
 *
 * Auth surface:
 *   - The user menu reads from `useAuthStore`. Sign-out clears auth and
 *     navigates to `/sign-in`. Sign-in is handled by a separate route.
 *
 * Theming:
 *   - Light/dark toggle is exposed via the user-menu items, driven by
 *     `useAppTheme` (which holds the persisted mode).
 */
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, LogOut, Moon, Sun } from 'lucide-react';

import { setRouterAdapter } from '@tensaw/actions';
import { useAuthStore } from '@tensaw/runtime';
import {
  AppShell,
  SideNav,
  SideNavGroup,
  SideNavItem,
  TopNav,
  TopNavItem,
  TopNavUserMenu,
} from '@tensaw/design-system';

import { useAppTheme } from './AppTheme';

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { mode, toggleMode } = useAppTheme();

  // Wire router adapter so dispatched `navigate` actions use react-router.
  useEffect(() => {
    setRouterAdapter({
      push: (target) => {
        navigate(target);
      },
    });
    return () => {
      // Restore the no-op default on unmount so other React trees (e.g.
      // tests) don't accidentally inherit this adapter.
      setRouterAdapter({
        push: () => {
          /* noop */
        },
      });
    };
  }, [navigate]);

  const handleSignOut = () => {
    signOut();
    navigate('/sign-in');
  };

  const userMenu = user ? (
    <TopNavUserMenu
      user={{ name: user.fullName, email: user.email }}
      items={[
        {
          label: mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
          icon: mode === 'light' ? <Moon size={14} /> : <Sun size={14} />,
          onSelect: toggleMode,
        },
        {
          label: 'Sign out',
          icon: <LogOut size={14} />,
          variant: 'destructive',
          onSelect: handleSignOut,
        },
      ]}
    />
  ) : null;

  const topNav = (
    <TopNav
      logo={<span className="text-lg font-semibold tracking-tight">Tensaw</span>}
      primaryNav={<TopNavItem to="/ar">AR Mgmt</TopNavItem>}
      utilityNav={userMenu}
    />
  );

  const sideNav = (
    <SideNav>
      <SideNavGroup label="Workflow">
        <SideNavItem to="/ar" icon={<ListChecks size={16} />}>
          AR Mgmt
        </SideNavItem>
      </SideNavGroup>
      <SideNavGroup label="Reporting">
        <SideNavItem to="/dashboard" icon={<LayoutDashboard size={16} />}>
          Dashboard
        </SideNavItem>
      </SideNavGroup>
    </SideNav>
  );

  return (
    <AppShell topNav={topNav} sideNav={sideNav}>
      <Outlet />
    </AppShell>
  );
}
