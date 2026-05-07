import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pill } from './Pill';

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>Active</Pill>);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it.each(['default', 'subtle'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Pill variant={variant}>{variant}</Pill>);
      expect(screen.getByText(variant)).toBeDefined();
    },
  );

  it('does not render remove button when removable is false', () => {
    render(<Pill>Active</Pill>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders remove button with descriptive aria-label when removable', () => {
    render(
      <Pill removable onRemove={vi.fn()}>
        Apple
      </Pill>,
    );
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeDefined();
  });

  it('falls back to "Remove" aria-label when children is not a string', () => {
    render(
      <Pill removable onRemove={vi.fn()}>
        <span>Complex</span>
      </Pill>,
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDefined();
  });

  it('fires onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Pill removable onRemove={onRemove}>
        Apple
      </Pill>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('stops click propagation from the remove button', async () => {
    const user = userEvent.setup();
    const onWrapperClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <div onClick={onWrapperClick}>
        <Pill removable onRemove={onRemove}>
          Apple
        </Pill>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onWrapperClick).not.toHaveBeenCalled();
  });
});
