import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { z } from 'zod';

import { ActionLink } from './ActionLink';
import { withMockActions } from '../_storybook/MockActionsProvider';

const meta = {
  title: 'Wired/ActionLink',
  component: ActionLink,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
    withMockActions({
      actions: [
        {
          actionId: 'case.open-detail',
          kind: 'navigate',
          request: z.object({ caseId: z.string() }),
          to: (a) => `/cases/${a.caseId}`,
        },
      ],
    }),
  ],
} satisfies Meta<typeof ActionLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actionId: 'case.open-detail',
    request: { caseId: 'c-42' },
    children: 'Open case',
  },
};

export const Subtle: Story = {
  args: {
    actionId: 'case.open-detail',
    request: { caseId: 'c-42' },
    variant: 'subtle',
    children: 'Open case',
  },
};

export const InProse: Story = {
  render: (args) => (
    <p className="max-w-prose text-sm">
      Click <ActionLink {...args}>here</ActionLink> to view the case detail.
    </p>
  ),
  args: {
    actionId: 'case.open-detail',
    request: { caseId: 'c-42' },
    children: 'here',
  },
};
