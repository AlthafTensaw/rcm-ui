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

import { ActionButton } from './ActionButton';

// --- Test harness --------------------------------------------------------

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

function defineRetry() {
  defineAction({
    actionId: 'claim.retry',
    kind: 'mutation',
    endpoint: 'POST /api/v1/claims/{claimId}/retry',
    request: z.object({ claimId: z.string() }),
    response: z.object({ claimId: z.string(), status: z.string() }),
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

describe('ActionButton — basic dispatch', () => {
  it('renders the button label', () => {
    defineRetry();
    render(
      <ActionButton actionId="claim.retry" request={{ claimId: 'c1' }}>
        Retry
      </ActionButton>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('dispatches the action on click and calls onSuccess', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(envelope({ claimId: 'c1', status: 'queued' }));
    const onSuccess = vi.fn();
    render(
      <ActionButton<{ claimId: string }, { claimId: string; status: string }>
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        onSuccess={onSuccess}
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(onSuccess).toHaveBeenCalled(); });
    expect(onSuccess).toHaveBeenCalledWith({ claimId: 'c1', status: 'queued' });
  });

  it('calls onError on failure', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(errorEnvelope('VALIDATION_ERROR', 'no'), 400);
    const onError = vi.fn();
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        onError={onError}
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(onError).toHaveBeenCalled(); });
    const [err] = onError.mock.calls[0]!;
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('ActionButton — request resolution', () => {
  it('static request — passes through unchanged', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    render(
      <ActionButton actionId="claim.retry" request={{ claimId: 'c1' }}>
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });

  it('function-form request — invoked on click', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    const buildRequest = vi.fn(() => ({ claimId: 'c1' }));
    render(
      <ActionButton actionId="claim.retry" request={buildRequest}>
        Retry
      </ActionButton>,
    );
    expect(buildRequest).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(buildRequest).toHaveBeenCalled(); });
  });

  it('async function-form request — awaited before dispatch', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    const buildRequest = vi.fn(async () => ({ claimId: 'c1' }));
    render(
      <ActionButton actionId="claim.retry" request={buildRequest}>
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    expect(buildRequest).toHaveBeenCalled();
  });
});

describe('ActionButton — beforeDispatch gate', () => {
  it('skips dispatch when beforeDispatch returns false', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    const onSuccess = vi.fn();
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        beforeDispatch={() => false}
        onSuccess={onSuccess}
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    // Wait briefly to be sure nothing fires asynchronously.
    await new Promise((r) => setTimeout(r, 30));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('proceeds when beforeDispatch returns true (or a Promise resolving true)', async () => {
    const user = userEvent.setup();
    defineRetry();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        beforeDispatch={async () => true}
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });
});

describe('ActionButton — loading state', () => {
  it('disables the button while the action is in flight', async () => {
    const user = userEvent.setup();
    defineRetry();
    // Slow fetch so we can observe the loading frame.
    let resolveFetch!: (v: unknown) => void;
    const slow = new Promise<unknown>((r) => {
      resolveFetch = r;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        slow.then((body) => ({
          ok: true,
          status: 200,
          json: () => Promise.resolve(body),
        })),
      ),
    );

    render(
      <ActionButton actionId="claim.retry" request={{ claimId: 'c1' }}>
        Retry
      </ActionButton>,
    );
    const btn = screen.getByRole('button', { name: 'Retry' });
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute('aria-busy')).toBeNull();

    // Click but don't wait — the dispatch is in-flight while we assert.
    void user.click(btn);
    await waitFor(() => {
      // While loading, Button's children swap to a Spinner; query the button
      // directly (it's the only button on the page).
      const liveBtn = document.querySelector('button')!;
      expect(liveBtn.disabled).toBe(true);
      expect(liveBtn.getAttribute('aria-busy')).toBe('true');
    });

    resolveFetch(envelope({ claimId: 'c1', status: 'ok' }));
    await waitFor(() => {
      const liveBtn = document.querySelector('button')!;
      expect(liveBtn.disabled).toBe(false);
      expect(liveBtn.getAttribute('aria-busy')).toBeNull();
    });
  });
});

describe('ActionButton — toastOnSuccess override', () => {
  it('pushes a toast when toastOnSuccess=true', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        toastOnSuccess
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(useNotificationsStore.getState().toasts.length).toBe(1);
    });
    expect(useNotificationsStore.getState().toasts[0]?.title).toBe('Success');
  });

  it('uses string value as the toast title', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        toastOnSuccess="Claim queued for retry"
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(useNotificationsStore.getState().toasts[0]?.title).toBe(
        'Claim queued for retry',
      );
    });
  });

  it('does not push a toast when toastOnSuccess is undefined', async () => {
    const user = userEvent.setup();
    defineRetry();
    mockFetchOnce(envelope({ claimId: 'c1', status: 'ok' }));
    const onSuccess = vi.fn();
    render(
      <ActionButton
        actionId="claim.retry"
        request={{ claimId: 'c1' }}
        onSuccess={onSuccess}
      >
        Retry
      </ActionButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(onSuccess).toHaveBeenCalled(); });
    expect(useNotificationsStore.getState().toasts).toHaveLength(0);
  });
});
