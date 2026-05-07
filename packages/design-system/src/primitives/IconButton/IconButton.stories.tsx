import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Search, Settings, Trash2, X } from 'lucide-react';

import { IconButton } from './IconButton';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Square icon-only button. Always requires `aria-label`; the type contract enforces it.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Search',
    icon: <Search size={16} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: 'outline', icon: <Settings size={16} /> },
};

export const Ghost: Story = {
  args: { variant: 'ghost', icon: <X size={16} />, 'aria-label': 'Close' },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    icon: <Trash2 size={16} />,
    'aria-label': 'Delete',
  },
};

export const Small: Story = { args: { size: 'sm', icon: <Mail size={14} /> } };
export const Large: Story = { args: { size: 'lg', icon: <Mail size={20} /> } };

export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
