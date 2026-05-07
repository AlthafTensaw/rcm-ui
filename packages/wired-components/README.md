# @tensaw/wired-components

Action-aware components that bridge the platform-agnostic visuals in
`@tensaw/design-system` with the platform-specific contracts in
`@tensaw/actions` and `@tensaw/runtime`.

## Why two packages?

`@tensaw/design-system` stays platform-agnostic. It works with any state
management, any backend, any auth scheme — its only contract is React
props. This means it can be reused outside Tensaw if that ever becomes
valuable (open-source release, partner apps, vendor demos).

`@tensaw/wired-components` knows about the action contract:

- Components take an `actionId` instead of an `onClick` handler
- They wire `useActionMutation` / `useActionQuery` for loading / error state
- They surface errors via `useNotificationsStore`
- They follow the action's declared toast / optimistic policies

Consumers choose:

```tsx
// Generic visual primitive — no platform contracts attached
import { Button } from '@tensaw/design-system';

<Button onClick={() => doStuff()}>Save</Button>;
```

```tsx
// Action-aware component — locked to Tensaw's action contract
import { ActionButton } from '@tensaw/wired-components';

<ActionButton
  actionId="claim.retry"
  request={{ claimId }}
  variant="primary"
  onSuccess={() => closeModal()}
>
  Retry
</ActionButton>;
```

The unwired component still works fine for one-off code paths or for any
"I just want a button" use case. The wired component disappears once the
action is registered: no more loading state plumbing, no more
try/catch/toast boilerplate.

## Inventory

| Component | Wraps | Uses |
|---|---|---|
| `ActionButton` | `Button` | `useActionMutation` |
| `ConfirmActionButton` | `Button` + `ConfirmDialog` | `useActionMutation` |
| `ActionForm` | `Form` | `useActionMutation` |
| `ActionLink` | `Link` | router adapter from `@tensaw/actions` |
| `ActionMenu` | `DropdownMenu` | `dispatchAction` |
| `DataExplorerWired` | `DataExplorer` (composition) | `useActionQuery` |
| `ToastHost` | `Toast` | `useNotificationsStore` |
| `SnackbarHost` | `Snackbar` | `useNotificationsStore` (placeholder) |
| `CommandPaletteWired` | `CommandPalette` | `listActions` + `dispatchAction` |

## Mounting requirements

`ToastHost` and `SnackbarHost` are app-shell components — mount them once
near the AppShell root. They subscribe to the store and auto-render every
toast/snackbar dispatched from anywhere in the tree.

`ActionButton`, `ConfirmActionButton`, `ActionForm`, `ActionLink`,
`ActionMenu`, `DataExplorerWired`, `CommandPaletteWired` are page-level
components — mount where you need them. They each expect their referenced
action to be registered via `defineAction()` at app boot.

## Testing

Tests use `_clearActionRegistry()` and `_resetNotificationsStore()` between
runs to keep the registry clean. The shared `vitest.setup.ts` polyfills
the browser APIs Radix needs in jsdom.
