import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';
import { Copy, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './DropdownMenu';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/DropdownMenu',
  component: DropdownMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu trigger={<Button>Actions</Button>}>
      <DropdownMenuItem onSelect={action('edit')}>Edit</DropdownMenuItem>
      <DropdownMenuItem onSelect={action('duplicate')}>Duplicate</DropdownMenuItem>
      <DropdownMenuItem onSelect={action('archive')}>Archive</DropdownMenuItem>
    </DropdownMenu>
  ),
};

export const WithIconsAndShortcuts: Story = {
  render: () => (
    <DropdownMenu trigger={<Button>More</Button>}>
      <DropdownMenuLabel>Claim actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<Pencil size={14} />}
        shortcut="⌘E"
        onSelect={action('edit')}
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<Copy size={14} />}
        shortcut="⌘D"
        onSelect={action('duplicate')}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<Trash2 size={14} />}
        variant="destructive"
        onSelect={action('delete')}
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenu>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <DropdownMenu trigger={<Button variant="outline">Open</Button>}>
      <DropdownMenuItem onSelect={action('a')}>Available</DropdownMenuItem>
      <DropdownMenuItem disabled onSelect={action('b')}>
        Pending review
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={action('c')}>Available</DropdownMenuItem>
    </DropdownMenu>
  ),
};
