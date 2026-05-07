import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Img } from './Img';

describe('Img', () => {
  it('renders with src and alt', () => {
    render(<Img src="/x.png" alt="X" />);
    const img = screen.getByAltText('X');
    expect(img.tagName).toBe('IMG');
    expect(img.src).toContain('/x.png');
  });

  it('shows loading placeholder until load fires', () => {
    render(
      <Img
        src="/x.png"
        alt="X"
        loadingPlaceholder={<span data-testid="placeholder">…</span>}
      />,
    );
    expect(screen.getByTestId('placeholder')).toBeDefined();
    fireEvent.load(screen.getByAltText('X'));
    expect(screen.queryByTestId('placeholder')).toBeNull();
  });

  it('renders fallback when error fires and fallback is provided', () => {
    render(
      <Img
        src="/x.png"
        alt="X"
        fallback={<span data-testid="fallback">Image unavailable</span>}
      />,
    );
    fireEvent.error(screen.getByAltText('X'));
    expect(screen.getByTestId('fallback')).toBeDefined();
    expect(screen.queryByAltText('X')).toBeNull();
  });

  it('keeps the image (with no fallback) when error fires and no fallback is provided', () => {
    render(<Img src="/x.png" alt="X" />);
    fireEvent.error(screen.getByAltText('X'));
    expect(screen.getByAltText('X')).toBeDefined();
  });

  it('hides the image with `invisible` while loading', () => {
    render(<Img src="/x.png" alt="X" />);
    expect(screen.getByAltText('X').className).toContain('invisible');
    fireEvent.load(screen.getByAltText('X'));
    expect(screen.getByAltText('X').className).not.toContain('invisible');
  });
});
