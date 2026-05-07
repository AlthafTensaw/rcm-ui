import type { Meta, StoryObj } from '@storybook/react';

import { Icon } from './Icon';

const meta = {
  title: 'Primitives/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
  args: { name: 'CircleCheck' },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const ExtraLarge: Story = { args: { size: 'xl' } };
export const Search: Story = { args: { name: 'Search' } };
export const Settings: Story = { args: { name: 'Settings' } };

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-3">
      {([
        'Search',
        'Settings',
        'CircleCheck',
        'CircleAlert',
        'CircleX',
        'Info',
        'Mail',
        'Calendar',
        'Plus',
        'Trash2',
        'Pencil',
        'X',
      ] as const).map((name) => (
        <div key={name} className="flex flex-col items-center gap-1 text-xs">
          <Icon name={name} size="lg" />
          {name}
        </div>
      ))}
    </div>
  ),
};
