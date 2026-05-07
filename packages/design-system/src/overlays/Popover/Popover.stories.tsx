import type { Meta, StoryObj } from '@storybook/react';

import { Popover } from './Popover';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover trigger={<Button>Open popover</Button>}>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Popover content</p>
        <p className="text-xs text-muted-foreground">
          Anchored to the trigger; closes on outside click.
        </p>
      </div>
    </Popover>
  ),
};

export const FilterPanel: Story = {
  render: () => (
    <Popover trigger={<Button variant="outline">Filters</Button>} side="bottom" align="start">
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold">Filter by status</h4>
        <div className="flex flex-col gap-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Open
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Closed
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Denied
          </label>
        </div>
      </div>
    </Popover>
  ),
};
