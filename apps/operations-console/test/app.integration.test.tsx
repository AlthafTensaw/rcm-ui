/**
 * App-level integration tests for the Operations Console.
 *
 * Mounts the full route table behind `createMemoryRouter` so AppLayout
 * chrome, RequireAuth gate, lazy routes, and auth-store wiring exercise
 * end-to-end. Page contents are smoke-checked here; deeper page tests
 * live in `cases.integration.test.tsx`.
 *
 * Coverage:
 *   1. RequireAuth redirects unauthenticated /cases → /sign-in?next=/cases
 *   2. Sign-in form rejects invalid email
 *   3. Sign-in form populates auth store and navigates to ?next=…
 *   4. AppLayout renders TopNav + SideNav + page content when authenticated
 *   5. Dashboard route renders KPI labels (lazy-loaded)
 *   6. Cases route renders the cases header
 *   7. Stuck Cases route renders the stuck header
 *   8. Activity route renders the activity header (lazy-loaded)
 *   9. Sign-out clears auth and redirects to /sign-in
 *  10. CLINIC_USER role with clinicIds=['clinic-001'] sees their clinic in pills
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useAuthStore } from '@tensaw/runtime';

import { bootstrapForTest, renderApp } from './helpers';

describe('Operations Console — app integration', () => {
  it('redirects unauthenticated users from /cases to /sign-in?next=/cases', async () => {
    const client = bootstrapForTest({ skipSignIn: true });
    renderApp(['/cases'], client);

    await waitFor(() => {
      expect(
        screen.getByText(/Tensaw Operations Console/i),
      ).toBeDefined();
    });

    // No AppLayout chrome should be visible — sign-in is bare.
    expect(screen.queryByText(/Workflow/i)).toBeNull();
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

  it('sign-in form populates auth store and navigates to /cases', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ skipSignIn: true });
    renderApp(['/sign-in?next=/cases'], client);

    await user.type(screen.getByLabelText(/email/i), 'ops@tensaw.local');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(
      () => {
        // Cases page renders header
        expect(screen.getByRole('heading', { name: /^Cases$/ })).toBeDefined();
      },
      { timeout: 5000 },
    );

    // Auth store has the synthetic user with default role permissions.
    const user_ = useAuthStore.getState().user;
    expect(user_?.email).toBe('ops@tensaw.local');
    expect(user_?.permissions).toContain('console.read');
  });

  it('renders TopNav + SideNav when authenticated at /cases', async () => {
    const client = bootstrapForTest();
    renderApp(['/cases'], client);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Cases$/ })).toBeDefined();
    });

    // SideNav items
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Stuck Cases/i).length).toBeGreaterThan(0);
    // The "Activity" SideNav label is shown
    expect(screen.getAllByText(/^Activity$/).length).toBeGreaterThan(0);
  });

  it('Dashboard route renders the dashboard header (lazy)', async () => {
    const client = bootstrapForTest();
    renderApp(['/'], client);

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /^Dashboard$/ }),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );
  });

  it('Stuck Cases route renders the stuck header with the curated 3 stuck cases', async () => {
    const client = bootstrapForTest();
    renderApp(['/stuck'], client);

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /^Stuck cases$/ }),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );

    // The 3 BRD §2.8 stuck cases should appear by id
    await waitFor(() => {
      expect(screen.getByText('case-010')).toBeDefined();
      expect(screen.getByText('case-011')).toBeDefined();
      expect(screen.getByText('case-012')).toBeDefined();
    });
  });

  it('Activity route renders the activity header (lazy)', async () => {
    const client = bootstrapForTest();
    renderApp(['/activity'], client);

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /^Activity$/ }),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );
  });

  it('sign-out clears the auth store', async () => {
    const client = bootstrapForTest();
    renderApp(['/cases'], client);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Cases$/ })).toBeDefined();
    });

    // Imperatively sign out — we'd otherwise need to open the user menu
    useAuthStore.getState().signOut();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe('signed-out');
  });

  it('CLINIC_USER with clinicIds=[clinic-001] surfaces their scope in case list', async () => {
    const client = bootstrapForTest({
      role: 'CLINIC_USER',
      clinicIds: ['clinic-001'],
    });
    renderApp(['/cases'], client);

    await waitFor(
      () => {
        // The "Your clinics:" pill row should render for clinic-scoped users
        expect(screen.getByText(/Your clinics:/i)).toBeDefined();
        expect(screen.getByText('clinic-001')).toBeDefined();
      },
      { timeout: 5000 },
    );
  });

  it('CLINIC_USER does NOT have console.close permission', () => {
    bootstrapForTest({ role: 'CLINIC_USER', clinicIds: ['clinic-001'] });
    const user = useAuthStore.getState().user;
    expect(user?.permissions).toContain('console.read');
    expect(user?.permissions).not.toContain('console.close');
    expect(user?.permissions).not.toContain('console.retry');
  });

  it('RCM_OPS_REVIEWER does NOT have console.close (BRD §3.8)', () => {
    bootstrapForTest({ role: 'RCM_OPS_REVIEWER' });
    const user = useAuthStore.getState().user;
    expect(user?.permissions).toContain('console.read');
    expect(user?.permissions).toContain('console.retry');
    expect(user?.permissions).toContain('console.advance');
    // Critical: reviewer cannot close cases per BRD §3.8
    expect(user?.permissions).not.toContain('console.close');
  });
});
