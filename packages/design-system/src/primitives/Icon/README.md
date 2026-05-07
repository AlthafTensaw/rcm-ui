# Icon

A typed wrapper around `lucide-react` exposing a curated set of common
icons. Use for buttons, indicators, and inline glyphs.

## Usage

```tsx
import { Icon } from '@tensaw/design-system';

<Icon name="Search" />
<Icon name="CircleCheck" size="lg" />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `name` | `IconName` | **required** | Curated icon name (autocompletes) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Pixel sizes 12 / 14 / 16 / 20 / 24 |
| `aria-label` | `string` | — | Accessible name; without it the icon is treated as decorative |

The exposed icon set is a deliberately small subset of Lucide's catalog.
Adding a new icon is a one-line change in `Icon.tsx`.

## Accessibility

- Decorative by default (`aria-hidden="true"` when no `aria-label`)
- Set `aria-label` only when the icon stands on its own without text
- Inside a Button or IconButton, the surrounding control owns the label;
  the icon stays decorative

## Related

- `<Avatar>` — for person/entity images
- Lucide directly — when you need an icon outside the curated set

## Anti-patterns

- ❌ **Don't** import directly from `lucide-react` in app code. Add to
  the Icon component's curated list so the design system stays the seam.
- ❌ **Don't** rely on icons alone for semantic meaning in dense UIs.
  Pair with text or use Tooltip for hover discovery.
