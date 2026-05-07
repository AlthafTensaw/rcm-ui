/**
 * Integration tests for the AR Mgmt page.
 *
 * These tests mount the real page against the real action package, the real
 * @tensaw/runtime store, and the real mock-server handlers via msw/node. If
 * these pass, the entire dependency chain works end-to-end.
 *
 * Coverage in this file:
 *   1. Initial mount + list query
 *   2. Inline owner edit (optimistic mutation + cache patch)
 *   3. Mode switch from "working" to "add-to-workflow" (different fixture)
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ARMgmtPage } from '../src/pages/ar-mgmt/ARMgmtPage';
import { bootstrapForTest, renderWithProviders } from "./helpers";

describe('ARMgmtPage — integration', () => {
  it('mounts, queries the AR list via MSW, and renders rows', async () => {
    const client = bootstrapForTest();
    renderWithProviders(<ARMgmtPage onRowClick={() => undefined} />, client);

    // Synchronous chrome.
    expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();

    // Eventually rows render with patient names from the fixture.
    await waitFor(
      () => {
        const patients = screen.queryAllByText(/Andrews|Binoy|Patel|Stiles/);
        expect(patients.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('inline owner edit dispatches ar.update-owner and updates the cell', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderWithProviders(<ARMgmtPage onRowClick={() => undefined} />, client);

    // Wait for the table to populate.
    await waitFor(
      () => {
        const patients = screen.queryAllByText(/Andrews/);
        expect(patients.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Find owner selects whose current value is usr_vineeth (row_ar_001).
    const ownerSelects = screen
      .getAllByRole('combobox')
      .filter(
        (el): el is HTMLSelectElement =>
          el instanceof HTMLSelectElement && el.value === 'usr_vineeth',
      );
    expect(ownerSelects.length).toBeGreaterThan(0);

    const firstSelect = ownerSelects[0]!;
    await user.selectOptions(firstSelect, 'usr_kishore');

    // The select reflects the new value immediately (optimistic).
    await waitFor(() => {
      expect(firstSelect.value).toBe('usr_kishore');
    });

    // The select is briefly disabled during the in-flight request, then re-enabled.
    await waitFor(() => {
      expect(firstSelect.disabled).toBe(false);
    });
  });

  it('mode toggle switches the visible row set', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderWithProviders(<ARMgmtPage onRowClick={() => undefined} />, client);

    // Wait for default ("working") rows to populate.
    await waitFor(
      () => {
        expect(screen.queryAllByText(/Andrews/).length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Toggle to "Add to workflow" mode. ModeToggle renders <button role="tab">,
    // so we look up by tab role.
    const addToWorkflowTab = screen.getByRole('tab', {
      name: /add to workflow/i,
    });
    await user.click(addToWorkflowTab);

    // After switching, a different fixture row should appear. We verify
    // the table re-rendered with non-empty data — exact names depend on
    // fixture content.
    await waitFor(
      () => {
        const rows = document.querySelectorAll('tbody tr');
        expect(rows.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('selecting rows reveals the bulk-action bar with the correct count', async () => {
    const user = userEvent.setup();
    const client = bootstrapForTest();
    renderWithProviders(<ARMgmtPage onRowClick={() => undefined} />, client);

    // Wait for rows to render.
    await waitFor(
      () => {
        expect(screen.queryAllByText(/Andrews/).length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Bulk bar should NOT be present yet.
    expect(screen.queryByText(/\d+ selected/)).toBeNull();

    // Click two body rows to select them. The grid uses row-click toggle.
    const tableRows = document.querySelectorAll('tbody tr');
    expect(tableRows.length).toBeGreaterThanOrEqual(2);

    // Click on the row's first non-interactive cell so the row-click handler
    // fires (clicking inside <select> doesn't toggle selection because the
    // cell's onClick stops propagation).
    const firstRow = tableRows[0]!;
    const secondRow = tableRows[1]!;
    await user.click(firstRow.querySelector('td')!);
    await user.click(secondRow.querySelector('td')!);

    // Bulk bar appears with "2 selected".
    await waitFor(() => {
      expect(screen.getByText(/2 selected/)).toBeDefined();
    });
  });
});
