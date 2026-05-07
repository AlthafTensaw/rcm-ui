# ActionLink

A real anchor element wired to a navigate-action. The `href` is computed
from the action's `to(args)` so middle-click and right-click work
naturally; left-click dispatches via the router adapter.

## Usage

```tsx
import { ActionLink } from '@tensaw/wired-components';

<ActionLink actionId="case.open-detail" request={{ caseId }}>
  Open case
</ActionLink>
```

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `actionId` | `string` | The navigate-action's id (must be a `kind: 'navigate'` action) |
| `request` | `ActionRequest<actionId>` | Args passed to `to(args)` |
| `variant` | `'default' \| 'subtle' \| 'destructive'` | Link variant (matches `<Link>`) |
| `children` | `ReactNode` | Link content |

## Behavior

- The rendered `<a>` has a real `href` from the action's `to(args)`
- Modifier-clicks (middle-click, Cmd/Ctrl+click) bypass dispatch — let the browser handle it
- Plain left-click dispatches the action; the action's router adapter triggers navigation

## Accessibility

- Native `<a>` semantics: keyboard-reachable, right-click context menu works, copy-link-address works
- Disabled if the user lacks permission (no link rendered, or rendered with `aria-disabled` per `disableIfNotAllowed`)

## Related

- `<Link>` — for non-action navigation
- `<ActionButton>` — for non-navigation actions

## Anti-patterns

- ❌ **Don't** use ActionLink for non-navigate actions. Use ActionButton.
- ❌ **Don't** intercept the click to add custom behavior. Either drop
  to `<Link>` + a manual handler, or define a richer navigate action.
