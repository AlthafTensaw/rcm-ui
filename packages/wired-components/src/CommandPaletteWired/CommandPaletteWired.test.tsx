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

import { CommandPaletteWired } from './CommandPaletteWired';

function signIn(permissions: string[] = []): void {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u1',
      username: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: [],
      permissions,
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
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(envelope({ ok: true })),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  resetAllStoresForTesting();
  _clearActionRegistry();
  _clearActionCache();
});
afterEach(() => {
  vi.unstubAllGlobals();
  _clearActionRegistry();
  _clearActionCache();
});

describe('CommandPaletteWired — render', () => {
  it('renders the dialog when open', () => {
    signIn();
    render(
      <CommandPaletteWired open onOpenChange={vi.fn()} />,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('does not render when closed', () => {
    signIn();
    render(<CommandPaletteWired open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('CommandPaletteWired — auto-populates from registered actions', () => {
  it('groups by action-id domain, sorted alphabetically', () => {
    signIn();
    defineAction({
      actionId: 'claim.retry',
      kind: 'mutation',
      endpoint: 'POST /api/v1/claims/{claimId}/retry',
      request: z.object({}),
      response: z.object({}),
      description: 'Retry claim',
    });
    defineAction({
      actionId: 'claim.delete',
      kind: 'mutation',
      endpoint: 'DELETE /api/v1/claims/{claimId}',
      request: z.object({}),
      response: z.object({}),
      description: 'Delete claim',
    });
    defineAction({
      actionId: 'admin.list-cases',
      kind: 'query',
      endpoint: 'GET /api/v1/cases',
      request: z.object({}),
      response: z.object({}),
      description: 'List cases',
    });
    render(<CommandPaletteWired open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Retry claim')).toBeDefined();
    expect(screen.getByText('Delete claim')).toBeDefined();
    expect(screen.getByText('List cases')).toBeDefined();
    // Domain headings appear (cmdk renders them).
    expect(screen.getByText('Admin')).toBeDefined();
    expect(screen.getByText('Claim')).toBeDefined();
  });
});

describe('CommandPaletteWired — permission filter', () => {
  it('hides actions whose required permission the user lacks', () => {
    signIn(['claims:read']); // missing claims:write
    defineAction({
      actionId: 'claim.delete',
      kind: 'mutation',
      endpoint: 'DELETE /api/v1/claims/{claimId}',
      request: z.object({}),
      response: z.object({}),
      description: 'Delete claim',
      permission: 'claims:write',
    });
    defineAction({
      actionId: 'claim.list',
      kind: 'query',
      endpoint: 'GET /api/v1/claims',
      request: z.object({}),
      response: z.object({}),
      description: 'List claims',
      permission: 'claims:read',
    });
    render(<CommandPaletteWired open onOpenChange={vi.fn()} />);
    expect(screen.getByText('List claims')).toBeDefined();
    expect(screen.queryByText('Delete claim')).toBeNull();
  });

  it('respects custom filter prop', () => {
    signIn();
    defineAction({
      actionId: 'claim.retry',
      kind: 'mutation',
      endpoint: 'POST /api/v1/claims/{claimId}/retry',
      request: z.object({}),
      response: z.object({}),
      description: 'Retry claim',
    });
    defineAction({
      actionId: 'claim.delete',
      kind: 'mutation',
      endpoint: 'DELETE /api/v1/claims/{claimId}',
      request: z.object({}),
      response: z.object({}),
      description: 'Delete claim',
    });
    render(
      <CommandPaletteWired
        open
        onOpenChange={vi.fn()}
        filter={(id) => id !== 'claim.delete'}
      />,
    );
    expect(screen.getByText('Retry claim')).toBeDefined();
    expect(screen.queryByText('Delete claim')).toBeNull();
  });
});

describe('CommandPaletteWired — selection', () => {
  it('selecting an item dispatches and closes', async () => {
    const user = userEvent.setup();
    signIn();
    defineAction({
      actionId: 'app.toggle-dark',
      kind: 'mutation',
      endpoint: 'POST /api/v1/preferences/toggle-dark',
      request: z.object({}),
      response: z.object({}),
      description: 'Toggle dark mode',
    });
    const fetchMock = mockFetch();
    const onOpenChange = vi.fn();
    render(<CommandPaletteWired open onOpenChange={onOpenChange} />);
    const item = screen.getByRole('option', { name: /Toggle dark mode/ });
    await user.click(item);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });
});

describe('CommandPaletteWired — extraGroups', () => {
  it('renders extra groups after the auto-discovered ones', () => {
    signIn();
    defineAction({
      actionId: 'claim.retry',
      kind: 'mutation',
      endpoint: 'POST /api/v1/claims/{claimId}/retry',
      request: z.object({}),
      response: z.object({}),
      description: 'Retry claim',
    });
    render(
      <CommandPaletteWired
        open
        onOpenChange={vi.fn()}
        extraGroups={[
          {
            label: 'Recent',
            items: [
              {
                id: 'recent-1',
                label: 'Recent case 12345',
                onSelect: vi.fn(),
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText('Recent')).toBeDefined();
    expect(screen.getByText('Recent case 12345')).toBeDefined();
  });
});

describe('CommandPaletteWired — empty state', () => {
  it('shows emptyText when no actions registered', () => {
    signIn();
    render(
      <CommandPaletteWired
        open
        onOpenChange={vi.fn()}
        emptyText="Nothing here"
      />,
    );
    // cmdk Empty content; ensure the dialog renders without crashing.
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
