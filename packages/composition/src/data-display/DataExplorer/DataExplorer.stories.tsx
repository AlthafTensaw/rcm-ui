import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';

import { DataExplorer } from './DataExplorer';
import type { SchemaDataGridColumn } from '../../grids';
import { Badge } from '@tensaw/design-system/feedback';

interface ClaimRow {
  id: string;
  patient: string;
  payer: string;
  amount: number;
  status: 'open' | 'submitted' | 'paid' | 'denied';
  filedAt: string;
}

const seed: ClaimRow[] = Array.from({ length: 137 }, (_, i) => ({
  id: `c-${1000 + i}`,
  patient: ['Jane Doe', 'John Smith', 'Aisha Khan', 'Mei Tan', 'Carlos Rey'][i % 5]!,
  payer: ['Aetna', 'Medicare', 'BCBS', 'Cigna', 'United'][i % 5]!,
  amount: 100 + ((i * 17) % 4000),
  status: (['open', 'submitted', 'paid', 'denied'] as const)[i % 4]!,
  filedAt: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
}));

const columns: SchemaDataGridColumn<ClaimRow>[] = [
  { id: 'patient', header: 'Patient', accessorKey: 'patient', required: true },
  { id: 'payer', header: 'Payer', accessorKey: 'payer' },
  {
    id: 'amount',
    header: 'Amount',
    accessor: (r) => `$${r.amount.toLocaleString()}`,
  },
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
  { id: 'filedAt', header: 'Filed', accessorKey: 'filedAt' },
];

const meta = {
  title: 'Data Display/DataExplorer',
  component: DataExplorer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DataExplorer<ClaimRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Partial<React.ComponentProps<typeof DataExplorer<ClaimRow>>>,
): JSX.Element {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return seed;
    const q = search.toLowerCase();
    return seed.filter(
      (r) =>
        r.patient.toLowerCase().includes(q) ||
        r.payer.toLowerCase().includes(q) ||
        r.status.includes(q),
    );
  }, [search]);

  const visible = filtered.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  return (
    <div className="h-screen p-4">
      <DataExplorer<ClaimRow>
        rows={visible}
        columns={columns}
        totalRows={filtered.length}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPageIndex(0);
        }}
        searchValue={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPageIndex(0);
        }}
        searchPlaceholder="Search claims…"
        {...props}
      />
    </div>
  );
}

export const Default: Story = { render: () => <Wrapper /> };

export const Loading: Story = {
  render: () => <Wrapper loading rows={[]} />,
};

export const Empty: Story = { render: () => <Wrapper rows={[]} /> };

export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <Wrapper
      error={{
        message: 'Could not load claims.',
        onRetry: () => { console.log('retry'); },
      }}
    />
  ),
};
