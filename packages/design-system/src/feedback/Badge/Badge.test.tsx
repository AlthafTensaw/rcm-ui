import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it.each([
    'default',
    'secondary',
    'success',
    'warning',
    'error',
    'outline',
  ] as const)('renders the %s variant', (variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant)).toBeDefined();
  });

  it.each(['sm', 'md'] as const)('renders the %s size', (size) => {
    render(<Badge size={size}>x</Badge>);
    expect(screen.getByText('x')).toBeDefined();
  });

  it('renders the icon slot', () => {
    render(<Badge icon={<span data-testid="i">★</span>}>Featured</Badge>);
    expect(screen.getByTestId('i')).toBeDefined();
    expect(screen.getByText('Featured')).toBeDefined();
  });

  it('forwards ref to the underlying span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>x</Badge>);
    expect(ref.current?.tagName).toBe('SPAN');
  });

  it('composes external className', () => {
    render(<Badge className="custom-x">x</Badge>);
    expect(screen.getByText('x').className).toContain('custom-x');
  });
});
