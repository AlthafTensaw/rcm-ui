import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Home, Slash } from 'lucide-react';

import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Cases', to: '/cases' },
      { label: 'Open', to: '/cases/open' },
      { label: 'Case 12345' },
    ],
  },
};

export const SingleItem: Story = {
  args: { items: [{ label: 'Settings' }] },
};

export const WithIconLeader: Story = {
  args: {
    items: [
      { label: <Home size={14} />, to: '/' },
      { label: 'Patients', to: '/patients' },
      { label: 'Jane Doe' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Cases', to: '/cases' },
      { label: 'Open', to: '/cases/open' },
      { label: 'Case 12345' },
    ],
    separator: <Slash size={12} />,
  },
};

export const Collapsed: Story = {
  args: {
    items: [
      { label: 'Org', to: '/' },
      { label: 'Cases', to: '/cases' },
      { label: 'Open', to: '/cases/open' },
      { label: '2026', to: '/cases/open/2026' },
      { label: 'Q1', to: '/cases/open/2026/q1' },
      { label: 'Case 12345' },
    ],
    maxItems: 3,
  },
};
