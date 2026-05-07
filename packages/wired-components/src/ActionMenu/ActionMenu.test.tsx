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
} from '@tensaw/runtime';

import { ActionMenu } from './ActionMenu';

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
function mockFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(envelope({ ok: true })),
    });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
function defineRetry(): void {
  defineAction({
    actionId: 'claim.retry',
    kind: 'mutation',
    endpoint: 'POST /api/v1/claims/{claimId}/retry',
    request: z.object({ claimId: z.string() }),
    response: z.object({ ok: z.boolean() }),
  });
}
function defineDelete(): void {
  defineAction({
    actionId: 'claim.delete',
    kind: 'mutation',
    endpoint: 'DELETE /api/v1/claims/{claimId}',
    request: z.object({ claimId: z.string() }),
    response: z.object({ ok: z.boolean() }),
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

describe('ActionMenu — render + open', () => {
  it('renders the trigger', () => {
    defineRetry();
    render(
      <ActionMenu
        trigger={<button>Open menu</button>}
        items={[
          { actionId: 'claim.retry', request: { claimId: 'c1' }, label: 'Retry' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
  });

  it('opens the menu on trigger click and shows items', async () => {
    const user = userEvent.setup();
    defineRetry();
    defineDelete();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          { actionId: 'claim.retry', request: { claimId: 'c1' }, label: 'Retry' },
          {
            actionId: 'claim.delete',
            request: { claimId: 'c1' },
            label: 'Delete',
            variant: 'destructive',
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('menuitem', { name: 'Retry' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDefined();
  });
});

describe('ActionMenu — selection dispatches', () => {
  it('selecting a non-confirm item dispatches immediately', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetch();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          { actionId: 'claim.retry', request: { claimId: 'c42' }, label: 'Retry' },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Retry' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });

  it('function-form request is invoked at dispatch time', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetch();
    const buildRequest = vi.fn(() => ({ claimId: 'c1' }));
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          { actionId: 'claim.retry', request: buildRequest, label: 'Retry' },
        ]}
      />,
    );
    expect(buildRequest).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Retry' }));
    await waitFor(() => { expect(buildRequest).toHaveBeenCalled(); });
  });
});

describe('ActionMenu — confirmBefore gate', () => {
  it('confirmBefore opens a dialog instead of dispatching immediately', async () => {
    const user = userEvent.setup();
    defineDelete();
    const fetchMock = mockFetch();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          {
            actionId: 'claim.delete',
            request: { claimId: 'c1' },
            label: 'Delete',
            variant: 'destructive',
            confirmBefore: {
              title: 'Delete claim?',
              description: 'No undo.',
            },
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(screen.getByText('Delete claim?')).toBeDefined();
    // No fetch yet.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirm in the dialog dispatches the action', async () => {
    const user = userEvent.setup();
    defineDelete();
    const fetchMock = mockFetch();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          {
            actionId: 'claim.delete',
            request: { claimId: 'c1' },
            label: 'Delete',
            confirmBefore: {
              title: 'Delete?',
              description: 'No undo.',
            },
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });

  it('cancel in the dialog skips dispatch', async () => {
    const user = userEvent.setup();
    defineDelete();
    const fetchMock = mockFetch();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          {
            actionId: 'claim.delete',
            request: { claimId: 'c1' },
            label: 'Delete',
            confirmBefore: {
              title: 'Delete?',
              description: 'No undo.',
            },
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await new Promise((r) => setTimeout(r, 30));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('ActionMenu — disabled items', () => {
  it('disabled item does not dispatch on click', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetch();
    render(
      <ActionMenu
        trigger={<button>Open</button>}
        items={[
          {
            actionId: 'claim.retry',
            request: { claimId: 'c1' },
            label: 'Retry',
            disabled: true,
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const item = await screen.findByRole('menuitem', { name: 'Retry' });
    await user.click(item);
    await new Promise((r) => setTimeout(r, 30));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
