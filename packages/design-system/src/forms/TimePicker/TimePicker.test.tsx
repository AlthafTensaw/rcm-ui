import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders empty inputs when value is null', () => {
    render(
      <TimePicker
        value={null}
        onValueChange={vi.fn()}
        aria-label="Start time"
      />,
    );
    expect(screen.getByRole('group', { name: 'Start time' })).toBeDefined();
    expect((screen.getByLabelText('Hours')).value).toBe('');
    expect((screen.getByLabelText('Minutes')).value).toBe(
      '',
    );
  });

  it('renders 24h padded values', () => {
    render(
      <TimePicker
        value={{ hours: 9, minutes: 5 }}
        onValueChange={vi.fn()}
        aria-label="t"
      />,
    );
    expect((screen.getByLabelText('Hours')).value).toBe(
      '09',
    );
    expect((screen.getByLabelText('Minutes')).value).toBe(
      '05',
    );
  });

  it('shows AM/PM toggle in 12h format', () => {
    render(
      <TimePicker
        value={{ hours: 14, minutes: 30 }}
        onValueChange={vi.fn()}
        format="12h"
        aria-label="t"
      />,
    );
    expect((screen.getByLabelText('Hours')).value).toBe(
      '02',
    );
    expect(screen.getByText('PM')).toBeDefined();
  });

  it('emits 24h hours when 12h hours change', () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker
        value={{ hours: 14, minutes: 30 }}
        onValueChange={onValueChange}
        format="12h"
        aria-label="t"
      />,
    );
    const hours = screen.getByLabelText('Hours');
    fireEvent.change(hours, { target: { value: '3' } });
    // Period is PM (carried from hours:14), so 3 PM = 15h.
    expect(onValueChange).toHaveBeenLastCalledWith({ hours: 15, minutes: 30 });
  });

  it('toggles AM/PM on the period button', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TimePicker
        value={{ hours: 9, minutes: 0 }}
        onValueChange={onValueChange}
        format="12h"
        aria-label="t"
      />,
    );
    await user.click(screen.getByText('AM'));
    expect(onValueChange).toHaveBeenLastCalledWith({ hours: 21, minutes: 0 });
  });

  it('respects disabled', () => {
    render(
      <TimePicker
        value={{ hours: 9, minutes: 0 }}
        onValueChange={vi.fn()}
        disabled
        aria-label="t"
      />,
    );
    expect(
      (screen.getByLabelText('Hours')).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText('Minutes')).disabled,
    ).toBe(true);
  });

  it('sets aria-invalid when error', () => {
    render(
      <TimePicker
        value={null}
        onValueChange={vi.fn()}
        error
        aria-label="t"
      />,
    );
    expect(
      screen.getByRole('group', { name: 't' }).getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('respects step on minute input', () => {
    render(
      <TimePicker
        value={{ hours: 9, minutes: 0 }}
        onValueChange={vi.fn()}
        step={15}
        aria-label="t"
      />,
    );
    expect(
      (screen.getByLabelText('Minutes')).step,
    ).toBe('15');
  });
});
