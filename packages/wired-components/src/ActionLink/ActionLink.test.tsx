import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
  setRouterAdapter,
} from '@tensaw/actions';
import {
  resetAllStoresForTesting,
  useAuthStore,
} from '@tensaw/runtime';

import { ActionLink } from './ActionLink';

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
function defineNavCase() {
  defineAction({
    actionId: 'case.open-detail',
    kind: 'navigate',
    request: z.object({ caseId: z.string() }),
    to: (a) => `/cases/${a.caseId}`,
  });
}
function renderWithRouter(ui: React.ReactNode): ReturnType<typeof render> {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  resetAllStoresForTesting();
  _clearActionRegistry();
  _clearActionCache();
  setRouterAdapter(null);
  signIn();
});
afterEach(() => {
  vi.unstubAllGlobals();
  _clearActionRegistry();
  _clearActionCache();
  setRouterAdapter(null);
});

describe('ActionLink — renders a real anchor with computed href', () => {
  it('renders an anchor with href derived from to(request)', () => {
    defineNavCase();
    renderWithRouter(
      <ActionLink actionId="case.open-detail" request={{ caseId: 'c42' }}>
        Open case
      </ActionLink>,
    );
    const a = screen.getByRole('link', { name: 'Open case' });
    expect(a.getAttribute('href')).toBe('/cases/c42');
  });

  it('warns and renders a span if action is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithRouter(
      <ActionLink actionId="missing.action" request={{}}>
        Nope
      </ActionLink>,
    );
    expect(warn).toHaveBeenCalled();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Nope').getAttribute('aria-disabled')).toBe(
      'true',
    );
    warn.mockRestore();
  });

  it('warns and renders a span if action is not of kind navigate', () => {
    defineAction({
      actionId: 'claim.retry',
      kind: 'mutation',
      endpoint: 'POST /api/v1/claims/{claimId}/retry',
      request: z.object({ claimId: z.string() }),
      response: z.object({ ok: z.boolean() }),
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithRouter(
      <ActionLink actionId="claim.retry" request={{ claimId: 'c1' }}>
        Wrong
      </ActionLink>,
    );
    expect(warn).toHaveBeenCalled();
    expect(screen.queryByRole('link')).toBeNull();
    warn.mockRestore();
  });

  it('renders subtle variant', () => {
    defineNavCase();
    renderWithRouter(
      <ActionLink
        actionId="case.open-detail"
        request={{ caseId: 'c1' }}
        variant="subtle"
      >
        Subtle
      </ActionLink>,
    );
    expect(screen.getByRole('link', { name: 'Subtle' })).toBeDefined();
  });
});

describe('ActionLink — click dispatches action via router adapter', () => {
  it('plain click → dispatchAction → adapter.push fires with computed URL', async () => {
    const user = userEvent.setup();
    defineNavCase();
    const push = vi.fn();
    setRouterAdapter({ push });
    renderWithRouter(
      <ActionLink actionId="case.open-detail" request={{ caseId: 'c42' }}>
        Open case
      </ActionLink>,
    );
    await user.click(screen.getByRole('link', { name: 'Open case' }));
    await waitFor(() => { expect(push).toHaveBeenCalledWith('/cases/c42'); });
  });

  it('meta+click does not dispatch (browser handles new tab)', async () => {
    const user = userEvent.setup();
    defineNavCase();
    const push = vi.fn();
    setRouterAdapter({ push });
    renderWithRouter(
      <ActionLink actionId="case.open-detail" request={{ caseId: 'c42' }}>
        Open case
      </ActionLink>,
    );
    const link = screen.getByRole('link', { name: 'Open case' });
    await user.keyboard('{Meta>}');
    await user.click(link);
    await user.keyboard('{/Meta}');
    await new Promise((r) => setTimeout(r, 30));
    expect(push).not.toHaveBeenCalled();
  });
});
