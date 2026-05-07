# Button

A versatile click-target with variants for visual hierarchy. The
foundation primitive for all action triggers in the design system.

Use `<Button>` when you want a presentational button with explicit click
handling. Use `<ActionButton>` (in `@tensaw/wired-components`) when the
click should dispatch a registered action — most production code reaches
for that one.

## Usage

```tsx
import { Button } from '@tensaw/design-system';

<Button variant="primary" onClick={handleSave}>Save changes</Button>
<Button variant="destructive" loading={isDeleting}>Delete</Button>
<Button variant="link" asChild><a href="/help">Learn more</a></Button>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'link'` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Sizing scale |
| `loading` | `boolean` | `false` | Shows spinner, blocks click, sets `aria-busy` |
| `disabled` | `boolean` | `false` | Disables visually + functionally |
| `leadingIcon` | `ReactNode` | — | Icon rendered before children |
| `trailingIcon` | `ReactNode` | — | Icon rendered after children |
| `asChild` | `boolean` | `false` | Render as `Slot` so the child element receives the props |
| `onClick`, `type`, … | inherited from `<button>` | — | All native button props pass through |

## Variants

- **primary**: The primary action on a page or form
- **secondary**: Secondary actions
- **outline**: Tertiary actions; toolbar items
- **ghost**: Minimal styling; menu items, table-row affordances
- **destructive**: Delete, void, or other irreversible actions
- **link**: Looks like a link, behaves like a button. Useful inside prose.

## Sizes

- **sm**: Compact contexts (toolbars, dense rows)
- **md**: Default
- **lg**: Hero CTAs, primary modal actions
- **icon**: Square; for icon-only buttons (prefer `<IconButton>`)

## Accessibility

- Renders as native `<button>`; supports `asChild` (Radix `Slot`) to render
  as another element while preserving button semantics
- Includes `focus-visible:ring-2 focus-visible:ring-ring`
- Loading state: `aria-busy="true"`, content swapped for `<Spinner>`,
  click handler suppressed
- Disabled state: `disabled` attribute on the underlying button (skips
  tab order; click suppressed)

## Examples

```tsx
// Loading destructive
<Button variant="destructive" loading={isDeleting} onClick={handleDelete}>
  Delete claim
</Button>

// With leading icon
<Button leadingIcon={<Mail size={16} />}>Send email</Button>

// As-child for link semantics with button styling
<Button asChild variant="primary">
  <a href="/dashboard">Go to dashboard</a>
</Button>
```

## Related

- `<IconButton>` — for icon-only buttons (auto-handles `aria-label`)
- `<ActionButton>` (`@tensaw/wired-components`) — for action-dispatching buttons
- `<ConfirmActionButton>` — for action buttons with a confirmation step
- `<Link>` — for navigation links

## Anti-patterns

- ❌ **Don't** use Button for navigation. Use `<Link>` so middle-click and
  right-click work as users expect.
- ❌ **Don't** use Button for toggles. Use `<Switch>`.
- ❌ **Don't** disable buttons during loading. Use the `loading` prop —
  the spinner + `aria-busy` is the correct UX.
- ❌ **Don't** strip the focus ring with `focus:outline-none`. The visible
  focus state is required.
