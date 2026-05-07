import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SchemaDataGridColumn } from '../../grids';
import { DataExplorer } from './DataExplorer';

interface Row {
  id: string;
  name: string;
  status: string;
  amount: number;
}

const sampleColumns: SchemaDataGridColumn<Row>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', required: true },
  { id: 'status', header: 'Status', accessorKey: 'status' },
  { id: 'amount', header: 'Amount', accessorKey: 'amount' },
];

const sampleRows: Row[] = [
  { id: 'r1', name: 'Apple Inc', status: 'open', amount: 100 },
  { id: 'r2', name: 'Banana Co', status: 'closed', amount: 250 },
  { id: 'r3', name: 'Cherry LLC', status: 'open', amount: 75 },
];

function baseProps(overrides: Partial<Parameters<typeof DataExplorer<Row>>[0]> = {}): Parameters<typeof DataExplorer<Row>>[0] {
  return {
    rows: sampleRows,
    columns: sampleColumns,
    totalRows: 3,
    pageIndex: 0,
    pageSize: 25,
    onPageChange: vi.fn(),
    ...overrides,
  };
}

describe('DataExplorer — rendering', () => {
  it('renders aria-labelled section with rows', () => {
    render(<DataExplorer<Row> {...baseProps()} />);
    expect(
      screen.getByRole('region', { name: 'Data explorer' }),
    ).toBeDefined();
    expect(screen.getByText('Apple Inc')).toBeDefined();
    expect(screen.getByText('Banana Co')).toBeDefined();
    expect(screen.getByText('Cherry LLC')).toBeDefined();
  });

  it('renders the search input with placeholder', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        searchPlaceholder="Find anything"
      />,
    );
    expect(
      screen.getByPlaceholderText('Find anything'),
    ).toBeDefined();
  });

  it('renders pagination footer', () => {
    render(<DataExplorer<Row> {...baseProps()} totalRows={75} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeDefined();
  });

  it('renders the actions slot above search', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        actions={<button>Export</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeDefined();
  });

  it('renders the filters slot', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        filters={<span data-testid="filters">filter chips</span>}
      />,
    );
    expect(screen.getByTestId('filters')).toBeDefined();
  });
});

describe('DataExplorer — search debounce', () => {
  it('debounces onSearchChange', async () => {
    const onSearchChange = vi.fn();
    render(
      <DataExplorer<Row>
        {...baseProps()}
        searchPlaceholder="Search"
        onSearchChange={onSearchChange}
        searchDebounceMs={50}
      />,
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'apple' } });
    fireEvent.change(input, { target: { value: 'banana' } });
    // Hasn't fired yet (debounce window).
    expect(onSearchChange).not.toHaveBeenCalled();
    await waitFor(
      () => {
        expect(onSearchChange).toHaveBeenLastCalledWith('banana');
      },
      { timeout: 500 },
    );
  });

  it('does not call onSearchChange when not provided', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        searchPlaceholder="Search"
      />,
    );
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'x' } });
    // Should not throw
    expect(input.value).toBe('x');
  });
});

describe('DataExplorer — selection bridge', () => {
  it('reflects selectedIds via aria-selected on the grid rows', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        selectionMode="multi"
        selectedIds={['r1']}
        onSelectionChange={vi.fn()}
      />,
    );
    // SchemaDataGrid surfaces selection via aria-selected on <tr>, not via
    // a separate checkbox input.
    const selectedRows = document.querySelectorAll('tr[aria-selected="true"]');
    expect(selectedRows.length).toBe(1);
  });

  it('shows bulk actions row when rows selected', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        selectionMode="multi"
        selectedIds={['r1', 'r2']}
        onSelectionChange={vi.fn()}
        bulkActions={<button>Delete selected</button>}
      />,
    );
    expect(screen.getByText('2 rows selected')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Delete selected' }),
    ).toBeDefined();
  });

  it('singular vs plural in selection count label', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        selectionMode="multi"
        selectedIds={['r1']}
        onSelectionChange={vi.fn()}
        bulkActions={<button>X</button>}
      />,
    );
    expect(screen.getByText('1 row selected')).toBeDefined();
  });

  it('does not show bulk row when bulkActions not provided', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        selectionMode="multi"
        selectedIds={['r1']}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/selected/)).toBeNull();
  });
});

describe('DataExplorer — density', () => {
  it('renders density toggle when onDensityChange given', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('switch', { name: 'Compact density' }),
    ).toBeDefined();
  });

  it('omits density toggle when handler missing', () => {
    render(<DataExplorer<Row> {...baseProps()} />);
    expect(
      screen.queryByRole('switch', { name: 'Compact density' }),
    ).toBeNull();
  });

  it('fires onDensityChange when toggled', async () => {
    const user = userEvent.setup();
    const onDensityChange = vi.fn();
    render(
      <DataExplorer<Row>
        {...baseProps()}
        density="comfortable"
        onDensityChange={onDensityChange}
      />,
    );
    await user.click(screen.getByRole('switch', { name: 'Compact density' }));
    expect(onDensityChange).toHaveBeenCalledWith('compact');
  });
});

describe('DataExplorer — column visibility', () => {
  it('renders column-visibility menu when onHiddenColumnsChange given', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        hiddenColumns={[]}
        onHiddenColumnsChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Column visibility' }),
    ).toBeDefined();
  });

  it('omits the menu when handler missing', () => {
    render(<DataExplorer<Row> {...baseProps()} />);
    expect(
      screen.queryByRole('button', { name: 'Column visibility' }),
    ).toBeNull();
  });

  it('toggles a column on menu click', async () => {
    const user = userEvent.setup();
    const onHiddenColumnsChange = vi.fn();
    render(
      <DataExplorer<Row>
        {...baseProps()}
        hiddenColumns={[]}
        onHiddenColumnsChange={onHiddenColumnsChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Column visibility' }));
    // Required columns are excluded; "Status" and "Amount" remain. Scope to
    // the menu role to disambiguate from the grid's <th>Status</th>.
    const statusItem = await screen.findByRole('menuitem', { name: /Status/ });
    await user.click(statusItem);
    expect(onHiddenColumnsChange).toHaveBeenCalledWith(['status']);
  });
});

describe('DataExplorer — state shells', () => {
  it('renders error alert with retry button when error set', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <DataExplorer<Row>
        {...baseProps()}
        error={{ message: 'kaboom', onRetry }}
      />,
    );
    expect(screen.getByText('kaboom')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    // Pagination footer should not render in the error path.
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });

  it('renders skeleton rows when loading', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        rows={[]}
        totalRows={0}
        loading
      />,
    );
    // status region with the skeleton stack
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('renders empty state when no rows + empty given', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        rows={[]}
        totalRows={0}
        empty={{
          title: 'No claims',
          description: 'Nothing posted yet.',
          action: <button>Add</button>,
        }}
      />,
    );
    expect(screen.getByText('No claims')).toBeDefined();
    expect(screen.getByText('Nothing posted yet.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDefined();
  });

  it('error wins over loading and empty', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        rows={[]}
        totalRows={0}
        loading
        error={{ message: 'oops' }}
        empty={{ title: 'No data' }}
      />,
    );
    expect(screen.getByText('oops')).toBeDefined();
    expect(screen.queryByText('No data')).toBeNull();
  });
});

describe('DataExplorer — pagination wiring', () => {
  it('forwards onPageChange', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataExplorer<Row>
        {...baseProps()}
        totalRows={500}
        pageIndex={0}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('omits page-size selector when onPageSizeChange not provided', () => {
    render(<DataExplorer<Row> {...baseProps()} />);
    expect(
      screen.queryByRole('combobox', { name: 'Rows per page' }),
    ).toBeNull();
  });

  it('renders page-size selector when handler provided', () => {
    render(
      <DataExplorer<Row>
        {...baseProps()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Rows per page' }),
    ).toBeDefined();
  });
});
