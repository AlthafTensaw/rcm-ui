# ConfirmActionButton

ActionButton + ConfirmDialog. Use when a registered action is destructive
or otherwise needs an "Are you sure?" gate.

## Usage

```tsx
import { ConfirmActionButton } from '@tensaw/wired-components';

<ConfirmActionButton
  actionId="claim.delete"
  request={{ claimId }}
  confirmTitle="Delete claim?"
  confirmDescription="This cannot be undone."
  confirmVariant="destructive"
  toastOnSuccess="Claim deleted"
>
  Delete
</ConfirmActionButton>
```

## Props

Inherits all `<ActionButton>` props plus:

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `confirmTitle` | `string` | — | Dialog title |
| `confirmDescription` | `string` | — | Dialog description |
| `confirmLabel` / `cancelLabel` | `string` | `'Confirm'` / `'Cancel'` | Button labels |
| `confirmVariant` | `'default' \| 'destructive'` | `'default'` | Dialog confirm-button variant |

## Behavior

- Click → dialog opens
- Confirm → dispatches action; success closes dialog and toasts
- Error → dialog reopens (after a `setTimeout(0)`) so the user can retry
- Cancel / Escape → no dispatch

## Accessibility

Inherits Dialog's focus trap and ARIA behavior; pending state during
dispatch sets `aria-busy="true"` on the confirm button and disables
escape/overlay-click dismissal.

## Related

- `<ActionButton>` — without confirm gate
- `<ConfirmDialog>` — without action wiring
- `<ActionMenu>` — supports per-item `confirmBefore`

## Anti-patterns

- ❌ **Don't** use ConfirmActionButton for non-destructive actions. The
  confirm step is friction; reserve it for irreversible operations.
- ❌ **Don't** rely on the confirm dialog as input collection. Use a
  Dialog with form fields instead.
