import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TabbedPanel, type TabDefinition } from './TabbedPanel';

const tabs: TabDefinition[] = [
  { id: 'files', label: 'Files', content: <p>Files panel</p> },
  { id: 'notes', label: 'Notes', content: <p>Notes panel</p> },
  { id: 'audit', label: 'Audit', content: <p>Audit panel</p>, disabled: true },
];

describe('TabbedPanel', () => {
  it('renders title in the panel header and the first tab body', () => {
    render(<TabbedPanel title="Detail" tabs={tabs} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Detail',
    );
    expect(screen.getByText('Files panel')).toBeDefined();
  });

  it('switches tabs and updates body (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<TabbedPanel title="t" tabs={tabs} />);
    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(await screen.findByText('Notes panel')).toBeDefined();
    expect(screen.queryByText('Files panel')).toBeNull();
  });

  it('respects defaultTab', () => {
    render(<TabbedPanel title="t" tabs={tabs} defaultTab="notes" />);
    expect(screen.getByText('Notes panel')).toBeDefined();
    expect(screen.queryByText('Files panel')).toBeNull();
  });

  it('respects controlledTab + onTabChange', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const { rerender } = render(
      <TabbedPanel
        title="t"
        tabs={tabs}
        controlledTab="files"
        onTabChange={onTabChange}
      />,
    );
    expect(screen.getByText('Files panel')).toBeDefined();
    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(onTabChange).toHaveBeenCalledWith('notes');
    // Body should NOT auto-update under controlled mode without a rerender.
    expect(screen.getByText('Files panel')).toBeDefined();
    rerender(
      <TabbedPanel
        title="t"
        tabs={tabs}
        controlledTab="notes"
        onTabChange={onTabChange}
      />,
    );
    expect(await screen.findByText('Notes panel')).toBeDefined();
  });

  it('respects disabled tabs', async () => {
    const user = userEvent.setup();
    render(<TabbedPanel title="t" tabs={tabs} />);
    await user.click(screen.getByRole('tab', { name: 'Audit' }));
    // Still showing Files (disabled tab can't activate).
    expect(screen.getByText('Files panel')).toBeDefined();
  });

  it('renders the actions slot in the panel header', () => {
    render(
      <TabbedPanel
        title="t"
        tabs={tabs}
        actions={<button>Refresh</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDefined();
  });

  it('lazy tab content (function form) is not invoked until activated', async () => {
    const user = userEvent.setup();
    const lazyA = vi.fn(() => <p>A panel</p>);
    const lazyB = vi.fn(() => <p>B panel</p>);
    render(
      <TabbedPanel
        title="t"
        tabs={[
          { id: 'a', label: 'A', content: lazyA },
          { id: 'b', label: 'B', content: lazyB },
        ]}
      />,
    );
    expect(lazyA).toHaveBeenCalled();
    expect(lazyB).not.toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(await screen.findByText('B panel')).toBeDefined();
    expect(lazyB).toHaveBeenCalled();
  });

  it('renders the badge slot on a tab', () => {
    render(
      <TabbedPanel
        title="t"
        tabs={[
          {
            id: 'a',
            label: 'A',
            badge: <span data-testid="badge">3</span>,
            content: <p>A</p>,
          },
        ]}
      />,
    );
    expect(screen.getByTestId('badge')).toBeDefined();
  });
});
