import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TopNav, TopNavItem, TopNavUserMenu } from './TopNav';

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TopNav', () => {
  it('renders banner with logo, nav, utility slots', () => {
    renderWithRouter(
      <TopNav
        logo={<span data-testid="logo">Brand</span>}
        primaryNav={<TopNavItem to="/cases">Cases</TopNavItem>}
        utilityNav={<button data-testid="util">Bell</button>}
      />,
    );
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByTestId('logo')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Cases' })).toBeDefined();
    expect(screen.getByTestId('util')).toBeDefined();
  });

  it('renders primary nav with aria-label', () => {
    renderWithRouter(
      <TopNav primaryNav={<TopNavItem to="/x">X</TopNavItem>} />,
    );
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeDefined();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s height', (height) => {
    renderWithRouter(<TopNav height={height} />);
    expect(screen.getByRole('banner')).toBeDefined();
  });

  it('omits border in minimal variant', () => {
    renderWithRouter(<TopNav variant="minimal" />);
    const banner = screen.getByRole('banner');
    expect(banner.className).not.toContain('border-b');
  });
});

describe('TopNavItem', () => {
  it('renders an internal link when `to` is given', () => {
    renderWithRouter(<TopNavItem to="/cases">Cases</TopNavItem>);
    const link = screen.getByRole('link', { name: 'Cases' });
    expect(link.getAttribute('href')).toBe('/cases');
  });

  it('marks active item with aria-current=page', () => {
    renderWithRouter(
      <TopNavItem to="/cases" active>
        Cases
      </TopNavItem>,
    );
    expect(
      screen.getByRole('link', { name: 'Cases' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('renders an external link when `href` is given', () => {
    renderWithRouter(<TopNavItem href="https://example.com">Docs</TopNavItem>);
    const link = screen.getByRole('link', { name: /docs/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders a button with onClick when neither `to` nor `href` is given', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithRouter(<TopNavItem onClick={onClick}>Open</TopNavItem>);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders icon and badge slots', () => {
    renderWithRouter(
      <TopNavItem
        to="/x"
        icon={<span data-testid="icon">★</span>}
        badge={<span data-testid="badge">3</span>}
      >
        Items
      </TopNavItem>,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
    expect(screen.getByTestId('badge')).toBeDefined();
  });
});

describe('TopNavUserMenu', () => {
  const user = {
    name: 'Alex Smith',
    email: 'alex@example.com',
  };

  it('renders the avatar trigger with accessible name', () => {
    renderWithRouter(
      <TopNavUserMenu
        user={user}
        items={[{ label: 'Sign out', onSelect: vi.fn() }]}
      />,
    );
    expect(
      screen.getByRole('button', { name: /User menu for Alex Smith/i }),
    ).toBeDefined();
  });

  it('opens the menu on trigger click and shows items', async () => {
    const u = userEvent.setup();
    renderWithRouter(
      <TopNavUserMenu
        user={user}
        items={[
          { label: 'Settings', onSelect: vi.fn() },
          { label: 'Sign out', variant: 'destructive', onSelect: vi.fn() },
        ]}
      />,
    );
    await u.click(screen.getByRole('button', { name: /User menu for Alex/ }));
    expect(await screen.findByText('Settings')).toBeDefined();
    expect(screen.getByText('Sign out')).toBeDefined();
  });

  it('fires the chosen item handler', async () => {
    const u = userEvent.setup();
    const onSettings = vi.fn();
    renderWithRouter(
      <TopNavUserMenu
        user={user}
        items={[{ label: 'Settings', onSelect: onSettings }]}
      />,
    );
    await u.click(screen.getByRole('button', { name: /User menu for Alex/ }));
    await u.click(await screen.findByText('Settings'));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
