import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rectangular: Story = { args: { width: 280, height: 32 } };
export const Circular: Story = {
  args: { variant: 'circular', width: 40, height: 40 },
};
export const Text: Story = { args: { variant: 'text', width: 240 } };

export const ListPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-3" style={{ width: 360 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  ),
};
