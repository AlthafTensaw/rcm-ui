import type { Meta, StoryObj } from '@storybook/react';

import { ExternalLink } from './ExternalLink';

const meta = {
  title: 'Primitives/ExternalLink',
  component: ExternalLink,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { href: 'https://example.com', children: 'Open documentation' },
} satisfies Meta<typeof ExternalLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutIcon: Story = { args: { showIcon: false } };
