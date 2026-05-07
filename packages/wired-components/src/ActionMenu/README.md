# ActionMenu

A DropdownMenu where each item dispatches a registered action.
Per-item permission gating, optional confirm-before, and item-level
loading states.

## Usage

```tsx
import { ActionMenu } from '@tensaw/wired-components';

<ActionMenu
  trigger={<IconButton aria-label="More" icon={<MoreVertical size={16} />} />}
  items={[
    { actionId: 'claim.retry', request: { claimId }, label: 'Retry' },
    {
      actionId: 'claim.delete',
      request: { claimId },
      label: 'Delete',
      variant: 'destructive',
      confirmBefore: { title: 'Delete?', description: 'No undo.' },
    },
  ]}
/>
```

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `trigger` | `ReactNode` | The DropdownMenu trigger |
| `items` | `ActionMenuItem[]` | Items; each defines an action + optional confirm |
| `align` / `side` / `sideOffset` | inherited from `<DropdownMenu>` | Positioning |

ActionMenuItem: `{ actionId, request, label, icon?, shortcut?, variant?, disabled?, confirmBefore? }`.

## Permission gating

Items the user can't dispatch are hidden by default (or disabled if the
item passes `disableIfNotAllowed: true`).

## Accessibility

Inherits DropdownMenu's role/keyboard semantics; item-level loading
spinner replaces the icon during dispatch and sets `aria-busy="true"`.

## Related

- `<DropdownMenu>` — without action wiring
- `<ActionButton>` — for single-action triggers
- `<CommandPaletteWired>` — for searchable command lists

## Anti-patterns

- ❌ **Don't** mix ActionMenu items with non-action items. Use DropdownMenu directly.
- ❌ **Don't** put more than ~7 items. Use CommandPalette or a dedicated page.
