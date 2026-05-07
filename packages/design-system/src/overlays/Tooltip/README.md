# Tooltip

A hover-discoverable text label. Read-only and supplementary by design.

## Usage

```tsx
import { Tooltip } from '@tensaw/design-system';

<Tooltip content="Saves the form">
  <Button>Save</Button>
</Tooltip>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `content` | `ReactNode` | **required** | Tooltip body |
| `children` | `ReactNode` | **required** | Trigger element (single child) |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Preferred side |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment |
| `delayDuration` | `number` | `400` | ms delay before showing on hover |
| `disabled` | `boolean` | `false` | Disable rendering (no tooltip shown) |

Built on Radix's Tooltip primitive (provider embedded).

## Accessibility

- Shows on hover and on keyboard focus
- Tooltip text wires via `aria-describedby` — the trigger keeps its own
  accessible name (e.g., button text or `aria-label`)
- Escape dismisses

## Related

- `<Popover>` — when the content needs interaction
- `<HoverCard>` — does not exist; build on Popover with a hover trigger if needed

## Anti-patterns

- ❌ **Don't** rely on Tooltip as the only label for an interactive
  control. Set `aria-label` separately.
- ❌ **Don't** put critical-path information in a Tooltip. Mobile users
  can't hover; keyboard users may skip past.
- ❌ **Don't** put interactive content (links, buttons) inside Tooltip.
  Use Popover.
