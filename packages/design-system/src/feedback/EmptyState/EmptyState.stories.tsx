import type { Meta, StoryObj } from '@storybook/react';
import { Inbox, FileSearch, Plus } from 'lucide-react';

import { EmptyState } from './EmptyState';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    title: 'No claims yet',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'Claims will appear here once they’re created or imported.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Inbox size={32} />,
    description: 'Your inbox is clean.',
  },
};

export const WithAction: Story = {
  args: {
    icon: <FileSearch size={32} />,
    description: 'No claims match your filters.',
    action: <Button variant="outline">Clear filters</Button>,
  },
};

export const PrimaryCta: Story = {
  args: {
    icon: <Plus size={32} />,
    title: 'Get started',
    description: 'Create your first claim to begin.',
    action: <Button>New claim</Button>,
  },
};

export const Small: Story = {
  args: { size: 'sm', description: 'Nothing here.' },
};

export const Large: Story = {
  args: {
    size: 'lg',
    icon: <Inbox size={48} />,
    description: 'Your inbox is empty. Take a break.',
    action: <Button variant="outline">Refresh</Button>,
  },
};
