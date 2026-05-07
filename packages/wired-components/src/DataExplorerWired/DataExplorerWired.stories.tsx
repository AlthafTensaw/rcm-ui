import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';

import { DataExplorerWired } from './DataExplorerWired';
import type { SchemaDataGridColumn } from '@tensaw/composition/grids';
import { Badge } from '@tensaw/design-system';
import { withMockActions } from '../_storybook/MockActionsProvider';

interface Row {
  id: string;
  patient: string;
  payer: string;
  status: 'open' | 'submitted' | 'paid' | 'denied';
  amount: number;
}

const sampleRows: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: `c-${1000 + i}`,
  patient: ['Jane Doe', 'John Smith', 'Aisha Khan', 'Mei Tan'][i % 4]!,
  payer: ['Aetna', 'Medicare', 'BCBS', 'Cigna'][i % 4]!,
  status: (['open', 'submitted', 'paid', 'denied'] as const)[i % 4]!,
  amount: 250 + ((i * 31) % 3500),
}));

const columns: SchemaDataGridColumn<Row>[] = [
  { id: 'patient', header: 'Patient', accessorKey: 'patient', required: true },
  { id: 'payer', header: 'Payer', accessorKey: 'payer' },
  {
    id: 'status',
    header: 'Status',
    accessor: (r) => {
      const map = {
        open: 'secondary',
        submitted: 'info',
        paid: 'success',
        denied: 'destructive',
      } as const;
      return <Badge variant={map[r.status]}>{r.status}</Badge>;
    },
  },
  {
    id: 'amount',
    header: 'Amount',
    accessor: (r) => `$${r.amount.toLocaleString()}`,
  },
];

const meta = {
  title: 'Wired/DataExplorerWired',
  component: DataExplorerWired,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    withMockActions({
      actions: [
        {
          actionId: 'admin.list-claims',
          kind: 'query',
          endpoint: 'GET /api/v1/claims',
          request: z.object({
            state: z.string().optional(),
            offset: z.number().optional(),
            limit: z.number().optional(),
            sort: z.string().optional(),
            search: z.string().optional(),
          }),
          response: z.object({
            rows: z.array(z.unknown()),
            totalCount: z.number(),
          }),
          cache: { tag: 'claims-list' },
        },
      ],
      responses: {
        'admin.list-claims': {
          rows: sampleRows.slice(0, 25),
          totalCount: sampleRows.length,
        },
      },
    }),
  ],
} satisfies Meta<typeof DataExplorerWired>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen p-4">
      <DataExplorerWired<Row, { state?: string }>
        actionId="admin.list-claims"
        request={{ state: 'OPEN' }}
        columns={columns}
        selectRows={(d) => (d as { rows: Row[] }).rows}
        selectTotal={(d) => (d as { totalCount: number }).totalCount}
        searchPlaceholder="Search claims…"
      />
    </div>
  ),
};
