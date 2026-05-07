# ActionButton

A `<Button>` wired to dispatch a registered action. Handles validation,
permission gating, loading state, and toast-on-success.

## Usage

```tsx
import { ActionButton } from '@tensaw/wired-components';

<ActionButton
  actionId="claim.retry"
  request={{ claimId }}
  toastOnSuccess="Claim retried"
>
  Retry
</ActionButton>
```

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `actionId` | `string` | The registered action's id |
| `request` | `ActionRequest<actionId>` | Validated against the action's Zod schema |
| `toastOnSuccess` | `string \| ToastConfig` | Message to push to ToastHost on success |
| `onSuccess` | `(data) => void` | Called with the response data on success |
| `onError` | `(error) => void` | Called with the error on failure |
| `optimistic` | `boolean` | Advisory only today; reserved for future optimistic update support |
| `disableIfNotAllowed` | `boolean` | Render disabled if the user lacks permission (default: hide) |

All `<Button>` props pass through (`variant`, `size`, `leadingIcon`, etc.).

## Permission gating

If the action requires a permission the current user doesn't hold, the
button is hidden by default. Pass `disableIfNotAllowed` to render it
disabled instead — useful when the layout depends on the button's space.

## Accessibility

- Inherits Button's focus, keyboard, and ARIA behavior
- Loading state during dispatch sets `aria-busy="true"`

## Related

- `<Button>` — for non-action buttons
- `<ConfirmActionButton>` — adds a confirmation step
- `<ActionLink>` — for navigation actions
- `<ActionMenu>` — for action menus
- `docs/WIRING_PATTERNS.md` — when to use ActionButton vs Button + manual dispatch

## Anti-patterns

- ❌ **Don't** use ActionButton for actions outside the registry. Register
  the action first, even if it's only used in one place.
- ❌ **Don't** pass `request` props that conflict with the action's schema.
  TypeScript catches most of these; runtime validation catches the rest.
