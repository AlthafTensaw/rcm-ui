# CommandPaletteWired

`<CommandPalette>` auto-populated from the actions registry. Items are
permission-filtered and grouped by domain prefix.

## Usage

```tsx
import { CommandPaletteWired } from '@tensaw/wired-components';

<CommandPaletteWired open={open} onOpenChange={setOpen} />
```

Wire a global keyboard shortcut to toggle:
```tsx
useHotkey('mod+k', () => setOpen((o) => !o));
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `open` / `onOpenChange` | controlled | — | Open state |
| `placeholder` | `string` | `'Type a command…'` | Search-input placeholder |
| `extraGroups` | `CommandGroup[]` | — | Hand-curated groups appended after registry items |
| `filter` | `(action) => boolean` | — | Custom filter on top of permission filter |

## Behavior

- Iterates the actions registry, filters by user permissions
- Groups items by the action id's prefix (`claim.foo` → "Claim" group)
- Each item dispatches with an empty request `{}` — actions whose request
  type isn't empty must be triggered through other UI (their permission
  filter typically excludes them)
- Selecting an item closes the palette and dispatches

## Accessibility

Inherits CommandPalette's accessibility (focus management, arrow-key
nav, role semantics).

## Related

- `<CommandPalette>` — without registry integration
- `<ActionMenu>` — for short, curated action lists
- `<ActionButton>` — for single-action triggers

## Anti-patterns

- ❌ **Don't** rely on CommandPaletteWired for actions that require
  request data. Those need a richer entry point (form / dialog).
- ❌ **Don't** mount more than one. The actions registry is global; one
  palette is enough.
