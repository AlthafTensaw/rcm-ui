import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { Link } from './Link';

const meta = {
  title: 'Primitives/Link',
  component: Link,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle', 'destructive'],
    },
  },
  args: { to: '/cases', children: 'View all cases' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete account' },
};
export const InlineProse: Story = {
  render: () => (
    <p className="max-w-prose text-sm">
      For more information about claim filing, see the{' '}
      <Link to="/help/claims">claims documentation</Link>. If you need to delete
      a draft, visit your <Link to="/drafts">drafts page</Link>.
    </p>
  ),
};
