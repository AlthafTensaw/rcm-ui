# ConfirmDialog

A pre-built dialog for "Are you sure?" prompts. Two buttons (Confirm /
Cancel), a title, and a description — that's the whole API.

For action-driven confirmations, prefer `<ConfirmActionButton>` from
`@tensaw/wired-components`.

## Usage

```tsx
import { ConfirmDialog } from '@tensaw/design-system';

<ConfirmDialog
  open={confirming}
  onOpenChange={setConfirming}
  title="Delete claim?"
  description="This cannot be undone."
  variant="destructive"
  onConfirm={async () => await deleteClaim()}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `open` / `onOpenChange` | controlled | — | Open state |
| `title` / `description` | `ReactNode` | — | Prompt text |
| `confirmLabel` / `cancelLabel` | `string` | `'Confirm'` / `'Cancel'` | Button labels |
| `variant` | `'default' \| 'destructive'` | `'default'` | Confirm-button styling |
| `onConfirm` | `() => void \| Promise<void>` | **required** | Called on confirm; awaited |
| `onCancel` | `() => void` | — | Called on cancel |
| `loading` | `boolean` | — | Override automatic pending tracking from awaiting onConfirm |

## Accessibility

- Same as `<Dialog>`: focus trap, escape close, overlay click close
- During pending (awaiting onConfirm), escape and overlay-click are disabled
- Confirm button shows loading spinner while pending

## Related

- `<Dialog>` — for arbitrary modal content
- `<ConfirmActionButton>` — for action-driven confirmations

## Anti-patterns

- ❌ **Don't** use ConfirmDialog for "Did you mean to do X?" UX. That's
  hindsight; users want feedforward warnings (e.g., disabled state,
  inline help) not modal interruptions.
