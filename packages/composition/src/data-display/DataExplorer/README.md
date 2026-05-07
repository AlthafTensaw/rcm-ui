# DataExplorer

A presentational data table with sorting, pagination, search, and
selection. Lives in `@tensaw/composition` because it composes design-system
primitives with a schema-driven grid.

For self-fetching tables tied to a registered action, use
`<DataExplorerWired>` from `@tensaw/wired-components`.

## Usage

```tsx
import { DataExplorer } from '@tensaw/composition/data-display';

<DataExplorer<Claim>
  rows={claims}
  total={totalCount}
  columns={[
    { id: 'id', header: 'Claim #', accessor: (r) => r.id, sortable: true },
    { id: 'patient', header: 'Patient', accessor: (r) => r.patientName },
    { id: 'status', header: 'Status', cell: (r) => <Badge>{r.status}</Badge> },
  ]}
  page={page}
  pageSize={25}
  sort={{ columnId: 'id', direction: 'asc' }}
  search={searchQuery}
  loading={isLoading}
  empty={<EmptyState title="No claims" />}
  onPageChange={setPage}
  onSortChange={setSort}
  onSearchChange={setSearchQuery}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `rows` | `T[]` | **required** | Visible rows for current page |
| `total` | `number` | **required** | Total rows across all pages |
| `columns` | `Column<T>[]` | **required** | Schema-driven column definitions |
| `page` / `pageSize` | `number` | — | Pagination state |
| `sort` | `{ columnId, direction }` | — | Current sort |
| `search` | `string` | — | Current search query (debounced upstream) |
| `selection` | `Selection<T>` | — | Row selection state (when multi-select) |
| `loading` | `boolean` | `false` | Renders Skeleton rows |
| `empty` | `ReactNode` | — | Rendered when `rows` is empty and not loading |
| `onPageChange` / `onSortChange` / `onSearchChange` / `onSelectionChange` | callbacks | — | State change handlers |

Column shape: `{ id, header, accessor?, cell?, sortable?, width? }`. If
both `accessor` and `cell` are provided, `cell` wins for rendering and
`accessor` is used for sorting.

## Accessibility

- Renders a real `<table>` with proper header/row semantics
- Sort buttons announce current direction via `aria-sort`
- Selection checkboxes have descriptive labels
- Loading state announces via `aria-busy="true"`

## Related

- `<DataExplorerWired>` — auto-fetches via an action
- `<Pagination>` — standalone pagination
- `<SchemaDataGrid>` — schema-driven grid that DataExplorer composes

## Anti-patterns

- ❌ **Don't** wire data fetching inside DataExplorer. Pass `rows`,
  `total`, `loading`, `error` from the parent (or use Wired).
- ❌ **Don't** make every column sortable. Sort only on columns where the
  comparison is meaningful.
