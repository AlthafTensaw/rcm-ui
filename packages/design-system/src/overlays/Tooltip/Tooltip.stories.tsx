import type { Meta, StoryObj } from '@storybook/react';

import { Tooltip } from './Tooltip';
import { Button } from '../../primitives/Button';
import { IconButton } from '../../primitives/IconButton';
import { Settings } from 'lucide-react';

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Saves the form">
      <Button>Save</Button>
    </Tooltip>
  ),
};

export const OnIconButton: Story = {
  render: () => (
    <Tooltip content="Settings">
      <IconButton aria-label="Settings" variant="ghost" icon={<Settings size={16} />} />
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Top" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <Tooltip content="Right" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
    </div>
  ),
};

export const RichContent: Story = {
  render: () => (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Net collection rate</span>
          <span className="text-xs">Net payments / total charges (excludes write-offs)</span>
        </div>
      }
    >
      <Button variant="link">What's this?</Button>
    </Tooltip>
  ),
};
