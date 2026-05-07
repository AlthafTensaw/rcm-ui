import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './DropdownMenu';

function Menu({
  onEdit = vi.fn(),
  onDelete = vi.fn(),
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu trigger={<button>Actions</button>}>
      <DropdownMenuLabel>Row actions</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onEdit} shortcut="⌘E">
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onDelete} variant="destructive">
        Delete
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders the trigger and hides items by default', () => {
    render(<Menu />);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeDefined();
    expect(screen.queryByText('Edit')).toBeNull();
  });

  it('opens the menu on trigger click', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByText('Edit')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('renders the label', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByText('Row actions')).toBeDefined();
  });

  it('renders the shortcut hint', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByText('⌘E')).toBeDefined();
  });

  it('fires onSelect when an item is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<Menu onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(await screen.findByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does not fire onSelect for disabled items', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu trigger={<button>Open</button>}>
        <DropdownMenuItem onSelect={onSelect} disabled>
          Disabled item
        </DropdownMenuItem>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByText('Disabled item'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders separator', async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('separator')).toBeDefined();
  });
});
