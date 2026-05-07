import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';
import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
} from '@tensaw/actions';
import {
  resetAllStoresForTesting,
  useAuthStore,
} from '@tensaw/runtime';
import type { SchemaDataGridColumn } from '@tensaw/composition/grids';

import { DataExplorerWired } from './DataExplorerWired';

// --- Test harness --------------------------------------------------------
function signIn(): void {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u1',
      username: 'u1',
      email: 'u1@example.com',
      fullName: 'User One',
      roles: [],
      permissions: [],
      clinicIds: ['c1'],
    },
    clinicId: 'c1',
  });
}
function envelope<T>(data: T) {
  return {
    success: true as const,
    data,
    meta: { correlationId: 'cor-1', timestamp: '2026-01-01T00:00:00Z' },
  };
}
function errorEnvelope(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
    meta: { correlationId: 'cor-1', timestamp: '2026-01-01T00:00:00Z' },
  };
}
function mockFetchAlways(response: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

interface Row {
  id: string;
  name: string;
  status: string;
}

const sampleColumns: SchemaDataGridColumn<Row>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', required: true },
  { id: 'status', header: 'Status', accessorKey: 'status' },
];

const listSchema = z.object({
  state_code: z.string(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
});

function defineListCases() {
  defineAction({
    actionId: 'admin.list-cases',
    kind: 'query',
    endpoint: 'GET /api/v1/cases',
    request: listSchema,
    response: z.object({
      rows: z.array(z.object({ id: z.string(), name: z.string(), status: z.string() })),
      totalCount: z.number(),
    }),
    cache: { tag: 'cases-list' },
  });
}

const selectRows = (data: unknown): Row[] =>
  (data as { rows: Row[] }).rows;
const selectTotal = (data: unknown): number =>
  (data as { totalCount: number }).totalCount;

beforeEach(() => {
  resetAllStoresForTesting();
  _clearActionRegistry();
  _clearActionCache();
  signIn();
});
afterEach(() => {
  vi.unstubAllGlobals();
  _clearActionRegistry();
  _clearActionCache();
});

// --- Tests ---------------------------------------------------------------

describe('DataExplorerWired — fetches and renders rows', () => {
  it('renders rows from selectRows after fetch', async () => {
    defineListCases();
    mockFetchAlways(
      envelope({
        rows: [
          { id: 'r1', name: 'Apple', status: 'open' },
          { id: 'r2', name: 'Banana', status: 'closed' },
        ],
        totalCount: 2,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    expect(await screen.findByText('Apple')).toBeDefined();
    expect(screen.getByText('Banana')).toBeDefined();
  });

  it('forwards totalRows from selectTotal to Pagination', async () => {
    defineListCases();
    mockFetchAlways(
      envelope({
        rows: [{ id: 'r1', name: 'Apple', status: 'open' }],
        totalCount: 137,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    expect(await screen.findByText(/of 137/)).toBeDefined();
  });
});

describe('DataExplorerWired — request building', () => {
  it('builds request with offset/limit on first fetch', async () => {
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({ rows: [], totalCount: 0 }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        initialPageSize={50}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('offset=0');
    expect(url).toContain('limit=50');
    expect(url).toContain('state_code=DRAFTING');
  });

  it('serializes sort as `${columnId}:${direction}`', async () => {
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({ rows: [], totalCount: 0 }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        initialSort={{ columnId: 'name', direction: 'desc' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('sort=name%3Adesc');
  });

  it('omits sort param when no sort set', async () => {
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({ rows: [], totalCount: 0 }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).not.toContain('sort=');
  });
});

describe('DataExplorerWired — pagination interactions', () => {
  it('clicking next page bumps offset', async () => {
    const user = userEvent.setup();
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({
        rows: Array.from({ length: 25 }, (_, i) => ({
          id: `r${i}`,
          name: `Row ${i}`,
          status: 'open',
        })),
        totalCount: 100,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        initialPageSize={25}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    fetchMock.mockClear();

    await user.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('offset=25');
  });
});

describe('DataExplorerWired — error path', () => {
  it('shows error alert with retry when query fails', async () => {
    defineListCases();
    mockFetchAlways(errorEnvelope('SERVER_ERROR', 'kaboom'), 500);
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    expect(await screen.findByText(/kaboom/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('retry button refetches', async () => {
    const user = userEvent.setup();
    defineListCases();
    const fetchMock = mockFetchAlways(
      errorEnvelope('SERVER_ERROR', 'first error'),
      500,
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await screen.findByText(/first error/i);
    fetchMock.mockClear();
    // Subsequent fetches succeed.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          envelope({ rows: [{ id: 'r1', name: 'OK', status: 'fixed' }], totalCount: 1 }),
        ),
    });
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
  });
});

describe('DataExplorerWired — search', () => {
  it('typing in search forwards through to the request after debounce', async () => {
    const user = userEvent.setup();
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({ rows: [], totalCount: 0 }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
        searchPlaceholder="Find"
        searchDebounceMs={50}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    fetchMock.mockClear();

    await user.type(screen.getByPlaceholderText('Find'), 'apple');
    await waitFor(() => {
      const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0] as string | undefined;
      expect(lastCallUrl ?? '').toContain('search=apple');
    });
  });

  it('changing search resets pageIndex to 0', async () => {
    const user = userEvent.setup();
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({
        rows: Array.from({ length: 25 }, (_, i) => ({
          id: `r${i}`,
          name: `Row ${i}`,
          status: 'open',
        })),
        totalCount: 100,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        initialPageSize={25}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
        searchPlaceholder="Find"
        searchDebounceMs={20}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    // Move to page 2.
    await user.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      const url = fetchMock.mock.calls.at(-1)?.[0] as string;
      expect(url).toContain('offset=25');
    });
    fetchMock.mockClear();
    // Now type into search — should reset offset to 0.
    await user.type(screen.getByPlaceholderText('Find'), 'x');
    await waitFor(() => {
      const url = fetchMock.mock.calls.at(-1)?.[0] as string;
      expect(url).toContain('offset=0');
    });
  });
});

describe('DataExplorerWired — columns forwarding', () => {
  it('renders the columns prop in the grid header', async () => {
    defineListCases();
    mockFetchAlways(
      envelope({
        rows: [{ id: 'r1', name: 'Apple', status: 'open' }],
        totalCount: 1,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await screen.findByText('Apple');
    // Grid headers visible
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });
});

describe('DataExplorerWired — page-size change resets pageIndex', () => {
  it('changing page size sends offset=0 (resets to first page)', async () => {
    const user = userEvent.setup();
    defineListCases();
    const fetchMock = mockFetchAlways(
      envelope({
        rows: Array.from({ length: 25 }, (_, i) => ({
          id: `r${i}`,
          name: `Row ${i}`,
          status: 'open',
        })),
        totalCount: 1000,
      }),
    );
    render(
      <DataExplorerWired<Row, { state_code: string }>
        actionId="admin.list-cases"
        request={{ state_code: 'DRAFTING' }}
        initialPageSize={25}
        columns={sampleColumns}
        selectRows={selectRows}
        selectTotal={selectTotal}
      />,
    );
    await waitFor(() => { expect(fetchMock).toHaveBeenCalled(); });
    // Move to page 2.
    await user.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      const u = fetchMock.mock.calls.at(-1)?.[0] as string;
      expect(u).toContain('offset=25');
    });
    fetchMock.mockClear();
    // Change page size via the Pagination's Select. Use Radix combobox interaction.
    const sizeCombo = screen.getByRole('combobox', { name: 'Rows per page' });
    await user.click(sizeCombo);
    const opt100 = await screen.findByRole('option', { name: /100/ });
    await act(async () => {
      await user.click(opt100);
    });
    await waitFor(() => {
      const u = fetchMock.mock.calls.at(-1)?.[0] as string;
      expect(u).toContain('limit=100');
      expect(u).toContain('offset=0');
    });
  });
});
