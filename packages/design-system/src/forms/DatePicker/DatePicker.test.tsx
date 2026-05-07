import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('renders the trigger with placeholder when no value', () => {
    render(
      <DatePicker
        value={null}
        onValueChange={vi.fn()}
        placeholder="Pick a date"
        aria-label="DOB"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'DOB' }).textContent,
    ).toContain('Pick a date');
  });

  it('renders the trigger with formatted value', () => {
    render(
      <DatePicker
        value={new Date(2026, 0, 15)}
        onValueChange={vi.fn()}
        aria-label="DOB"
      />,
    );
    const text = screen.getByRole('button', { name: 'DOB' }).textContent ?? '';
    // Default 'PP' format → "Jan 15, 2026"
    expect(text).toMatch(/Jan 15, 2026/);
  });

  it('respects custom format string', () => {
    render(
      <DatePicker
        value={new Date(2026, 0, 15)}
        onValueChange={vi.fn()}
        format="yyyy-MM-dd"
        aria-label="DOB"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'DOB' }).textContent,
    ).toContain('2026-01-15');
  });

  it('respects disabled', () => {
    render(
      <DatePicker
        value={null}
        onValueChange={vi.fn()}
        disabled
        aria-label="DOB"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'DOB' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('sets aria-invalid when error', () => {
    render(
      <DatePicker
        value={null}
        onValueChange={vi.fn()}
        error
        aria-label="DOB"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'DOB' }).getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('opens the calendar on click', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        value={new Date(2026, 0, 15)}
        onValueChange={vi.fn()}
        aria-label="DOB"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'DOB' }));
    // react-day-picker renders a grid with role=grid
    expect(await screen.findByRole('grid')).toBeDefined();
  });
});
