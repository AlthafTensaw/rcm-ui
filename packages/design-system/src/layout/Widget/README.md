# Widget

A self-contained, often self-fetching, dashboard panel. Wraps a Card with
lifecycle hooks (visibility, refresh, instance ID) so the inner content
can react to dashboard-level events.

## Usage

```tsx
import { Widget } from '@tensaw/design-system';

<Widget
  title="Open claims"
  description="Updated 1 minute ago"
  toolbar={<IconButton aria-label="Refresh" icon={<RotateCcw size={16} />} />}
  loading={isLoading}
  error={error}
  onRetry={refetch}
>
  <ClaimsList rows={data?.rows ?? []} />
</Widget>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | Header title |
| `description` | `ReactNode` | — | Subtitle |
| `toolbar` | `ReactNode` | — | Right-aligned actions in the header |
| `footer` | `ReactNode` | — | Footer content |
| `loading` | `boolean` | `false` | Renders Skeleton while true |
| `error` | `Error \| null` | `null` | Renders error state with retry button |
| `onRetry` | `() => void` | — | Click handler for retry on error |
| `lifecycleContext` | `WidgetLifecycleContext` | — | Dashboard-provided context (visibility events, refresh signals) |

## Accessibility

- Title is a heading; toolbar buttons keep their own labels
- Loading state announces via Skeleton (`aria-busy="true"`)
- Error state announces via `role="alert"`

## Related

- `<Card>` — when you don't need lifecycle integration
- `<DataExplorerWired>` — full-featured table widget with built-in fetch

## Anti-patterns

- ❌ **Don't** wire data fetching directly inside Widget body. Either
  pass `loading`/`error`/data from parent, or use `lifecycleContext`'s
  refresh signal to trigger refetch.
- ❌ **Don't** put forms in Widgets. Widgets are read-mostly; use Card.
