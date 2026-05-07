import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders topNav and main content', () => {
    render(
      <AppShell topNav={<header data-testid="top">Top</header>}>
        <div data-testid="main-body">Main body</div>
      </AppShell>,
    );
    expect(screen.getByTestId('top')).toBeDefined();
    expect(screen.getByTestId('main-body')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('renders sideNav region when provided', () => {
    render(
      <AppShell
        topNav={<header>Top</header>}
        sideNav={<nav data-testid="side">Side</nav>}
      >
        <p>Body</p>
      </AppShell>,
    );
    expect(
      screen.getByRole('complementary', { name: 'Side navigation region' }),
    ).toBeDefined();
    expect(screen.getByTestId('side')).toBeDefined();
  });

  it('renders rightPanel region when provided', () => {
    render(
      <AppShell
        topNav={<header>Top</header>}
        rightPanel={<div data-testid="right">Right</div>}
      >
        <p>Body</p>
      </AppShell>,
    );
    expect(
      screen.getByRole('complementary', { name: 'Detail panel' }),
    ).toBeDefined();
    expect(screen.getByTestId('right')).toBeDefined();
  });

  it('omits sideNav region when not provided', () => {
    render(
      <AppShell topNav={<header>Top</header>}>
        <p>Body</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole('complementary', { name: 'Side navigation region' }),
    ).toBeNull();
  });

  it('omits rightPanel region when not provided', () => {
    render(
      <AppShell topNav={<header>Top</header>}>
        <p>Body</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole('complementary', { name: 'Detail panel' }),
    ).toBeNull();
  });

  it('builds 3-column grid when both side+right are present', () => {
    const { container } = render(
      <AppShell
        topNav={<header>Top</header>}
        sideNav={<nav>Side</nav>}
        rightPanel={<div>Right</div>}
      >
        <p>Body</p>
      </AppShell>,
    );
    const root = container.firstChild as HTMLElement;
    const cols = root.style.gridTemplateColumns;
    expect(cols).toContain('auto');
    expect(cols).toContain('1fr');
    expect(cols).toMatch(/\d+px/);
  });

  it('builds 1-column grid when neither side nor right are present', () => {
    const { container } = render(
      <AppShell topNav={<header>Top</header>}>
        <p>Body</p>
      </AppShell>,
    );
    const root = container.firstChild as HTMLElement;
    const cols = root.style.gridTemplateColumns;
    expect(cols).not.toContain('auto');
    expect(cols).not.toMatch(/\d+px/);
    expect(cols).toContain('1fr');
  });

  it('honors custom rightPanelWidth', () => {
    const { container } = render(
      <AppShell
        topNav={<header>Top</header>}
        rightPanel={<div>Right</div>}
        rightPanelWidth={520}
      >
        <p>Body</p>
      </AppShell>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.gridTemplateColumns).toContain('520px');
  });
});
