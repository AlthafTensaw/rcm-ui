import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { z } from 'zod';

import { CommandPaletteWired } from './CommandPaletteWired';
import { Button } from '@tensaw/design-system';
import { withMockActions } from '../_storybook/MockActionsProvider';

const meta = {
  title: 'Wired/CommandPaletteWired',
  component: CommandPaletteWired,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'claim.retry',
          kind: 'mutation',
          endpoint: 'POST /api/v1/claims/retry',
          request: z.object({}),
          response: z.object({ ok: z.boolean() }),
          description: 'Retry pending claim',
        },
        {
          actionId: 'claim.delete',
          kind: 'mutation',
          endpoint: 'DELETE /api/v1/claims',
          request: z.object({}),
          response: z.object({ ok: z.boolean() }),
          description: 'Delete claim',
        },
        {
          actionId: 'admin.list-cases',
          kind: 'query',
          endpoint: 'GET /api/v1/cases',
          request: z.object({}),
          response: z.object({ rows: z.array(z.unknown()) }),
          description: 'List all cases',
        },
        {
          actionId: 'admin.export-report',
          kind: 'mutation',
          endpoint: 'POST /api/v1/reports/export',
          request: z.object({}),
          response: z.object({ url: z.string() }),
          description: 'Export current report',
        },
      ],
      responses: {
        'claim.retry': { ok: true },
        'claim.delete': { ok: true },
        'admin.list-cases': { rows: [] },
        'admin.export-report': { url: '/exports/x.csv' },
      },
    }),
  ],
} satisfies Meta<typeof CommandPaletteWired>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => { setOpen(true); }}>Open palette (⌘K)</Button>
        <CommandPaletteWired open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const WithExtraGroups: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => { setOpen(true); }}>Open palette</Button>
        <CommandPaletteWired
          open={open}
          onOpenChange={setOpen}
          extraGroups={[
            {
              label: 'Recent',
              items: [
                {
                  id: 'recent-1',
                  label: 'Recent: Case 12345',
                  onSelect: () => { setOpen(false); },
                },
                {
                  id: 'recent-2',
                  label: 'Recent: Patient Jane Doe',
                  onSelect: () => { setOpen(false); },
                },
              ],
            },
          ]}
        />
      </>
    );
  },
};
