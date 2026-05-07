/**
 * DataExplorerWired — `<DataExplorer>` that fetches its own data via an action.
 *
 * Consumers pass an `actionId` (a query-kind action) and a static `request`
 * shape; the component manages local state for pagination, sort, search,
 * density, column visibility, and selection. On every state change it
 * rebuilds the request as `{ ...request, offset, limit, sort, search }`
 * and calls `useActionQuery(actionId, builtRequest)`.
 *
 * `selectRows` and `selectTotal` map the response envelope's `data` to the
 * row array and total count respectively. This keeps the component agnostic
 * to your API's response shape (some return `{ rows, totalCount }`,
 * others `{ items, total }`, etc.).
 *
 * Pagination is 0-indexed everywhere — matches `<DataExplorer>` and matches
 * the spec.
 */
import { useMemo, useState } from 'react';
import {
  DataExplorer,
  type DataExplorerProps,
} from '@tensaw/composition/data-display';
import { useActionQuery } from '@tensaw/actions';
import type {
  GridSortState,
  SchemaDataGridColumn,
} from '@tensaw/composition/grids';

export interface DataExplorerWiredProps<TRow, TRequest extends object>
  extends Omit<
    DataExplorerProps<TRow>,
    | 'rows'
    | 'totalRows'
    | 'loading'
    | 'error'
    | 'pageIndex'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sort'
    | 'onSortChange'
    | 'searchValue'
    | 'onSearchChange'
    | 'columns'
  > {
  actionId: string;
  request: Omit<TRequest, 'offset' | 'limit' | 'sort' | 'search'>;
  initialPageSize?: number;
  initialSort?: GridSortState;
  selectRows: (data: unknown) => TRow[];
  selectTotal: (data: unknown) => number;
  columns: SchemaDataGridColumn<TRow>[];
}

export function DataExplorerWired<TRow, TRequest extends object>({
  actionId,
  request,
  initialPageSize = 25,
  initialSort,
  selectRows,
  selectTotal,
  columns,
  ...rest
}: DataExplorerWiredProps<TRow, TRequest>): JSX.Element {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<GridSortState | null>(initialSort ?? null);
  const [search, setSearch] = useState('');

  const builtRequest = useMemo(
    () => ({
      ...request,
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: sort
        ? `${sort.columnId}:${sort.direction}`
        : undefined,
      search: search || undefined,
    }),
    [request, pageIndex, pageSize, sort, search],
  );

  const { data, isLoading, error, refetch } = useActionQuery(
    actionId,
    builtRequest,
  );

  const rows = useMemo<TRow[]>(
    () => (data === undefined ? [] : selectRows(data)),
    [data, selectRows],
  );
  const totalRows = useMemo<number>(
    () => (data === undefined ? 0 : selectTotal(data)),
    [data, selectTotal],
  );

  return (
    <DataExplorer<TRow>
      {...rest}
      columns={columns}
      rows={rows}
      totalRows={totalRows}
      loading={isLoading}
      {...(error
        ? {
            error: {
              message: error.message,
              onRetry: () => void refetch(),
            },
          }
        : {})}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={setPageIndex}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPageIndex(0);
      }}
      sort={sort}
      onSortChange={setSort}
      searchValue={search}
      onSearchChange={(s) => {
        setSearch(s);
        setPageIndex(0);
      }}
    />
  );
}
DataExplorerWired.displayName = 'DataExplorerWired';
