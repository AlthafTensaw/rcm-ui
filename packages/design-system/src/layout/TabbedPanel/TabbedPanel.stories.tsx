import type { Meta, StoryObj } from '@storybook/react';

import { TabbedPanel } from './TabbedPanel';

const meta = {
  title: 'Layout/TabbedPanel',
  component: TabbedPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof TabbedPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <TabbedPanel
        defaultValue="overview"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <p className="text-sm">Overview content</p>,
          },
          {
            value: 'history',
            label: 'History',
            content: <p className="text-sm">History timeline</p>,
          },
          {
            value: 'attachments',
            label: 'Attachments',
            content: <p className="text-sm">Attachments list</p>,
          },
        ]}
      />
    </div>
  ),
};

export const LazyTabs: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <TabbedPanel
        defaultValue="cheap"
        tabs={[
          {
            value: 'cheap',
            label: 'Cheap',
            content: <p className="text-sm">Renders eagerly.</p>,
          },
          {
            value: 'expensive',
            label: 'Expensive (lazy)',
            lazy: true,
            content: () => {
              return <p className="text-sm">This panel mounted only after first activation.</p>;
            },
          },
        ]}
      />
    </div>
  ),
};
