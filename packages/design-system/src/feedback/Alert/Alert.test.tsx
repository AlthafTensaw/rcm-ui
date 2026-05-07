import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './Alert';

describe('Alert', () => {
  it('renders with role=alert', () => {
    render(<Alert title="Heads up" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders title and description', () => {
    render(<Alert title="Heads up" description="Something happened" />);
    expect(screen.getByText('Heads up')).toBeDefined();
    expect(screen.getByText('Something happened')).toBeDefined();
  });

  it('renders children content', () => {
    render(
      <Alert>
        <p>Custom body</p>
      </Alert>,
    );
    expect(screen.getByText('Custom body')).toBeDefined();
  });

  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Alert variant={variant} title="t" />);
      expect(screen.getByRole('alert')).toBeDefined();
    },
  );

  it("renders an auto icon by default", () => {
    const { container } = render(<Alert variant="success" title="t" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('omits the icon when icon=null', () => {
    const { container } = render(
      <Alert title="t" icon={null} dismissible={false} />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an explicit custom icon', () => {
    render(
      <Alert
        title="t"
        icon={<span data-testid="custom-icon">★</span>}
      />,
    );
    expect(screen.getByTestId('custom-icon')).toBeDefined();
  });

  it('renders the dismiss button when dismissible', () => {
    render(<Alert title="t" dismissible onDismiss={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDefined();
  });

  it('does not render dismiss button by default', () => {
    render(<Alert title="t" />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('fires onDismiss when dismiss button clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert title="t" dismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders the action slot', () => {
    render(
      <Alert
        title="t"
        action={<button>Take action</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Take action' }),
    ).toBeDefined();
  });
});
