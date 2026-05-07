# Popover

A small anchored panel that opens beside its trigger. Non-modal — the
underlying page is still interactive. Use for filter chips, settings
panels, and contextual edits.

## Usage

```tsx
import { Popover } from '@tensaw/design-system';

<Popover trigger={<Button>Filters</Button>}>
  <FilterForm />
</Popover>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `trigger` | `ReactNode` | **required** | The element that toggles the popover |
| `children` | `ReactNode` | **required** | Popover content |
| `open` / `onOpenChange` | controlled | — | Optional control; uncontrolled if both omitted |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred side |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment |
| `sideOffset` | `number` | `8` | Gap from trigger (px) |

Built on Radix's Popover primitive.

## Accessibility

- Focus moves into the popover on open; returns to trigger on close
- Escape closes
- Click outside closes

## Related

- `<DropdownMenu>` — for menu-style item lists
- `<Dialog>` — when modality is needed
- `<Tooltip>` — for read-only hover hints

## Anti-patterns

- ❌ **Don't** put complex forms in a Popover. Use Drawer or Dialog.
- ❌ **Don't** combine Popover with Tooltip on the same trigger. The
  hover behaviors fight; pick one.
