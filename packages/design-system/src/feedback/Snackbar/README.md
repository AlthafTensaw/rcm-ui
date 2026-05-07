# Snackbar

A short-lived bottom-of-screen message. Less prominent than a Toast; use
for "boring" success confirmations and undo prompts.

Snackbar is presentational — production wiring (`<SnackbarHost>`) is a
placeholder until the runtime store grows a snackbar queue. For now,
prefer Toast.

## Usage

```tsx
import { Snackbar } from '@tensaw/design-system';

<Snackbar variant="success" message="3 claims archived." />
<Snackbar message="Saved." action={<Button variant="link">Undo</Button>} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'success' \| 'error'` | `'default'` | Severity tint |
| `message` | `ReactNode` | **required** | The message |
| `action` | `ReactNode` | — | Trailing action (e.g., Undo) |
| `duration` | `number \| null` | `3000` | ms; null disables auto-dismiss |
| `onTimeout` | `() => void` | — | Fires when duration elapses |

## Accessibility

- `role="status"`
- Auto-dismiss; consumers should provide an action for reversible flows

## Related

- `<Toast>` — more prominent, severity-aware, longer duration
- `<Alert>` — persistent inline

## Anti-patterns

- ❌ **Don't** use Snackbar for errors. Use Toast or Alert.
- ❌ **Don't** queue Snackbars. They're meant to be one-at-a-time.
