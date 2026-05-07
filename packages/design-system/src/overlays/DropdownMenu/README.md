# DropdownMenu

A button-triggered menu of actions. Use for kebabs, overflow menus,
toolbar overflows, and "More" dropdowns.

## Usage

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@tensaw/design-system';

<DropdownMenu trigger={<Button>Actions</Button>}>
  <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
  <DropdownMenuItem onSelect={handleDuplicate}>Duplicate</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive" onSelect={handleDelete}>Delete</DropdownMenuItem>
</DropdownMenu>
```

## Components

- **DropdownMenu** — outer container; props: `trigger`, `align`, `side`, `sideOffset`
- **DropdownMenuItem** — clickable item; props: `onSelect`, `disabled`, `icon`, `shortcut`, `variant`
- **DropdownMenuLabel** — section header
- **DropdownMenuSeparator** — horizontal divider

Built on Radix's Menu primitive.

## Accessibility

- Roles: `menu`, `menuitem`
- Arrow keys navigate; Enter/Space activates; Escape closes
- Type-ahead: typing characters jumps to matching items
- Focus returns to trigger on close

## Related

- `<ActionMenu>` (`@tensaw/wired-components`) — DropdownMenu items wired to the actions registry
- `<Popover>` — for non-menu content
- `<CommandPalette>` — for searchable command lists

## Anti-patterns

- ❌ **Don't** put more than ~10 items. Use CommandPalette or a sub-page
  for long lists.
- ❌ **Don't** mix menu items with non-action content (form fields,
  dividers as decoration). Use Popover for that.
