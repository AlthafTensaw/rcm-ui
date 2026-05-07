import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders the title and body when open', () => {
    render(
      <Dialog open onOpenChange={vi.fn()} title="Confirm action">
        <p>Body content</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Confirm action')).toBeDefined();
    expect(screen.getByText('Body content')).toBeDefined();
  });

  it('renders the description when given', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn()}
        title="t"
        description="More detail"
      >
        body
      </Dialog>,
    );
    expect(screen.getByText('More detail')).toBeDefined();
  });

  it('does not render content when closed', () => {
    render(
      <Dialog open={false} onOpenChange={vi.fn()} title="t">
        body
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the close button with accessible name', () => {
    render(
      <Dialog open onOpenChange={vi.fn()} title="t">
        body
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeDefined();
  });

  it('fires onOpenChange(false) when close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="t">
        body
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('fires onOpenChange(false) on Escape by default', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="t">
        body
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does NOT close on Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="t"
        closeOnEscape={false}
      >
        body
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders footer content when given', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn()}
        title="t"
        footer={<button>Save</button>}
      >
        body
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it.each(['sm', 'md', 'lg', 'xl', 'full'] as const)(
    'renders the %s size',
    (size) => {
      render(
        <Dialog open onOpenChange={vi.fn()} title="t" size={size}>
          body
        </Dialog>,
      );
      expect(screen.getByRole('dialog')).toBeDefined();
    },
  );
});
