import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const trail: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Cases', to: '/cases' },
  { label: 'Case 12345' },
];

describe('Breadcrumbs', () => {
  it('renders aria-labelled nav with items', () => {
    renderWithRouter(<Breadcrumbs items={trail} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Cases')).toBeDefined();
    expect(screen.getByText('Case 12345')).toBeDefined();
  });

  it('makes intermediate crumbs into links', () => {
    renderWithRouter(<Breadcrumbs items={trail} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Cases' })).toBeDefined();
  });

  it('renders the last crumb as current page (no link, aria-current=page)', () => {
    renderWithRouter(<Breadcrumbs items={trail} />);
    expect(screen.queryByRole('link', { name: 'Case 12345' })).toBeNull();
    const last = screen.getByText('Case 12345').closest('span[aria-current]');
    expect(last?.getAttribute('aria-current')).toBe('page');
  });

  it('renders a default chevron separator (one fewer than items)', () => {
    const { container } = renderWithRouter(<Breadcrumbs items={trail} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(trail.length - 1);
  });

  it('renders a custom separator', () => {
    renderWithRouter(<Breadcrumbs items={trail} separator={<span>›</span>} />);
    const seps = screen.getAllByText('›');
    expect(seps.length).toBe(trail.length - 1);
  });

  it('collapses middle items via maxItems', () => {
    const long: BreadcrumbItem[] = [
      { label: 'L1', to: '/1' },
      { label: 'L2', to: '/2' },
      { label: 'L3', to: '/3' },
      { label: 'L4', to: '/4' },
      { label: 'L5' },
    ];
    renderWithRouter(<Breadcrumbs items={long} maxItems={3} />);
    expect(screen.getByText('L1')).toBeDefined();
    expect(screen.getByText('…')).toBeDefined();
    // Tail of 2 (max - 2 = 1, but minimum 1; let's verify last 1 visible)
    expect(screen.getByText('L5')).toBeDefined();
    // L2 / L3 should be hidden
    expect(screen.queryByText('L2')).toBeNull();
  });

  it('does not collapse when items <= maxItems', () => {
    renderWithRouter(<Breadcrumbs items={trail} maxItems={5} />);
    expect(screen.queryByText('…')).toBeNull();
    expect(screen.getByText('Cases')).toBeDefined();
  });

  it('renders an icon in a crumb when provided', () => {
    renderWithRouter(
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/', icon: <span data-testid="home-icon">🏠</span> },
          { label: 'X' },
        ]}
      />,
    );
    expect(screen.getByTestId('home-icon')).toBeDefined();
  });
});
