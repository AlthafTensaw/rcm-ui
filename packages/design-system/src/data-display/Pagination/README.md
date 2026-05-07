# Pagination

Standalone pagination controls. Use when you have a paginated dataset
that doesn't ship its own controls (e.g., a custom list).

For tables, prefer `<DataExplorer>` or `<DataExplorerWired>` which include
pagination internally.

## Usage

```tsx
import { Pagination } from '@tensaw/design-system';

<Pagination
  page={currentPage}
  pageSize={25}
  total={482}
  onPageChange={setCurrentPage}
/>

<Pagination
  page={page}
  pageSize={pageSize}
  total={total}
  pageSizeOptions={[10, 25, 50, 100]}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `page` | `number` | **required** | Current page (1-indexed) |
| `pageSize` | `number` | **required** | Items per page |
| `total` | `number` | **required** | Total items across all pages |
| `onPageChange` | `(page) => void` | **required** | Fires on prev/next/jump |
| `onPageSizeChange` | `(size) => void` | — | If provided, renders page-size select |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Options for the size select |
| `siblingCount` | `number` | `1` | How many page numbers around current to show |
| `showFirstLast` | `boolean` | `true` | Show first / last buttons |

## Accessibility

- `<nav aria-label="Pagination">` semantics
- Current page marked with `aria-current="page"`
- Disabled prev/next when at boundary
- Page-size select is a real `<Select>` with proper labelling

## Related

- `<DataExplorer>` / `<DataExplorerWired>` — full table with built-in pagination

## Anti-patterns

- ❌ **Don't** show Pagination when the list is short (< 1 page). Render
  nothing, not "Page 1 of 1."
- ❌ **Don't** use Pagination for infinite scroll. Different paradigm —
  build custom logic with `IntersectionObserver`.
