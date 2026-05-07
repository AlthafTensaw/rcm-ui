# Panel

A bordered content region with optional resizable behavior. Use for
resize handles, split-pane layouts, and collapsible side panels.

## Usage

```tsx
import { Panel } from '@tensaw/design-system';

<Panel title="Filters" defaultSize={300} minSize={200} maxSize={500}>
  <FilterForm />
</Panel>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | Header text |
| `actions` | `ReactNode` | — | Right-aligned header actions |
| `resizable` | `boolean` | `false` | Show resize handle |
| `defaultSize` / `minSize` / `maxSize` | `number` | — | Size constraints (px) when `resizable` |
| `collapsible` | `boolean` | `false` | Show collapse toggle in header |
| `defaultCollapsed` | `boolean` | `false` | Initial collapsed state |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Resize axis |

## Accessibility

- Resize handle has `role="separator"` + `aria-orientation`
- Collapse toggle is a real button with `aria-expanded`

## Related

- `<TabbedPanel>` — Panel with tabs
- `<Drawer>` — modal slide-out
- `<Card>` — non-resizable bordered surface

## Anti-patterns

- ❌ **Don't** use Panel for non-resizable cases. Use Card.
- ❌ **Don't** make every panel resizable by default. Resize is a power
  feature; most panels work with sensible default sizes.
