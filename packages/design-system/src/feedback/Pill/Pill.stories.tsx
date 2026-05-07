import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';

import { Pill } from './Pill';

const meta = {
  title: 'Feedback/Pill',
  component: Pill,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'subtle'] },
  },
  args: { children: 'Cardiology' },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Removable: Story = {
  args: { removable: true, onRemove: action('remove') },
};
export const FilterChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill removable onRemove={action('remove-1')}>Status: Open</Pill>
      <Pill removable onRemove={action('remove-2')}>Payer: Medicare</Pill>
      <Pill removable onRemove={action('remove-3')}>DOS: Last 30 days</Pill>
    </div>
  ),
};
