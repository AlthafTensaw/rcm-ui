/**
 * AppLayout — top-level chrome for the Operations Console.
 *
 * Mirrors `apps/patient/src/AppLayout.tsx` with operations-console
 * navigation:
 *
 *   /            → Dashboard (LayoutDashboard)
 *   /cases       → Case List (ListChecks)
 *   /stuck       → Stuck Cases (AlertTriangle)
 *   /activity    → Activity Stream (Activity)
 *
 * Case Detail (`/cases/:caseId`) is reached by clicking a row in the
 * Case List; it doesn't appear as a top-level nav item.
 *
 * `<rightPanel>` is intentionally NOT rendered (deferred per design
 * system buildout deferred item #2; none of the Phase A screens need
 * a right panel).
 */
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

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

  // Wire the router adapter so dispatched `navigate` actions use
  // react-router. Mirrors the patient app pattern.
  useEffect(() => {
    setRouterAdapter({
      push: (target) => {
        navigate(target);
      },
    });
    return () => {
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
      logo={
        <span className="text-lg font-semibold tracking-tight">
          Tensaw Ops
        </span>
      }
      primaryNav={
        <>
          <TopNavItem to="/">Dashboard</TopNavItem>
          <TopNavItem to="/cases">Cases</TopNavItem>
        </>
      }
      utilityNav={userMenu}
    />
  );

  const sideNav = (
    <SideNav>
      <SideNavGroup label="Workflow">
        <SideNavItem to="/" icon={<LayoutDashboard size={16} />}>
          Dashboard
        </SideNavItem>
        <SideNavItem to="/cases" icon={<ListChecks size={16} />}>
          Cases
        </SideNavItem>
      </SideNavGroup>
      <SideNavGroup label="Operations">
        <SideNavItem to="/stuck" icon={<AlertTriangle size={16} />}>
          Stuck Cases
        </SideNavItem>
        <SideNavItem to="/activity" icon={<Activity size={16} />}>
          Activity
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
