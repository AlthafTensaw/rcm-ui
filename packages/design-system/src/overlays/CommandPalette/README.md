# CommandPalette

A keyboard-driven palette of commands with fuzzy search. Modal; opens
typically via a keyboard shortcut (⌘K / Ctrl+K).

For action-registry-aware palettes, prefer `<CommandPaletteWired>` from
`@tensaw/wired-components`.

## Usage

```tsx
import { CommandPalette } from '@tensaw/design-system';

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  groups={[
    {
      label: 'Claims',
      items: [
        { id: 'new', label: 'New claim', shortcut: '⌘N', onSelect: handleNew },
      ],
    },
  ]}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `open` / `onOpenChange` | controlled | — | Open state |
| `groups` | `CommandGroup[]` | **required** | Items grouped by label |
| `placeholder` | `string` | `'Type a command…'` | Search-input placeholder |
| `emptyText` | `string` | `'No results.'` | Shown when search has no matches |

CommandGroup: `{ label, items: CommandItem[] }`. CommandItem: `{ id, label,
description?, icon?, shortcut?, keywords?, onSelect }`.

Built on `cmdk` inside Radix Dialog.

## Accessibility

- Focus moves to search input on open
- Arrow keys navigate; Enter selects; Escape closes
- `keywords` extends the search index beyond the visible label
- Roles: `dialog`, `listbox`, `option` (per cmdk + Radix)

## Related

- `<CommandPaletteWired>` (`@tensaw/wired-components`) — auto-populates
  from the actions registry
- `<DropdownMenu>` — for short fixed menus

## Anti-patterns

- ❌ **Don't** put a CommandPalette behind a button alone. Wire to a
  global keyboard shortcut so power users actually use it.
- ❌ **Don't** put more than ~50 commands without grouping. Users skim;
  groups + descriptive labels make scanning possible.
