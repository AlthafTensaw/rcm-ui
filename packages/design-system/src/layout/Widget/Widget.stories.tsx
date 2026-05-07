import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';
import { RefreshCw } from 'lucide-react';

import { Widget } from './Widget';
import { IconButton } from '../../primitives/IconButton';

const meta = {
  title: 'Layout/Widget',
  component: Widget,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof Widget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Widget title="Net collections" subtitle="Last 30 days" style={{ width: 360 }}>
      <p className="text-3xl font-semibold">$48,210</p>
      <p className="text-sm text-muted-foreground">+12% vs prior period</p>
    </Widget>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Widget
      title="Open claims"
      subtitle="Updated just now"
      actions={
        <IconButton
          aria-label="Refresh"
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={action('refresh')}
        />
      }
      style={{ width: 360 }}
    >
      <p className="text-3xl font-semibold">47</p>
    </Widget>
  ),
};

export const Loading: Story = {
  render: () => (
    <Widget title="Loading metric" loading style={{ width: 360, minHeight: 140 }}>
      Hidden while loading
    </Widget>
  ),
};

export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <Widget
      title="Net collections"
      error={{ message: 'Failed to load metric.', onRetry: action('retry') }}
      style={{ width: 360 }}
    >
      Hidden when errored
    </Widget>
  ),
};

export const Empty: Story = {
  render: () => (
    <Widget
      title="Top denials"
      empty={{ title: 'No denials yet', description: 'Looking good — no pending denials this week.' }}
      style={{ width: 360 }}
    >
      Hidden when empty
    </Widget>
  ),
};

export const Compact: Story = {
  render: () => (
    <Widget title="A/R aged > 90" padding="sm" style={{ width: 220 }}>
      <p className="text-2xl font-semibold">12.4%</p>
    </Widget>
  ),
};
