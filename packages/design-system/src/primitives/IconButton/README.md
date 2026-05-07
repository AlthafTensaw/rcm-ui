# IconButton

A square button that renders an icon and nothing else. Always requires
`aria-label` — the type contract enforces it.

Use whenever the click target is icon-only (toolbars, table-row actions,
overflow menus).

## Usage

```tsx
import { IconButton } from '@tensaw/design-system';
import { Trash2 } from 'lucide-react';

<IconButton aria-label="Delete claim" icon={<Trash2 size={16} />} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `aria-label` | `string` | **required** | Accessible name |
| `icon` | `ReactNode` | **required** | Icon to render |
| `variant` | same as `<Button>` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sizing |
| `loading` | `boolean` | `false` | Shows spinner |
| `disabled` | `boolean` | `false` | Disables interaction |

All other native button props pass through.

## Sizes

- **sm**: 32px square
- **md**: 36px square (matches Button `md`)
- **lg**: 40px square

## Accessibility

- `aria-label` is **type-required** — TypeScript errors if omitted
- Same focus-ring + keyboard semantics as `<Button>`
- When loading, the icon is replaced by a spinner; `aria-busy="true"` is set

## Related

- `<Button>` — for buttons with visible text labels (or icon + text)
- `<Tooltip>` + `<IconButton>` — to add a hover-discoverable label

## Anti-patterns

- ❌ **Don't** rely on a tooltip alone for labelling. Tooltip is
  supplementary; `aria-label` is the screen-reader name.
- ❌ **Don't** use IconButton for primary CTAs — the icon-only semantics
  obscure the most important action on a page.
