import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker', () => {
  it('renders the placeholder when both halves are null', () => {
    render(
      <DateRangePicker
        value={{ from: null, to: null }}
        onValueChange={vi.fn()}
        placeholder="Pick a range"
        aria-label="Window"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Window' }).textContent,
    ).toContain('Pick a range');
  });

  it('renders the formatted range when both halves are set', () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
        onValueChange={vi.fn()}
        aria-label="Window"
      />,
    );
    const text = screen.getByRole('button', { name: 'Window' }).textContent ?? '';
    expect(text).toMatch(/Jan 1, 2026/);
    expect(text).toMatch(/Jan 31, 2026/);
  });

  it('renders "from – …" when only the start half is set', () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: null }}
        onValueChange={vi.fn()}
        aria-label="Window"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Window' }).textContent,
    ).toContain('…');
  });

  it('respects disabled', () => {
    render(
      <DateRangePicker
        value={{ from: null, to: null }}
        onValueChange={vi.fn()}
        disabled
        aria-label="Window"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Window' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('opens the calendar on click', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: null }}
        onValueChange={vi.fn()}
        aria-label="Window"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Window' }));
    // Two-month layout: expect two grids.
    const grids = await screen.findAllByRole('grid');
    expect(grids.length).toBe(2);
  });
});
