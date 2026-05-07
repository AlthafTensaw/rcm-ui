import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title and role=status', () => {
    render(<Toast title="Saved" />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Saved')).toBeDefined();
  });

  it('renders description when given', () => {
    render(<Toast title="Saved" description="Changes persisted." />);
    expect(screen.getByText('Changes persisted.')).toBeDefined();
  });

  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Toast variant={variant} title={variant} />);
      expect(screen.getByText(variant)).toBeDefined();
    },
  );

  it('uses aria-live=assertive for the error variant', () => {
    render(<Toast variant="error" title="Boom" />);
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe(
      'assertive',
    );
  });

  it('uses aria-live=polite for other variants', () => {
    render(<Toast variant="success" title="ok" />);
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe(
      'polite',
    );
  });

  it('renders the action slot', () => {
    render(<Toast title="Removed" action={<button>Undo</button>} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDefined();
  });

  it('renders the close button', () => {
    render(<Toast title="x" />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeDefined();
  });

  it('fires onDismiss when close clicked', async () => {
    // Real timers for this user-interaction test.
    vi.useRealTimers();
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Toast title="x" onDismiss={onDismiss} duration={null} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('fires onDismiss after the duration elapses (default 5000)', () => {
    const onDismiss = vi.fn();
    render(<Toast title="x" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when duration is null', () => {
    const onDismiss = vi.fn();
    render(<Toast title="x" duration={null} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('clears its timer on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <Toast title="x" duration={1000} onDismiss={onDismiss} />,
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
