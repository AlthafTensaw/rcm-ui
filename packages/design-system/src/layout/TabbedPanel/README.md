# TabbedPanel

A Panel with a built-in tab strip. Convenience wrapper for the common
pattern of "panel with multiple views."

## Usage

```tsx
import { TabbedPanel } from '@tensaw/design-system';

<TabbedPanel
  title="Patient details"
  tabs={[
    { value: 'overview', label: 'Overview', content: <Overview /> },
    { value: 'history', label: 'History', content: <History /> },
    { value: 'notes', label: 'Notes', content: <Notes /> },
  ]}
  defaultTab="overview"
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | Header text |
| `tabs` | `TabbedPanelTab[]` | **required** | `{ value, label, content, disabled? }` |
| `defaultTab` / `value` | `string` | — | Uncontrolled / controlled active tab |
| `onTabChange` | `(value) => void` | — | Fires on switch |
| `actions` | `ReactNode` | — | Right-aligned header actions |
| `variant` | inherited from `<Tabs>` | `'underline'` | Tabs variant |

## Accessibility

Same as `<Tabs>`: `tablist`, `tab`, `tabpanel` roles; arrow-key navigation.

## Related

- `<Panel>` — without tabs
- `<Tabs>` — standalone tab control without the panel chrome

## Anti-patterns

- ❌ **Don't** use TabbedPanel with one tab. Use Panel.
- ❌ **Don't** lazy-load tab content if switching is fast (< 50ms render).
  Pre-rendering all tabs is fine for typical content.
