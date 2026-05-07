import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ColorSwatch } from './ColorSwatch';

describe('ColorSwatch', () => {
  it('renders a radiogroup with the default 10-color palette', () => {
    render(<ColorSwatch value={null} onValueChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Color' })).toBeDefined();
    expect(screen.getAllByRole('radio')).toHaveLength(10);
  });

  it('renders the supplied defaultColors instead of the Tensaw palette', () => {
    render(
      <ColorSwatch
        value={null}
        onValueChange={vi.fn()}
        defaultColors={['#000000', '#ffffff']}
      />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('appends customColors after defaults', () => {
    render(
      <ColorSwatch
        value={null}
        onValueChange={vi.fn()}
        defaultColors={['#000000']}
        customColors={['#aabbcc', '#ddeeff']}
      />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('reflects the selected value via aria-checked', () => {
    render(
      <ColorSwatch
        value="#149A9A"
        onValueChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('radio', { name: '#149A9A' }).getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('emits onValueChange when a swatch is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorSwatch value={null} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: '#149A9A' }));
    expect(onValueChange).toHaveBeenCalledWith('#149A9A');
  });

  it('respects disabled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ColorSwatch value={null} onValueChange={onValueChange} disabled />,
    );
    await user.click(screen.getByRole('radio', { name: '#149A9A' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
