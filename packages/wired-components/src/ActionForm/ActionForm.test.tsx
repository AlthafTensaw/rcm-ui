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
import { FormField, Input } from '@tensaw/design-system';

import { ActionForm } from './ActionForm';

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

const claimSchema = z.object({
  patientName: z.string().min(1, 'Required'),
});
type ClaimRequest = z.infer<typeof claimSchema>;

function defineClaimCreate(): void {
  defineAction({
    actionId: 'claim.create',
    kind: 'mutation',
    endpoint: 'POST /api/v1/claims',
    request: claimSchema,
    response: z.object({ claimId: z.string() }),
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

describe('ActionForm — basic flow', () => {
  it('dispatches the action with form values on submit', async () => {
    const user = userEvent.setup();
    defineClaimCreate();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c42' }));
    const onSuccess = vi.fn();
    render(
      <ActionForm<ClaimRequest, { claimId: string }>
        actionId="claim.create"
        schema={claimSchema}
        defaultValues={{ patientName: '' }}
        onSuccess={onSuccess}
      >
        <FormField name="patientName" label="Patient">
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <button type="submit">Save</button>
      </ActionForm>,
    );
    const input = screen.getByLabelText('Patient');
    await user.type(input, 'Jane Doe');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    expect(onSuccess).toHaveBeenCalledWith({ claimId: 'c42' });
  });

  it('schema invalid → no dispatch, error visible on field', async () => {
    const user = userEvent.setup();
    defineClaimCreate();
    const fetchMock = mockFetchOnce(envelope({ claimId: 'c42' }));
    render(
      <ActionForm<ClaimRequest, { claimId: string }>
        actionId="claim.create"
        schema={claimSchema}
        defaultValues={{ patientName: '' }}
      >
        <FormField name="patientName" label="Patient">
          {({ value, onChange, name }) => (
            <Input
              name={name}
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <button type="submit">Save</button>
      </ActionForm>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Required')).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('onError fires when the action fails', async () => {
    const user = userEvent.setup();
    defineClaimCreate();
    mockFetchOnce(errorEnvelope('VALIDATION_ERROR', 'duplicate'), 400);
    const onError = vi.fn();
    render(
      <ActionForm<ClaimRequest, { claimId: string }>
        actionId="claim.create"
        schema={claimSchema}
        defaultValues={{ patientName: 'Jane' }}
        onError={onError}
      >
        <FormField name="patientName" label="Patient">
          {({ value, onChange, name }) => (
            <Input
              name={name}
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <button type="submit">Save</button>
      </ActionForm>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => { expect(onError).toHaveBeenCalled(); });
    const [err] = onError.mock.calls[0]!;
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('toastOnSuccess pushes a toast', async () => {
    const user = userEvent.setup();
    defineClaimCreate();
    mockFetchOnce(envelope({ claimId: 'c1' }));
    render(
      <ActionForm<ClaimRequest, { claimId: string }>
        actionId="claim.create"
        schema={claimSchema}
        defaultValues={{ patientName: 'Jane' }}
        toastOnSuccess="Claim created"
      >
        <FormField name="patientName" label="Patient">
          {({ value, onChange, name }) => (
            <Input
              name={name}
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <button type="submit">Save</button>
      </ActionForm>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(useNotificationsStore.getState().toasts[0]?.title).toBe(
        'Claim created',
      );
    });
  });

  it('renders without schema or defaultValues', async () => {
    const user = userEvent.setup();
    defineAction({
      actionId: 'simple.act',
      kind: 'mutation',
      endpoint: 'POST /api/v1/x',
      request: z.object({ foo: z.string() }),
      response: z.object({ ok: z.boolean() }),
    });
    const fetchMock = mockFetchOnce(envelope({ ok: true }));
    render(
      <ActionForm actionId="simple.act">
        <FormField name="foo" label="Foo">
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <button type="submit">Save</button>
      </ActionForm>,
    );
    await user.type(screen.getByLabelText('Foo'), 'bar');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });
});
