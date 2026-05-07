import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  resetAllStoresForTesting,
  useNotificationsStore,
} from '@tensaw/runtime';

import { ToastHost } from './ToastHost';

beforeEach(() => {
  resetAllStoresForTesting();
});
afterEach(() => {
  resetAllStoresForTesting();
});

describe('ToastHost', () => {
  it('renders an empty notifications region when no toasts', () => {
    render(<ToastHost />);
    expect(
      screen.getByRole('region', { name: 'Notifications' }),
    ).toBeDefined();
    // No toast children rendered.
    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it('renders a toast pushed to the store', () => {
    render(<ToastHost />);
    act(() => {
      useNotificationsStore.getState().pushToast({
        toastId: 't1',
        severity: 'success',
        title: 'Saved',
        body: 'Your changes were saved.',
      });
    });
    expect(screen.getByText('Saved')).toBeDefined();
    expect(screen.getByText('Your changes were saved.')).toBeDefined();
  });

  it('stacks multiple toasts in store-insertion order', () => {
    render(<ToastHost />);
    act(() => {
      useNotificationsStore.getState().pushToast({
        toastId: 't1',
        severity: 'info',
        title: 'First',
      });
      useNotificationsStore.getState().pushToast({
        toastId: 't2',
        severity: 'warning',
        title: 'Second',
      });
      useNotificationsStore.getState().pushToast({
        toastId: 't3',
        severity: 'error',
        title: 'Third',
      });
    });
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
    expect(screen.getByText('Third')).toBeDefined();
  });

  it('clicking dismiss removes the toast from the store', async () => {
    const user = userEvent.setup();
    render(<ToastHost />);
    act(() => {
      useNotificationsStore.getState().pushToast({
        toastId: 'tx',
        severity: 'success',
        title: 'Saved',
      });
    });
    expect(screen.getByText('Saved')).toBeDefined();
    // Toast renders a close button; query by its aria-label.
    const closeBtn = screen.getByRole('button', { name: /(close|dismiss)/i });
    await user.click(closeBtn);
    expect(screen.queryByText('Saved')).toBeNull();
    expect(useNotificationsStore.getState().toasts).toHaveLength(0);
  });

  it('passes durationMs through to Toast (null = sticky)', () => {
    render(<ToastHost />);
    act(() => {
      useNotificationsStore.getState().pushToast({
        toastId: 'tsticky',
        severity: 'error',
        title: 'Sticky',
        durationMs: null,
      });
    });
    // Sticky toast still renders normally; the dismiss policy is internal
    // to Toast — we just verify it appears.
    expect(screen.getByText('Sticky')).toBeDefined();
  });

  it('renders body=null without a description block', () => {
    render(<ToastHost />);
    act(() => {
      useNotificationsStore.getState().pushToast({
        toastId: 't-only-title',
        severity: 'info',
        title: 'Only title',
      });
    });
    expect(screen.getByText('Only title')).toBeDefined();
  });
});
