# Toast

A transient notification rendered at the edge of the viewport. The
presentational primitive — for production use, push to
`useNotificationsStore` and render via `<ToastHost>`.

## Usage

```tsx
import { Toast } from '@tensaw/design-system';

<Toast variant="success" title="Saved" description="Your changes were saved." />
```

In production, push to the queue:
```tsx
import { useNotificationsStore } from '@tensaw/runtime';

useNotificationsStore.getState().pushToast({
  toastId: 'save-success',
  severity: 'success',
  title: 'Saved',
});
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Severity tint + icon |
| `title` | `ReactNode` | **required** | Headline |
| `description` | `ReactNode` | — | Body |
| `action` | `ReactNode` | — | Action button slot (e.g., Undo) |
| `onDismiss` | `() => void` | — | Fires on close button + duration timeout |
| `duration` | `number \| null` | `5000` | ms before auto-dismiss; null = sticky |

## Accessibility

- `role="status"` (or `role="alert"` for variant=error)
- Dismiss button has `aria-label="Close"`
- Auto-dismiss timer pauses on hover/focus

## Related

- `<ToastHost>` (`@tensaw/wired-components`) — production-mounted host
- `<Snackbar>` — for less-prominent transient feedback
- `<Alert>` — for persistent inline notifications

## Anti-patterns

- ❌ **Don't** render `<Toast>` directly in pages. Push to the queue and
  let `<ToastHost>` own rendering.
- ❌ **Don't** use Toast for required information. Users may dismiss
  before reading; use Alert or Dialog for must-see content.
