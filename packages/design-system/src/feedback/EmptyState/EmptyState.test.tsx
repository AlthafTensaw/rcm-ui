import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and role=status', () => {
    render(<EmptyState title="No claims yet" />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('No claims yet')).toBeDefined();
  });

  it('renders description when given', () => {
    render(
      <EmptyState
        title="No claims yet"
        description="Charges from your EMR will appear here."
      />,
    );
    expect(
      screen.getByText('Charges from your EMR will appear here.'),
    ).toBeDefined();
  });

  it('renders icon when given', () => {
    render(
      <EmptyState
        title="x"
        icon={<span data-testid="icon">📥</span>}
      />,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('renders action when given', () => {
    render(
      <EmptyState
        title="x"
        action={<button>Import claims</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Import claims' }),
    ).toBeDefined();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    render(<EmptyState title="x" size={size} />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('passes through className', () => {
    render(<EmptyState title="x" className="custom-x" />);
    expect(screen.getByRole('status').className).toContain('custom-x');
  });
});
