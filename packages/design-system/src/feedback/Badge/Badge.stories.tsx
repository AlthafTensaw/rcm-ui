import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';

import { Badge } from './Badge';

const meta = {
  title: 'Feedback/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'warning', 'destructive', 'info', 'outline'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = { args: { variant: 'success', children: 'Paid' } };
export const Warning: Story = { args: { variant: 'warning', children: 'Pending' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Denied' } };
export const Info: Story = { args: { variant: 'info', children: 'Filed' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Draft' } };
export const WithIcon: Story = {
  args: { variant: 'success', icon: <Check size={12} />, children: 'Posted' },
};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};
