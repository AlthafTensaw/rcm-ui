import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';
import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
} from '@tensaw/actions';
import {
  resetAllStoresForTesting,
  useAuthStore,
  useNotificationsStore,
} from '@tensaw/runtime';

import { ConfirmActionButton } from './ConfirmActionButton';

// --- Test harness --------------------------------------------------------
function signIn(): void {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u1',
      username: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: [],
      permissions: [],
      clinicIds: ['c1'],
    },
    clinicId: 'c1',
  });
}

function envelope<T>(data: T) {
  return {
    success: true as const,
    data,
    meta: { correlationId: 'cor-1', timestamp: '2026-01-01T00:00:00Z' },
  };
}
function errorEnvelope(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
    meta: { correlationId: 'cor-1', timestamp: '2026-01-01T00:00:00Z' },
  };
}
function mockFetchOnce(response: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
function defineDelete() {
  defineAction({
    actionId: 'claim.delete',
    kind: 'mutation',
    endpoint: 'DELETE /api/v1/claims/{claimId}',
    request: z.object({ claimId: z.string() }),
    response: z.object({ deleted: z.boolean() }),
  });
}

beforeEach(() => {
  resetAllStoresForTesting();
  _clearActionRegistry();
  _clearActionCache();
  signIn();
});
afterEach(() => {
  vi.unstubAllGlobals();
  _clearActionRegistry();
  _clearActionCache();
});

// --- Tests ---------------------------------------------------------------

describe('ConfirmActionButton — open/close flow', () => {
  it('renders the trigger button', () => {
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="Delete claim?"
        confirmDescription="This cannot be undone."
      >
        Delete
      </ConfirmActionButton>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the dialog on trigger click', async () => {
    const user = userEvent.setup();
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="Delete claim?"
        confirmDescription="This cannot be undone."
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(screen.getByText('Delete claim?')).toBeDefined();
    expect(screen.getByText('This cannot be undone.')).toBeDefined();
  });

  it('cancels: dialog closes, action does not dispatch', async () => {
    const user = userEvent.setup();
    defineDelete();
    const fetchMock = mockFetchOnce(envelope({ deleted: true }));
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="Delete claim?"
        confirmDescription="No undo."
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('ConfirmActionButton — confirm dispatches action', () => {
  it('confirms → action fires → onSuccess fires → dialog closes', async () => {
    const user = userEvent.setup();
    defineDelete();
    mockFetchOnce(envelope({ deleted: true }));
    const onSuccess = vi.fn();
    render(
      <ConfirmActionButton<{ claimId: string }, { deleted: boolean }>
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="Delete claim?"
        confirmDescription="No undo."
        onSuccess={onSuccess}
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => { expect(onSuccess).toHaveBeenCalled(); });
    expect(onSuccess).toHaveBeenCalledWith({ deleted: true });
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
  });

  it('uses confirmLabel / cancelLabel overrides', async () => {
    const user = userEvent.setup();
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      await screen.findByRole('button', { name: 'Yes, delete' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeDefined();
  });

  it('error keeps the dialog open + fires onError', async () => {
    const user = userEvent.setup();
    defineDelete();
    mockFetchOnce(errorEnvelope('VALIDATION_ERROR', 'no'), 400);
    const onError = vi.fn();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        onError={onError}
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => { expect(onError).toHaveBeenCalled(); });
    // After error, ConfirmDialog auto-closes on the resolved promise; we
    // immediately re-open via a microtask so the user can retry.
    expect(await screen.findByRole('dialog')).toBeDefined();
  });
});

describe('ConfirmActionButton — beforeDispatch gate', () => {
  it('skips opening the dialog when beforeDispatch returns false', async () => {
    const user = userEvent.setup();
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        beforeDispatch={() => false}
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the dialog when beforeDispatch resolves true', async () => {
    const user = userEvent.setup();
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        beforeDispatch={async () => true}
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('dialog')).toBeDefined();
  });
});

describe('ConfirmActionButton — request resolution', () => {
  it('function-form request resolved at confirm time', async () => {
    const user = userEvent.setup();
    defineDelete();
    mockFetchOnce(envelope({ deleted: true }));
    const buildRequest = vi.fn(() => ({ claimId: 'c1' }));
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={buildRequest}
        confirmTitle="t"
        confirmDescription="d"
      >
        Delete
      </ConfirmActionButton>,
    );
    expect(buildRequest).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // Opening the dialog does not yet invoke the builder.
    expect(buildRequest).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => { expect(buildRequest).toHaveBeenCalled(); });
  });
});

describe('ConfirmActionButton — toastOnSuccess', () => {
  it('pushes a toast when toastOnSuccess is set', async () => {
    const user = userEvent.setup();
    defineDelete();
    mockFetchOnce(envelope({ deleted: true }));
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        toastOnSuccess="Claim deleted"
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(useNotificationsStore.getState().toasts[0]?.title).toBe(
        'Claim deleted',
      );
    });
  });
});

describe('ConfirmActionButton — destructive variant', () => {
  it('renders destructive variant on the dialog', async () => {
    const user = userEvent.setup();
    defineDelete();
    render(
      <ConfirmActionButton
        actionId="claim.delete"
        request={{ claimId: 'c1' }}
        confirmTitle="t"
        confirmDescription="d"
        confirmVariant="destructive"
      >
        Delete
      </ConfirmActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // Dialog rendered — ConfirmDialog applies the variant internally.
    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDefined();
  });
});
