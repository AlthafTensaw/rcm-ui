import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Popover } from './Popover';

describe('Popover', () => {
  it('renders the trigger and hides content by default (uncontrolled)', () => {
    render(
      <Popover trigger={<button>Open</button>}>
        <p>Body content</p>
      </Popover>,
    );
    expect(screen.getByRole('button', { name: 'Open' })).toBeDefined();
    expect(screen.queryByText('Body content')).toBeNull();
  });

  it('opens on trigger click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button>Open</button>}>
        <p>Body content</p>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText('Body content')).toBeDefined();
  });

  it('respects controlled open state', () => {
    render(
      <Popover open onOpenChange={vi.fn()} trigger={<button>Open</button>}>
        <p>Body</p>
      </Popover>,
    );
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('emits onOpenChange when controlled trigger is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button>Open</button>}
      >
        <p>Body</p>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not render content when controlled open is false', () => {
    render(
      <Popover
        open={false}
        onOpenChange={vi.fn()}
        trigger={<button>Open</button>}
      >
        <p>Body</p>
      </Popover>,
    );
    expect(screen.queryByText('Body')).toBeNull();
  });

  it.each(['top', 'right', 'bottom', 'left'] as const)(
    'accepts side=%s',
    async (side) => {
      const user = userEvent.setup();
      render(
        <Popover side={side} trigger={<button>Open</button>}>
          <p>Body</p>
        </Popover>,
      );
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByText('Body')).toBeDefined();
    },
  );

  it.each(['start', 'center', 'end'] as const)(
    'accepts align=%s',
    async (align) => {
      const user = userEvent.setup();
      render(
        <Popover align={align} trigger={<button>Open</button>}>
          <p>Body</p>
        </Popover>,
      );
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(await screen.findByText('Body')).toBeDefined();
    },
  );
});
