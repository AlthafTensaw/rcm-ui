# Pill

A rounded label, optionally with a remove button. Use for filter chips
and tags.

## Usage

```tsx
import { Pill } from '@tensaw/design-system';

<Pill>Cardiology</Pill>
<Pill removable onRemove={() => removeFilter()}>Status: Open</Pill>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'subtle'` | `'default'` | Visual variant |
| `removable` | `boolean` | `false` | Renders an X remove button |
| `onRemove` | `() => void` | — | Fires on remove |

## Accessibility

- Remove button has `aria-label="Remove"`
- Keyboard reachable via Tab; Enter/Space activates

## Related

- `<Badge>` — for status / count without removal
- `<MultiSelect>` — uses Pill internally for selected chips

## Anti-patterns

- ❌ **Don't** use Pill for state. State doesn't get removed; filters do.
  Use Badge for state.
