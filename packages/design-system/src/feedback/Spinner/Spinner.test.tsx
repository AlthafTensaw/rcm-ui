import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeDefined();
  });

  it('respects custom aria-label', () => {
    render(<Spinner aria-label="Saving changes" />);
    expect(screen.getByRole('status', { name: 'Saving changes' })).toBeDefined();
  });

  it('applies size in pixels', () => {
    const { container } = render(<Spinner size="lg" />);
    const wrapper = container.querySelector('[role="status"]')!;
    expect(wrapper.style.width).toBe('24px');
    expect(wrapper.style.height).toBe('24px');
  });

  it('renders the inner SVG with aria-hidden', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('supports the xs size (12 px)', () => {
    const { container } = render(<Spinner size="xs" />);
    const wrapper = container.querySelector('[role="status"]')!;
    expect(wrapper.style.width).toBe('12px');
    expect(wrapper.style.height).toBe('12px');
  });

  it('applies the inverted variant via text-white class', () => {
    const { container } = render(<Spinner variant="inverted" />);
    const wrapper = container.querySelector('[role="status"]')!;
    expect(wrapper.className).toContain('text-white');
  });

  it('does not apply text-white for the default variant', () => {
    const { container } = render(<Spinner />);
    const wrapper = container.querySelector('[role="status"]')!;
    expect(wrapper.className).not.toContain('text-white');
  });
});
