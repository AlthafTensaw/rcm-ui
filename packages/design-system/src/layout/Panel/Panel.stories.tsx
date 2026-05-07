import type { Meta, StoryObj } from '@storybook/react';

import { Panel } from './Panel';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Layout/Panel',
  component: Panel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'inset', 'plain'] },
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Panel title="Patient details" style={{ width: 480 }}>
      <p className="text-sm">Static panel content lives here.</p>
    </Panel>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Panel
      title="Recent activity"
      actions={<Button size="sm" variant="outline">View all</Button>}
      style={{ width: 480 }}
    >
      <ul className="space-y-1 text-sm">
        <li>Claim 12345 submitted</li>
        <li>Patient Jane Doe added</li>
        <li>Charge entry posted</li>
      </ul>
    </Panel>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <Panel collapsible title="Filters (click to collapse)" style={{ width: 480 }}>
      <p className="text-sm">Filter controls go here.</p>
    </Panel>
  ),
};

export const Inset: Story = {
  render: () => (
    <Panel variant="inset" title="Embedded" style={{ width: 480 }}>
      <p className="text-sm">No outer border / shadow.</p>
    </Panel>
  ),
};

export const Plain: Story = {
  render: () => (
    <Panel variant="plain" title="No chrome" style={{ width: 480 }}>
      <p className="text-sm">Minimal styling for nesting inside other surfaces.</p>
    </Panel>
  ),
};
