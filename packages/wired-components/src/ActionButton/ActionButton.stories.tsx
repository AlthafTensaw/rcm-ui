import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';

import { ActionButton } from './ActionButton';
import { withMockActions } from '../_storybook/MockActionsProvider';

const meta = {
  title: 'Wired/ActionButton',
  component: ActionButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'claim.retry',
          kind: 'mutation',
          endpoint: 'POST /api/v1/claims/{claimId}/retry',
          request: z.object({ claimId: z.string() }),
          response: z.object({ ok: z.boolean() }),
        },
      ],
      responses: { 'claim.retry': { ok: true } },
    }),
  ],
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actionId: 'claim.retry',
    request: { claimId: 'c-1234' },
    children: 'Retry claim',
  },
};

export const WithSuccessToast: Story = {
  args: {
    actionId: 'claim.retry',
    request: { claimId: 'c-1234' },
    toastOnSuccess: 'Claim resubmitted',
    children: 'Retry claim',
  },
};

export const Destructive: Story = {
  args: {
    actionId: 'claim.retry',
    request: { claimId: 'c-1234' },
    variant: 'destructive',
    children: 'Force retry',
  },
};
