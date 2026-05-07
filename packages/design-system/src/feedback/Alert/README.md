# Alert

A persistent inline notification with severity. Use for things the user
needs to see but shouldn't have to dismiss to continue.

## Usage

```tsx
import { Alert } from '@tensaw/design-system';

<Alert variant="info" title="Heads up">
  Some claims need review before resubmission.
</Alert>

<Alert variant="error" title="Save failed" description="Network error." />
<Alert variant="success" title="Saved" dismissible onDismiss={…} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Severity |
| `title` | `ReactNode` | — | Title |
| `description` | `ReactNode` | — | Body |
| `icon` | `ReactNode \| 'auto'` | `'auto'` | Auto-picks icon from variant; pass `null` to omit |
| `action` | `ReactNode` | — | Action slot (button) |
| `dismissible` | `boolean` | `false` | Renders close button |
| `onDismiss` | `() => void` | — | Fires on dismiss |

## Accessibility

- `role="alert"` for `error` variant; `role="status"` otherwise
- Auto-icon improves scanability without removing semantics

## Related

- `<Toast>` — transient notifications
- `<Snackbar>` — short-lived feedback
- `<EmptyState>` — for "no data" rather than "warning about data"

## Anti-patterns

- ❌ **Don't** stack many Alerts on a page. One per severity level is
  the rule of thumb; more becomes noise.
- ❌ **Don't** use Alert as a dialog replacement for must-acknowledge
  content. Use Dialog.
