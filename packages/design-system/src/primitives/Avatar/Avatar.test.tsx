import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders the fallback (Radix lazily mounts the image)', () => {
    // Radix Avatar starts in fallback state; the image swaps in only after
    // the underlying <img> reports onLoad. In jsdom this never fires, so the
    // fallback stays visible — which is fine for asserting fallback shape.
    render(<Avatar src="/x.png" alt="Alex Smith" />);
    expect(screen.getByText('AS')).toBeDefined();
  });

  it('uses explicit fallbackText when provided', () => {
    render(<Avatar alt="Alex Smith" fallbackText="?!" />);
    expect(screen.getByText('?!')).toBeDefined();
  });

  it('derives single-word initials from alt', () => {
    render(<Avatar alt="System" />);
    expect(screen.getByText('S')).toBeDefined();
  });

  it('derives two-word initials from alt', () => {
    render(<Avatar alt="Katie Lee" />);
    expect(screen.getByText('KL')).toBeDefined();
  });

  it('falls back to ? when alt is empty', () => {
    render(<Avatar alt="" />);
    expect(screen.getByText('?')).toBeDefined();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const { container } = render(<Avatar alt="Alex" size={size} />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/h-\d/);
  });

  it('exposes alt as the accessible name on the fallback', () => {
    render(<Avatar alt="Katie Lee" />);
    expect(screen.getByLabelText('Katie Lee')).toBeDefined();
  });
});
