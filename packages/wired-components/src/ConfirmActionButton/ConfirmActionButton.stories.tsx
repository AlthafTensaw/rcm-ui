import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';

import { ConfirmActionButton } from './ConfirmActionButton';
import { withMockActions } from '../_storybook/MockActionsProvider';

const meta = {
  title: 'Wired/ConfirmActionButton',
  component: ConfirmActionButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'claim.delete',
          kind: 'mutation',
          endpoint: 'DELETE /api/v1/claims/{claimId}',
          request: z.object({ claimId: z.string() }),
          response: z.object({ deleted: z.boolean() }),
        },
      ],
      responses: { 'claim.delete': { deleted: true } },
    }),
  ],
} satisfies Meta<typeof ConfirmActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actionId: 'claim.delete',
    request: { claimId: 'c-1234' },
    confirmTitle: 'Delete claim?',
    confirmDescription: 'This cannot be undone.',
    children: 'Delete',
  },
};

export const Destructive: Story = {
  args: {
    actionId: 'claim.delete',
    request: { claimId: 'c-1234' },
    variant: 'destructive',
    confirmVariant: 'destructive',
    confirmTitle: 'Permanently delete claim?',
    confirmDescription:
      'This will remove the claim from all reports. The action cannot be reversed.',
    confirmLabel: 'Yes, delete',
    cancelLabel: 'Keep it',
    children: 'Delete claim',
  },
};

export const WithSuccessToast: Story = {
  args: {
    actionId: 'claim.delete',
    request: { claimId: 'c-1234' },
    confirmTitle: 'Delete?',
    confirmDescription: 'No undo.',
    toastOnSuccess: 'Claim deleted',
    children: 'Delete',
  },
};
