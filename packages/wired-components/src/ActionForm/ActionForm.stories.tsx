import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';

import { ActionForm } from './ActionForm';
import { Button, FormField, Input } from '@tensaw/design-system';
import { withMockActions } from '../_storybook/MockActionsProvider';

const claimSchema = z.object({
  patientName: z.string().min(1, 'Required'),
  payer: z.string().min(1, 'Required'),
});
type ClaimRequest = z.infer<typeof claimSchema>;

const meta = {
  title: 'Wired/ActionForm',
  component: ActionForm,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'claim.create',
          kind: 'mutation',
          endpoint: 'POST /api/v1/claims',
          request: claimSchema,
          response: z.object({ claimId: z.string() }),
        },
      ],
      responses: { 'claim.create': { claimId: 'c-9999' } },
    }),
  ],
} satisfies Meta<typeof ActionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SchemaValidated: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <ActionForm<ClaimRequest, { claimId: string }>
        actionId="claim.create"
        schema={claimSchema}
        defaultValues={{ patientName: '', payer: '' }}
        toastOnSuccess="Claim created"
      >
        <FormField name="patientName" label="Patient name" required>
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <FormField name="payer" label="Payer" required>
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <Button type="submit" className="mt-2">
          Create claim
        </Button>
      </ActionForm>
    </div>
  ),
};
