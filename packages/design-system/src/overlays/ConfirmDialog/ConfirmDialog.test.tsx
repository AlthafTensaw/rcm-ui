import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title, description, and default labels', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete claim?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('Delete claim?')).toBeDefined();
    expect(screen.getByText('This cannot be undone.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
  });

  it('renders custom labels', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="t"
        description="d"
        confirmLabel="Yes, delete"
        cancelLabel="Keep"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeDefined();
  });

  it('fires onConfirm and closes on Confirm click (sync)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        description="d"
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('fires onCancel and closes on Cancel click', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        description="d"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading on Confirm while async onConfirm is pending', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>((r) => (resolve = r)),
    );
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="t"
        description="d"
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    const confirm = screen.getByRole('button', { name: /confirm/i });
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    resolve();
    await waitFor(() =>
      { expect(confirm.hasAttribute('aria-busy')).toBe(false); },
    );
  });

  it('respects explicit loading prop', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="t"
        description="d"
        onConfirm={vi.fn()}
        loading
      />,
    );
    expect(
      screen.getByRole('button', { name: /confirm/i }).getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('renders the destructive variant', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete"
        description="d"
        variant="destructive"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDefined();
  });
});
