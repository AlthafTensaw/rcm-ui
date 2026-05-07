import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  SideNav,
  SideNavGroup,
  SideNavItem,
  SideNavSearch,
  type SearchResult,
} from './SideNav';

function renderWithRouter(ui: React.ReactNode, initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
  );
}

describe('SideNav', () => {
  it('renders an aria-labelled nav', () => {
    renderWithRouter(<SideNav>{null}</SideNav>);
    expect(
      screen.getByRole('navigation', { name: 'Side navigation' }),
    ).toBeDefined();
  });

  it('respects custom width', () => {
    const { container } = renderWithRouter(<SideNav width={300}>{null}</SideNav>);
    const nav = container.querySelector('nav')!;
    expect(nav.style.width).toBe('300px');
  });

  it('uses 240 px default and 64 px when collapsed', () => {
    const { rerender } = renderWithRouter(<SideNav>{null}</SideNav>);
    let nav = screen.getByRole('navigation');
    expect(nav.style.width).toBe('240px');
    rerender(
      <MemoryRouter>
        <SideNav collapsed>{null}</SideNav>
      </MemoryRouter>,
    );
    nav = screen.getByRole('navigation');
    expect(nav.style.width).toBe('64px');
  });
});

describe('SideNavGroup', () => {
  it('renders the label and children', () => {
    renderWithRouter(
      <SideNav>
        <SideNavGroup label="Cases">
          <SideNavItem to="/cases">All</SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    expect(screen.getByText('Cases')).toBeDefined();
    expect(screen.getByRole('link', { name: 'All' })).toBeDefined();
  });

  it('hides label when SideNav is collapsed', () => {
    renderWithRouter(
      <SideNav collapsed>
        <SideNavGroup label="Cases">
          <SideNavItem to="/cases" icon={<span>I</span>}>
            All
          </SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    expect(screen.queryByText('Cases')).toBeNull();
    expect(screen.queryByText('All')).toBeNull();
  });

  it('toggles collapsed children when collapsible', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SideNav>
        <SideNavGroup label="Cases" collapsible defaultExpanded={false}>
          <SideNavItem to="/cases">All</SideNavItem>
        </SideNavGroup>
      </SideNav>,
    );
    expect(screen.queryByRole('link', { name: 'All' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Cases/ }));
    expect(await screen.findByRole('link', { name: 'All' })).toBeDefined();
  });
});

describe('SideNavItem', () => {
  it('marks active item via current route prefix match', () => {
    renderWithRouter(
      <SideNav>
        <SideNavItem to="/cases">Cases</SideNavItem>
      </SideNav>,
      ['/cases/123'],
    );
    expect(
      screen.getByRole('link', { name: 'Cases' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('exact route also marks active', () => {
    renderWithRouter(
      <SideNav>
        <SideNavItem to="/cases">Cases</SideNavItem>
      </SideNav>,
      ['/cases'],
    );
    expect(
      screen.getByRole('link', { name: 'Cases' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('respects controlled active prop over auto', () => {
    renderWithRouter(
      <SideNav>
        <SideNavItem to="/cases" active={false}>
          Cases
        </SideNavItem>
      </SideNav>,
      ['/cases'],
    );
    expect(
      screen.getByRole('link', { name: 'Cases' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('renders icon and badge slots when expanded', () => {
    renderWithRouter(
      <SideNav>
        <SideNavItem
          to="/x"
          icon={<span data-testid="icon">★</span>}
          badge={<span data-testid="badge">3</span>}
        >
          Items
        </SideNavItem>
      </SideNav>,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
    expect(screen.getByTestId('badge')).toBeDefined();
  });

  it('hides label and badge when SideNav collapsed', () => {
    renderWithRouter(
      <SideNav collapsed>
        <SideNavItem
          to="/x"
          icon={<span data-testid="icon">★</span>}
          badge={<span data-testid="badge">3</span>}
        >
          Items
        </SideNavItem>
      </SideNav>,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
    expect(screen.queryByText('Items')).toBeNull();
    expect(screen.queryByTestId('badge')).toBeNull();
  });
});

describe('SideNavSearch', () => {
  const sampleResults: SearchResult[] = [
    { id: 'r1', label: 'Case 12345', description: 'Open' },
    { id: 'r2', label: 'Case 67890' },
  ];

  it('renders the search input', () => {
    renderWithRouter(
      <SideNav>
        <SideNavSearch
          onSearch={async () => sampleResults}
          onResultSelect={vi.fn()}
        />
      </SideNav>,
    );
    expect(screen.getByLabelText('Search…')).toBeDefined();
  });

  it('triggers search after typing (debounced)', async () => {
    const onSearch = vi.fn(async () => sampleResults);
    renderWithRouter(
      <SideNav>
        <SideNavSearch
          onSearch={onSearch}
          onResultSelect={vi.fn()}
          debounceMs={0}
        />
      </SideNav>,
    );
    const input = screen.getByLabelText('Search…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12345' } });
    await waitFor(() => { expect(onSearch).toHaveBeenCalled(); });
    expect(await screen.findByRole('option', { name: /Case 12345/ })).toBeDefined();
  });

  it('fires onResultSelect when a result is clicked', async () => {
    const user = userEvent.setup();
    const onResultSelect = vi.fn();
    renderWithRouter(
      <SideNav>
        <SideNavSearch
          onSearch={async () => sampleResults}
          onResultSelect={onResultSelect}
          debounceMs={0}
        />
      </SideNav>,
    );
    const input = screen.getByLabelText('Search…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Case' } });
    const option = await screen.findByRole('option', { name: /Case 12345/ });
    await user.click(option);
    expect(onResultSelect).toHaveBeenCalledWith(sampleResults[0]);
  });

  it('shows emptyText when no results', async () => {
    renderWithRouter(
      <SideNav>
        <SideNavSearch
          onSearch={async () => []}
          onResultSelect={vi.fn()}
          debounceMs={0}
          emptyText="Nothing here"
        />
      </SideNav>,
    );
    const input = screen.getByLabelText('Search…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(await screen.findByText('Nothing here')).toBeDefined();
  });

  it('renders an icon button when SideNav collapsed', () => {
    renderWithRouter(
      <SideNav collapsed>
        <SideNavSearch onSearch={async () => []} onResultSelect={vi.fn()} />
      </SideNav>,
    );
    expect(screen.getByRole('button', { name: 'Search' })).toBeDefined();
  });
});
