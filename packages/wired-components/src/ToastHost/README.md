# ToastHost

The runtime toast queue host. Subscribes to `useNotificationsStore` and
renders pushed toasts. Mount once at AppShell.

## Usage

At the app root:

```tsx
import { ToastHost } from '@tensaw/wired-components';

<AppShell …>
  …
  <ToastHost />
</AppShell>
```

Then anywhere in the app:

```tsx
import { useNotificationsStore } from '@tensaw/runtime';

useNotificationsStore.getState().pushToast({
  toastId: 'save-success',
  severity: 'success',
  title: 'Saved',
  description: 'Your changes are live.',
});
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'top' \| 'bottom'` | `'bottom-right'` | Viewport corner |
| `gap` | `number` | `8` | px gap between toasts |
| `maxVisible` | `number` | `5` | Max simultaneous toasts |

## Accessibility

- Wraps the queue in `role="region" aria-label="Notifications"`
- Each toast inherits `<Toast>`'s accessibility (status/alert role per severity)
- Auto-dismiss timer pauses when any toast is hovered or focused

## Related

- `<Toast>` — the presentational toast primitive
- `<SnackbarHost>` — for snackbar-style feedback (placeholder today)

## Anti-patterns

- ❌ **Don't** mount ToastHost more than once. Toasts will duplicate.
- ❌ **Don't** render `<Toast>` directly in pages. Push to the store.
