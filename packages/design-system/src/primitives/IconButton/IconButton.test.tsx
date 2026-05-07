import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with the icon and aria-label', () => {
    render(
      <IconButton
        aria-label="Close dialog"
        icon={<span data-testid="x">×</span>}
      />,
    );
    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toBeDefined();
    expect(screen.getByTestId('x')).toBeDefined();
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Save" icon={<span>S</span>} onClick={onClick} />,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton
        aria-label="Save"
        icon={<span>S</span>}
        disabled
        onClick={onClick}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} aria-label="Save" icon={<span>S</span>} />);
    expect(ref.current?.tagName).toBe('BUTTON');
  });
});
