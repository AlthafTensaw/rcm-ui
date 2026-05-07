# Dialog

A modal dialog with focus trap, escape-to-close, and overlay click-out.
Use for editing flows, confirmations with form input, and any focused
task that should temporarily steal user attention.

## Usage

```tsx
import { Dialog } from '@tensaw/design-system';

<Dialog
  open={isOpen}
  onOpenChange={setOpen}
  title="Edit claim"
  description="Update claim details before resubmission."
  footer={<Button onClick={save}>Save</Button>}
>
  <ClaimEditor />
</Dialog>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `open` | `boolean` | **required** | Controlled open state |
| `onOpenChange` | `(open) => void` | **required** | Fires on open/close |
| `title` | `ReactNode` | **required** | Dialog title (rendered as h2) |
| `description` | `ReactNode` | — | Subtitle below the title |
| `children` | `ReactNode` | — | Body content |
| `footer` | `ReactNode` | — | Footer (typically primary + cancel buttons) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Width |
| `closeOnEscape` | `boolean` | `true` | Allow Escape to close |
| `closeOnOverlayClick` | `boolean` | `true` | Allow overlay click to close |

Built on Radix's Dialog primitive.

## Accessibility

- Focus trap during open; restoration to trigger on close
- Initial focus on the first interactive element inside the dialog
- `aria-labelledby` from the title; `aria-describedby` from the description
- `role="dialog"` and `aria-modal="true"`

## Related

- `<ConfirmDialog>` — for "Are you sure?" prompts
- `<Drawer>` — slides in from a side; useful for detail views with side-context
- `<Popover>` — non-modal anchored to a trigger

## Anti-patterns

- ❌ **Don't** render content-rich Dialogs without a footer. The footer is
  where users find their commit + cancel actions.
- ❌ **Don't** disable both `closeOnEscape` and `closeOnOverlayClick`
  unless the user must make a choice (rare). Keep escape paths.
- ❌ **Don't** stack Dialogs (Dialog → opens another Dialog). Resequence
  the flow or use Drawer + Dialog together.
