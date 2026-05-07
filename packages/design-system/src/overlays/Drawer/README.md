# Drawer

A side panel that slides in from any edge. Use for detail views,
filter panels, and forms that need to coexist with the underlying page.

## Usage

```tsx
import { Drawer } from '@tensaw/design-system';

<Drawer
  open={open}
  onOpenChange={setOpen}
  side="right"
  title="Filters"
>
  <FilterForm />
</Drawer>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `open` / `onOpenChange` | controlled | — | Open state |
| `side` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Edge to slide in from |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Width or height |
| `title` | `ReactNode` | — | Header text |
| `children` | `ReactNode` | — | Body |
| `footer` | `ReactNode` | — | Footer (e.g., apply button) |

Built on `vaul`.

## Accessibility

- Focus trap during open; restoration on close
- Escape closes
- `role="dialog"` and `aria-modal="true"`

## Related

- `<Dialog>` — centered modal
- `<Popover>` — small anchored panel
- `<TabbedPanel>` — for non-modal side panels

## Anti-patterns

- ❌ **Don't** use Drawer when the user needs to interact with the
  underlying page. Drawer is modal; use a non-modal sidebar instead.
- ❌ **Don't** put long forms in a `bottom`-side Drawer. Mobile keyboards
  cover it; pages prefer a Drawer that animates from the side or top.
