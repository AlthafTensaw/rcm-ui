# Badge

A small label with semantic color for status, counts, or category tags.

## Usage

```tsx
import { Badge } from '@tensaw/design-system';

<Badge>New</Badge>
<Badge variant="success">Paid</Badge>
<Badge variant="destructive">Denied</Badge>
<Badge icon={<Check size={12} />}>Posted</Badge>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'secondary' \| 'success' \| 'warning' \| 'destructive' \| 'info' \| 'outline'` | `'default'` | Color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sizing |
| `icon` | `ReactNode` | — | Leading icon |

## Variants

- **success**: Green — completed, paid, posted
- **warning**: Amber — pending, draft, attention
- **destructive**: Red — denied, error, void
- **info**: Blue — filed, scheduled
- **outline**: Bordered, neutral
- **secondary**: Filled, neutral

## Accessibility

- Renders as `<span>`; semantic color alone is not announced — pair with
  text content, not just icon

## Related

- `<Pill>` — removable filter chips
- `<Alert>` — persistent inline notifications

## Anti-patterns

- ❌ **Don't** use Badge as a button. Add a `role="button"` Pill or use
  ActionMenu instead.
- ❌ **Don't** rely on color alone. Variant is decoration; the visible
  text carries the meaning.
