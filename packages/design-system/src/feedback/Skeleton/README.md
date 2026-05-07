# Skeleton

A shape-preserving placeholder for content that's loading. Use when the
shape of the loaded content is roughly predictable.

## Usage

```tsx
import { Skeleton } from '@tensaw/design-system';

<Skeleton width={280} height={32} />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="text" width="60%" />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `width` | `string \| number` | — | CSS width |
| `height` | `string \| number` | — | CSS height |
| `variant` | `'rectangular' \| 'circular' \| 'text'` | `'rectangular'` | Shape |

`variant="text"` defaults to a 1em-tall rectangle with rounded corners.

## Accessibility

- Decorative; rendered with `aria-hidden="true"`
- The container should set `aria-busy="true"` while skeletons are showing
  — `<DataExplorer>` and similar components handle this for you

## Related

- `<Spinner>` — for unknown content shape
- `<DataExplorer loading>` — uses Skeleton internally

## Anti-patterns

- ❌ **Don't** wrap user-controllable content in Skeleton-like shapes
  during interaction. It looks like loading; use disabled state instead.
