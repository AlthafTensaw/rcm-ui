import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Snackbar } from './Snackbar';

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message with role=status', () => {
    render(<Snackbar message="Saved" />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Saved')).toBeDefined();
  });

  it.each(['default', 'success', 'warning', 'error'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Snackbar variant={variant} message={variant} />);
      expect(screen.getByText(variant)).toBeDefined();
    },
  );

  it('renders the action slot', () => {
    render(
      <Snackbar
        message="Removed"
        action={<button>Undo</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDefined();
  });

  it('fires onTimeout after the duration elapses', () => {
    const onTimeout = vi.fn();
    render(<Snackbar message="x" duration={1000} onTimeout={onTimeout} />);
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('uses 3000 ms default when duration is omitted', () => {
    const onTimeout = vi.fn();
    render(<Snackbar message="x" onTimeout={onTimeout} />);
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not fire onTimeout when duration is 0 or null', () => {
    const onTimeout = vi.fn();
    const { rerender } = render(
      <Snackbar message="x" duration={0} onTimeout={onTimeout} />,
    );
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();

    rerender(<Snackbar message="x" duration={null} onTimeout={onTimeout} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('clears its timer on unmount (no late fire)', () => {
    const onTimeout = vi.fn();
    const { unmount } = render(
      <Snackbar message="x" duration={1000} onTimeout={onTimeout} />,
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
