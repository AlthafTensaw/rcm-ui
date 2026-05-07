import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@tensaw/design-system';
import { z } from 'zod';

import { ActionMenu } from './ActionMenu';
import { Button } from '@tensaw/design-system';
import { withMockActions } from '../_storybook/MockActionsProvider';

const meta = {
  title: 'Wired/ActionMenu',
  component: ActionMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'claim.edit',
          kind: 'mutation',
          endpoint: 'PATCH /api/v1/claims/{claimId}',
          request: z.object({ claimId: z.string() }),
          response: z.object({ ok: z.boolean() }),
        },
        {
          actionId: 'claim.duplicate',
          kind: 'mutation',
          endpoint: 'POST /api/v1/claims/{claimId}/duplicate',
          request: z.object({ claimId: z.string() }),
          response: z.object({ newClaimId: z.string() }),
        },
        {
          actionId: 'claim.delete',
          kind: 'mutation',
          endpoint: 'DELETE /api/v1/claims/{claimId}',
          request: z.object({ claimId: z.string() }),
          response: z.object({ deleted: z.boolean() }),
        },
      ],
      responses: {
        'claim.edit': { ok: true },
        'claim.duplicate': { newClaimId: 'c-9999' },
        'claim.delete': { deleted: true },
      },
    }),
  ],
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <Button>Actions</Button>,
    items: [
      {
        actionId: 'claim.edit',
        request: { claimId: 'c-1234' },
        label: 'Edit',
        icon: <Icon name="Pencil" size="sm" aria-hidden />,
      },
      {
        actionId: 'claim.duplicate',
        request: { claimId: 'c-1234' },
        label: 'Duplicate',
        icon: <Icon name="Copy" size="sm" aria-hidden />,
      },
      {
        actionId: 'claim.delete',
        request: { claimId: 'c-1234' },
        label: 'Delete',
        icon: <Icon name="Trash2" size="sm" aria-hidden />,
        variant: 'destructive',
      },
    ],
  },
};

export const WithConfirmGate: Story = {
  args: {
    trigger: <Button variant="outline">Actions</Button>,
    items: [
      {
        actionId: 'claim.edit',
        request: { claimId: 'c-1234' },
        label: 'Edit',
      },
      {
        actionId: 'claim.delete',
        request: { claimId: 'c-1234' },
        label: 'Delete',
        variant: 'destructive',
        confirmBefore: {
          title: 'Delete claim?',
          description: 'No undo.',
        },
      },
    ],
  },
};
