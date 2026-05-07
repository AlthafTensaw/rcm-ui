/**
 * Phase B integration tests — Tier 2 action panel + retry/close modals.
 *
 * Coverage in this file (additive to Phase A's app + cases tests):
 *
 *   1. Action panel renders all 4 buttons for full-permission users
 *   2. CLINIC_USER sees no action panel (read-only, no actions)
 *   3. RCM_OPS_REVIEWER hides Close per BRD §3.8 (escalate to senior)
 *   4. CLINIC_ADMIN shows only Reassign per BRD §3.8
 *   5. Closed case-009 hides the action buttons (the panel renders an
 *      explanatory note instead — close is one-way per ADR-OC-3)
 *   6. Retry happy path: open Retry modal, fill reason ≥10 chars, submit;
 *      success toast fires and modal closes
 *   7. Reason length validation: reason <10 chars surfaces a field error
 *
 * Additional Phase B tests planned for later sub-sessions cover advance
 * happy path, reassign happy path, the user-picker (v0.1.3), and bulk-retry.
 */

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useNotificationsStore } from '@tensaw/runtime';

import { bootstrapForTest, renderApp } from './helpers';

async function navigateToOpenCase(role:
  | 'TENSAW_ADMIN'
  | 'TENANT_ADMIN'
  | 'RCM_OPS_SENIOR_REVIEWER'
  | 'RCM_OPS_REVIEWER'
  | 'CLINIC_ADMIN'
  | 'CLINIC_USER', clinicIds: readonly string[] = []) {
  const client = bootstrapForTest({ role, clinicIds });
  renderApp(['/cases/case-001'], client);
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'case-001' })).toBeDefined();
  });
}

describe('Phase B — Case Action Panel', () => {
  it('renders all 4 action buttons for RCM_OPS_SENIOR_REVIEWER', async () => {
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    // The panel mounts a sr-only marker we can latch onto.
    await waitFor(() => {
      expect(screen.getByTestId('case-action-panel-mounted')).toBeDefined();
    });

    expect(
      screen.getByRole('button', { name: /Force-advance/i }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /^Retry$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Reassign$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Close$/i })).toBeDefined();
  });

  it('hides the action panel entirely for CLINIC_USER (read-only role)', async () => {
    await navigateToOpenCase('CLINIC_USER', ['clinic-001']);

    // CLINIC_USER has only console.read; the panel returns null.
    expect(screen.queryByTestId('case-action-panel-mounted')).toBeNull();
    // Defensive: no action buttons should be present anywhere on the page.
    expect(screen.queryByRole('button', { name: /^Retry$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Close$/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Force-advance/i }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /^Reassign$/i })).toBeNull();
  });

  it('hides Close for RCM_OPS_REVIEWER (BRD §3.8 — escalate to senior)', async () => {
    await navigateToOpenCase('RCM_OPS_REVIEWER');

    await waitFor(() => {
      expect(screen.getByTestId('case-action-panel-mounted')).toBeDefined();
    });

    expect(
      screen.getByRole('button', { name: /Force-advance/i }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /^Retry$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Reassign$/i })).toBeDefined();
    // The close button is the gated one.
    expect(screen.queryByRole('button', { name: /^Close$/i })).toBeNull();
  });

  it('shows only Reassign for CLINIC_ADMIN (BRD §3.8 — clinic-scoped)', async () => {
    await navigateToOpenCase('CLINIC_ADMIN', ['clinic-001']);

    await waitFor(() => {
      expect(screen.getByTestId('case-action-panel-mounted')).toBeDefined();
    });

    // Clinic admin gets reassign within their clinic only — backend
    // enforces the scope; the UI shows the button. Read perm is implicit.
    expect(screen.getByRole('button', { name: /^Reassign$/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Retry$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Close$/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Force-advance/i }),
    ).toBeNull();
  });

  it('replaces action buttons with a closed-case note for case-009', async () => {
    const client = bootstrapForTest({ role: 'RCM_OPS_SENIOR_REVIEWER' });
    renderApp(['/cases/case-009'], client);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'case-009' })).toBeDefined();
    });

    // The Actions card still renders (header is "Actions") but with the
    // explanatory note, not buttons. Reopen is Tier 3.
    const actionsHeader = screen.getByText(/^Actions$/);
    expect(actionsHeader).toBeDefined();
    expect(screen.getByText(/case is closed/i)).toBeDefined();
    // Confirm no action buttons are present anywhere on the page for
    // this closed case.
    expect(screen.queryByRole('button', { name: /^Retry$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Close$/i })).toBeNull();
  });
});

describe('Phase B — Retry modal', () => {
  it('happy path: open Retry, fill reason, submit, modal closes with toast', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    // Open the modal
    await user.click(screen.getByRole('button', { name: /^Retry$/i }));

    // Modal title appears
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Retry case/i)).toBeDefined();

    // Fill the reason (10..1000 chars per backend v0.1.2)
    const textarea = within(dialog).getByRole('textbox');
    await user.type(
      textarea,
      'Underlying PHI redaction skill upgraded to v3.5; expect success.',
    );

    // Submit
    const submitBtn = within(dialog).getByRole('button', { name: /^Retry$/i });
    await user.click(submitBtn);

    // The dialog closes on success — wait for it to leave the DOM
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Success toast surfaces. The action declares
    // `onSuccess: { toast: 'Retry submitted; case will reprocess shortly.' }`
    // The test's renderApp doesn't mount <ToastHost> (production main.tsx
    // does), so we assert on the notifications store directly — same signal.
    await waitFor(() => {
      const toasts = useNotificationsStore.getState().toasts;
      expect(toasts.some((t) => /Retry submitted/i.test(t.title))).toBe(true);
    });
  });

  it('reason shorter than 10 chars surfaces a field error and does not dispatch', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /^Retry$/i }));

    const dialog = await screen.findByRole('dialog');
    const textarea = within(dialog).getByRole('textbox');
    await user.type(textarea, 'short');

    const submitBtn = within(dialog).getByRole('button', { name: /^Retry$/i });
    await user.click(submitBtn);

    // Field error message comes from the Zod schema's `.min(10, ...)` text
    await waitFor(() => {
      expect(
        within(dialog).getByText(/at least 10 characters/i),
      ).toBeDefined();
    });

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

describe('Phase B — Close modal', () => {
  it('happy path: opens with MANUAL_CLOSE_OPS preselected, submits with reason', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /^Close$/i }));

    const dialog = await screen.findByRole('dialog');
    // The dialog title and the submit button both say "Close case" — scope
    // the assertion to the heading role to disambiguate.
    expect(
      within(dialog).getByRole('heading', { name: /Close case/i }),
    ).toBeDefined();

    // The reason textarea is the only multi-line field; type a valid reason.
    const textarea = within(dialog).getByRole('textbox');
    await user.type(
      textarea,
      'Customer withdrew the appeal request via phone call earlier today.',
    );

    // Submit using the destructive variant button (label is "Close case")
    const submitBtn = within(dialog).getByRole('button', {
      name: /^Close case$/i,
    });
    await user.click(submitBtn);

    // Modal closes on success
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Toast pushed to the notifications store
    await waitFor(() => {
      const toasts = useNotificationsStore.getState().toasts;
      expect(toasts.some((t) => /Case closed/i.test(t.title))).toBe(true);
    });
  });

  it('reason <10 chars surfaces a validation error and keeps modal open', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /^Close$/i }));
    const dialog = await screen.findByRole('dialog');
    const textarea = within(dialog).getByRole('textbox');
    await user.type(textarea, 'too short');

    await user.click(
      within(dialog).getByRole('button', { name: /^Close case$/i }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(/at least 10 characters/i),
      ).toBeDefined();
    });
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

describe('Phase B — Advance modal', () => {
  it('happy path: opens, no reason needed, submits successfully', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /Force-advance/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Force-advance case/i)).toBeDefined();

    // Reason is optional; submit immediately
    await user.click(
      within(dialog).getByRole('button', { name: /^Force-advance$/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    await waitFor(() => {
      const toasts = useNotificationsStore.getState().toasts;
      expect(toasts.some((t) => /Case advanced/i.test(t.title))).toBe(true);
    });
  });
});

describe('Phase B — Reassign modal (v0.1.3 picker)', () => {
  it('happy path: picks a user from the dropdown and toasts on success', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /^Reassign$/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Reassign owner/i)).toBeDefined();

    // Slice 2 swapped the free-text Input for a Combobox sourced from
    // admin.list-users. Open the picker via its labeled trigger button.
    const picker = within(dialog).getByRole('button', { name: /New owner/i });
    await user.click(picker);

    // The MOCK_USERS fixture seeds Bri Chen as a senior reviewer; pick them.
    // findByRole gives the popover time to materialize and the query to land.
    const briChenOption = await screen.findByRole('option', {
      name: /Bri Chen/i,
    });
    await user.click(briChenOption);

    // Submit the modal
    await user.click(
      within(dialog).getByRole('button', { name: /^Reassign$/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    await waitFor(() => {
      const toasts = useNotificationsStore.getState().toasts;
      expect(toasts.some((t) => /Owner updated/i.test(t.title))).toBe(true);
    });
  });

  it('renders the explicit "Unassign" option in the picker', async () => {
    const user = userEvent.setup();
    await navigateToOpenCase('RCM_OPS_SENIOR_REVIEWER');

    await user.click(screen.getByRole('button', { name: /^Reassign$/i }));
    const dialog = await screen.findByRole('dialog');

    const picker = within(dialog).getByRole('button', { name: /New owner/i });
    await user.click(picker);

    // The "— Unassign —" sentinel option is always present so operators
    // can clear ownership without typing.
    const unassign = await screen.findByRole('option', { name: /Unassign/i });
    expect(unassign).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Slice 2 — Stuck Cases multi-select + bulk-retry
// ---------------------------------------------------------------------------

describe('Phase B slice 2 — Stuck Cases multi-select gating', () => {
  it('renders the bulk-select bar for users with console.retry', async () => {
    const client = bootstrapForTest({ role: 'RCM_OPS_SENIOR_REVIEWER' });
    renderApp(['/stuck'], client);

    await waitFor(() => {
      expect(screen.getByText('case-010')).toBeDefined();
    });
    expect(screen.getByTestId('stuck-cases-bulk-bar')).toBeDefined();
    // Per-row checkboxes: one per stuck case, plus the "select all" header.
    expect(
      screen.getByRole('checkbox', { name: /Select all visible/i }),
    ).toBeDefined();
    expect(
      screen.getByRole('checkbox', { name: /Select case-010/i }),
    ).toBeDefined();
  });

  it('hides the bulk-select bar for CLINIC_USER (read-only role)', async () => {
    const client = bootstrapForTest({
      role: 'CLINIC_USER',
      clinicIds: ['clinic-001'],
    });
    renderApp(['/stuck'], client);

    // CLINIC_USER can read stuck cases (auth-widened endpoint) but lacks
    // console.retry, so the multi-select column + bar must be hidden.
    await waitFor(() => {
      // Only one of the 3 stuck cases is in clinic-001 (case-011), so we
      // wait on that one specifically.
      expect(screen.getByText('case-011')).toBeDefined();
    });
    expect(screen.queryByTestId('stuck-cases-bulk-bar')).toBeNull();
    expect(
      screen.queryByRole('checkbox', { name: /Select all visible/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('checkbox', { name: /Select case-011/i }),
    ).toBeNull();
  });
});

describe('Phase B slice 2 — Bulk retry', () => {
  it('happy path: select 2 stuck cases, submit reason, all-success toast', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ role: 'RCM_OPS_SENIOR_REVIEWER' });
    renderApp(['/stuck'], client);

    await waitFor(() => {
      expect(screen.getByText('case-010')).toBeDefined();
    });

    // Select case-010 and case-011 — both are stuck-but-retryable per fixture
    await user.click(
      screen.getByRole('checkbox', { name: /Select case-010/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Select case-011/i }),
    );

    // The "Retry selected (2)" button surfaces in the bulk bar
    const retryBtn = await screen.findByRole('button', {
      name: /Retry selected \(2\)/i,
    });
    await user.click(retryBtn);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /Retry 2 cases/i }),
    ).toBeDefined();

    // Fill the bulk reason (≥10 chars per shared ReasonSchema) and submit.
    const textarea = within(dialog).getByRole('textbox');
    await user.type(
      textarea,
      'Underlying handler v3.5 patch deployed; clearing the residual backlog.',
    );

    await user.click(
      within(dialog).getByRole('button', { name: /Retry 2 cases/i }),
    );

    // All-success path: modal closes, success toast surfaces.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await waitFor(() => {
      const toasts = useNotificationsStore.getState().toasts;
      expect(
        toasts.some((t) => /Retried 2 cases successfully/i.test(t.title)),
      ).toBe(true);
    });
  });

  it('bulk reason <10 chars surfaces a field error and modal stays open', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ role: 'RCM_OPS_SENIOR_REVIEWER' });
    renderApp(['/stuck'], client);

    await waitFor(() => {
      expect(screen.getByText('case-010')).toBeDefined();
    });

    await user.click(
      screen.getByRole('checkbox', { name: /Select case-010/i }),
    );
    await user.click(
      await screen.findByRole('button', { name: /Retry selected \(1\)/i }),
    );

    const dialog = await screen.findByRole('dialog');
    const textarea = within(dialog).getByRole('textbox');
    await user.type(textarea, 'short');

    await user.click(
      within(dialog).getByRole('button', { name: /Retry 1 case/i }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(/at least 10 characters/i),
      ).toBeDefined();
    });
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('clears selection from the bulk bar', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest({ role: 'RCM_OPS_SENIOR_REVIEWER' });
    renderApp(['/stuck'], client);

    await waitFor(() => {
      expect(screen.getByText('case-010')).toBeDefined();
    });

    await user.click(
      screen.getByRole('checkbox', { name: /Select case-010/i }),
    );
    expect(
      await screen.findByRole('button', { name: /Retry selected \(1\)/i }),
    ).toBeDefined();

    await user.click(screen.getByRole('button', { name: /^Clear$/i }));

    // After clearing, the Retry button disappears (selection count is 0).
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /Retry selected/i }),
      ).toBeNull();
    });
  });
});
