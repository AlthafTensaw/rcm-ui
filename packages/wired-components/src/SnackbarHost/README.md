# SnackbarHost

A documented placeholder. The runtime store doesn't yet have a snackbar
queue; this component will subscribe to it once it lands.

For transient feedback today, use `<ToastHost>` and push toasts.

## Status

The `<SnackbarHost>` component renders nothing. It exists to lock in the
import surface so consumers can mount it preemptively without runtime
errors. When the snackbar slot lands in `useNotificationsStore`, this
component will subscribe and render `<Snackbar>` instances similarly to
how `<ToastHost>` handles toasts.

## Usage

```tsx
import { SnackbarHost } from '@tensaw/wired-components';

<AppShell …>
  …
  <ToastHost />
  <SnackbarHost />
</AppShell>
```

This is a no-op today and a working host tomorrow — mount it now to avoid
a future migration.

## Related

- `<Snackbar>` — the presentational snackbar primitive
- `<ToastHost>` — the working notification host

## Anti-patterns

- ❌ **Don't** rely on SnackbarHost for production feedback today. Use
  ToastHost.
