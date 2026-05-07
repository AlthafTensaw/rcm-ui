/**
 * App-level integration tests.
 *
 * These tests mount the full route table behind `createMemoryRouter` so the
 * AppLayout chrome (TopNav + SideNav + AppShell), RequireAuth gate, and
 * auth-store wiring are all exercised end-to-end. Page contents are not
 * the focus — that's covered by `ar-mgmt.integration.test.tsx`.
 *
 * Coverage:
 *   1. RequireAuth redirects unauthenticated users to /sign-in?next=…
 *   2. Sign-in form rejects invalid email
 *   3. Sign-in form populates auth store and navigates to ?next=…
 *   4. AppLayout renders TopNav + SideNav + outlet content when authenticated
 *   5. SideNav AR Mgmt item is the active route at /ar
 *   6. SideNav Dashboard item is the active route at /dashboard
 *   7. User menu sign-out clears auth and routes to /sign-in
 *   8. User menu light/dark toggle flips the theme attribute
 *   9. AR detail route reads :rowId from URL and renders detail content
 *  10. Dashboard placeholder route renders empty state
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useAuthStore } from '@tensaw/runtime';

import { bootstrapForTest, renderApp } from './helpers';

describe('AppLayout — integration', () => {
  it('redirects unauthenticated users from /ar to /sign-in?next=/ar', async () => {
    const client = bootstrapForTest({ skipSignIn: true });
    renderApp(['/ar'], client);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to Tensaw/i)).toBeDefined();
    });

    // No AppLayout chrome should be visible — sign-in page is bare.
    expect(screen.queryByRole('navigation', { name: /side navigation/i })).toBeNull();
  });

  it('sign-in form shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ skipSignIn: true });
    renderApp(['/sign-in'], client);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeDefined();
    });
  });

  it('sign-in form populates auth store and navigates to /ar', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ skipSignIn: true });
    renderApp(['/sign-in?next=/ar'], client);

    await user.type(screen.getByLabelText(/email/i), 'tester@tensaw.local');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for navigation — AR Mgmt page header should appear.
    await waitFor(
      () => {
        expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();
      },
      { timeout: 5000 },
    );

    // Auth store has the synthetic user.
    expect(useAuthStore.getState().user?.email).toBe('tester@tensaw.local');
  });

  it('renders TopNav + SideNav + page content when authenticated', async () => {
    const client = bootstrapForTest();
    renderApp(['/ar'], client);

    // SideNav has its labeled groups. Use getAllByText since router/aria
    // wiring may surface the same label in multiple roles (group + aria).
    await waitFor(() => {
      expect(screen.getAllByText(/Workflow/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Reporting/i).length).toBeGreaterThan(0);
    });

    // Outlet content rendered.
    expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();
  });

  it('SideNav AR Mgmt item is active at /ar', async () => {
    const client = bootstrapForTest();
    renderApp(['/ar'], client);

    await waitFor(() => {
      const arItems = screen.getAllByRole('link', { name: /AR Mgmt/i });
      // At least one of them should carry an active marker (data-active or aria-current).
      const hasActive = arItems.some(
        (el) =>
          el.getAttribute('aria-current') === 'page' ||
          el.getAttribute('data-active') === 'true' ||
          el.classList.contains('bg-accent') ||
          el.className.includes('active'),
      );
      expect(hasActive).toBe(true);
    });
  });

  it('SideNav Dashboard item routes to /dashboard placeholder', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderApp(['/ar'], client);

    await waitFor(() => {
      expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();
    });

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    await user.click(dashboardLink);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard coming soon/i)).toBeDefined();
    });
  });

  it('sign-out from user menu clears auth and lands on /sign-in', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderApp(['/ar'], client);

    await waitFor(() => {
      expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();
    });

    // Open user menu (button labeled "User menu for <name>").
    const trigger = screen.getByRole('button', { name: /User menu for Test User/i });
    await user.click(trigger);

    const signOut = await screen.findByText(/Sign out/i);
    await user.click(signOut);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to Tensaw/i)).toBeDefined();
    });

    // Auth store is cleared.
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('user menu theme toggle flips data-theme on document root', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderApp(['/ar'], client);

    await waitFor(() => {
      expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();
    });

    // Read initial mode from document.
    const initialMode = document.documentElement.getAttribute('data-theme');
    expect(initialMode).toBe('light');

    const trigger = screen.getByRole('button', { name: /User menu for Test User/i });
    await user.click(trigger);

    const toggle = await screen.findByText(/Switch to dark mode/i);
    await user.click(toggle);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  it('AR detail route renders detail content for :rowId', async () => {
    const client = bootstrapForTest();
    renderApp(['/ar/row_ar_001'], client);

    await waitFor(
      () => {
        // Detail page renders Claim summary card title once the query resolves.
        expect(screen.getByText(/Claim summary/i)).toBeDefined();
      },
      { timeout: 5000 },
    );
  });

  it('Dashboard placeholder renders empty state', async () => {
    const client = bootstrapForTest();
    renderApp(['/dashboard'], client);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard coming soon/i)).toBeDefined();
      expect(
        screen.getByText(/Reporting visualizations land here/i),
      ).toBeDefined();
    });
  });
});
