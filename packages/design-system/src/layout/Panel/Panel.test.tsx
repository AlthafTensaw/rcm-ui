import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Panel } from './Panel';

describe('Panel', () => {
  it('renders title and children', () => {
    render(
      <Panel title="Charges">
        <p>Body</p>
      </Panel>,
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Charges',
    );
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('omits header when no title/actions', () => {
    const { container } = render(<Panel>just body</Panel>);
    expect(container.querySelector('header')).toBeNull();
  });

  it('renders actions slot', () => {
    render(
      <Panel title="t" actions={<button>Refresh</button>}>
        x
      </Panel>,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDefined();
  });

  it.each(['default', 'elevated', 'minimal'] as const)(
    'renders the %s variant',
    (variant) => {
      render(
        <Panel title="t" variant={variant}>
          x
        </Panel>,
      );
      expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
    },
  );

  it('collapsible toggles body via chevron button', async () => {
    const user = userEvent.setup();
    render(
      <Panel title="Charges" collapsible>
        <p>Body</p>
      </Panel>,
    );
    expect(screen.getByText('Body')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('Body')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('respects defaultCollapsed', () => {
    render(
      <Panel title="t" collapsible defaultCollapsed>
        <p>Body</p>
      </Panel>,
    );
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('respects controlled collapsed prop', () => {
    const onCollapseChange = vi.fn();
    const { rerender } = render(
      <Panel
        title="t"
        collapsible
        collapsed={false}
        onCollapseChange={onCollapseChange}
      >
        <p>Body</p>
      </Panel>,
    );
    expect(screen.getByText('Body')).toBeDefined();
    rerender(
      <Panel
        title="t"
        collapsible
        collapsed
        onCollapseChange={onCollapseChange}
      >
        <p>Body</p>
      </Panel>,
    );
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('does not render chevron when collapsible without title', () => {
    render(
      <Panel collapsible actions={<button>X</button>}>
        body
      </Panel>,
    );
    expect(screen.queryByRole('button', { name: /Collapse|Expand/ })).toBeNull();
  });
});
