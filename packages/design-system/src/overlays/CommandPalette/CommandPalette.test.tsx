import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CommandPalette, type CommandGroup } from './CommandPalette';

function makeGroups(
  onCases = vi.fn(),
  onReports = vi.fn(),
): CommandGroup[] {
  return [
    {
      label: 'Navigate',
      items: [
        {
          id: 'goto-cases',
          label: 'Go to Cases',
          shortcut: 'G C',
          onSelect: onCases,
        },
        {
          id: 'goto-reports',
          label: 'Go to Reports',
          keywords: ['analytics'],
          onSelect: onReports,
        },
      ],
    },
  ];
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={vi.fn()}
        groups={makeGroups()}
      />,
    );
    expect(screen.queryByPlaceholderText(/Type a command/i)).toBeNull();
  });

  it('renders search input, group heading, and items when open', () => {
    render(
      <CommandPalette open onOpenChange={vi.fn()} groups={makeGroups()} />,
    );
    expect(screen.getByPlaceholderText(/Type a command/i)).toBeDefined();
    expect(screen.getByText('Navigate')).toBeDefined();
    expect(screen.getByText('Go to Cases')).toBeDefined();
    expect(screen.getByText('Go to Reports')).toBeDefined();
  });

  it('renders the shortcut hint', () => {
    render(
      <CommandPalette open onOpenChange={vi.fn()} groups={makeGroups()} />,
    );
    expect(screen.getByText('G C')).toBeDefined();
  });

  it('fires onSelect and closes on item click', async () => {
    const user = userEvent.setup();
    const onCases = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        groups={makeGroups(onCases)}
      />,
    );
    await user.click(screen.getByText('Go to Cases'));
    expect(onCases).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('filters by typed query', async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette open onOpenChange={vi.fn()} groups={makeGroups()} />,
    );
    await user.type(screen.getByPlaceholderText(/Type a command/i), 'Reports');
    await waitFor(() =>
      { expect(screen.queryByText('Go to Cases')).toBeNull(); },
    );
    expect(screen.getByText('Go to Reports')).toBeDefined();
  });

  it('matches by keywords', async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette open onOpenChange={vi.fn()} groups={makeGroups()} />,
    );
    await user.type(screen.getByPlaceholderText(/Type a command/i), 'analytics');
    expect(screen.getByText('Go to Reports')).toBeDefined();
    await waitFor(() => { expect(screen.queryByText('Go to Cases')).toBeNull(); });
  });

  it('shows emptyText when nothing matches', async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        open
        onOpenChange={vi.fn()}
        groups={makeGroups()}
        emptyText="Nothing here"
      />,
    );
    await user.type(
      screen.getByPlaceholderText(/Type a command/i),
      'zzzzzz-no-match',
    );
    expect(await screen.findByText('Nothing here')).toBeDefined();
  });
});
