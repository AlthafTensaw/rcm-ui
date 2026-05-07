import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Link } from './Link';

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Link', () => {
  it('renders an anchor with the right href', () => {
    renderWithRouter(<Link to="/elsewhere">Go</Link>);
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/elsewhere');
  });

  it.each(['default', 'subtle', 'destructive'] as const)(
    'renders the %s variant',
    (variant) => {
      renderWithRouter(
        <Link to="/x" variant={variant}>
          Go
        </Link>,
      );
      expect(screen.getByRole('link', { name: 'Go' })).toBeDefined();
    },
  );

  it('composes external className', () => {
    renderWithRouter(
      <Link to="/x" className="custom-class">
        Go
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Go' }).className).toContain(
      'custom-class',
    );
  });
});
