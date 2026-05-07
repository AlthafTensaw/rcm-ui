import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders as a checkbox role', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeDefined();
  });

  it('toggles when clicked', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="Accept" onCheckedChange={onCheckedChange} />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Accept' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Accept"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Accept' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('reflects checked state via data-state', () => {
    render(<Checkbox aria-label="Accept" checked />);
    expect(
      screen
        .getByRole('checkbox', { name: 'Accept' })
        .getAttribute('data-state'),
    ).toBe('checked');
  });

  it('reflects indeterminate state via data-state', () => {
    render(<Checkbox aria-label="Accept" checked="indeterminate" />);
    expect(
      screen
        .getByRole('checkbox', { name: 'Accept' })
        .getAttribute('data-state'),
    ).toBe('indeterminate');
  });

  it('supports keyboard activation', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="Accept" onCheckedChange={onCheckedChange} />,
    );
    const cb = screen.getByRole('checkbox', { name: 'Accept' });
    cb.focus();
    await user.keyboard(' ');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
