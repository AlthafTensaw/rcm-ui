# Spinner

A circular loading indicator for unknown-duration operations.

## Usage

```tsx
import { Spinner } from '@tensaw/design-system';

<Spinner />
<Spinner size="lg" />
<Spinner variant="inverted" />  {/* on dark backgrounds */}
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Pixel sizes 12 / 16 / 20 / 24 / 32 |
| `variant` | `'default' \| 'inverted'` | `'default'` | `default` inherits text color; `inverted` is white |
| `loadingLabel` | `string` | `'Loading'` | Screen-reader announcement |

## Accessibility

- `role="status"` with `<span class="sr-only">{loadingLabel}</span>`
- Animation respects `prefers-reduced-motion`

## Related

- `<Skeleton>` — for shape-preserving placeholders
- `<Button loading>` — uses Spinner internally

## Anti-patterns

- ❌ **Don't** use a giant Spinner as a full-page loader. Use Skeleton
  for the page shape so users see what's coming.
