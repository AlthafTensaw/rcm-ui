# Textarea

A multi-line text input with optional auto-resize.

## Usage

```tsx
import { Textarea } from '@tensaw/design-system';

<Textarea placeholder="Notes…" />
<Textarea autoResize value={notes} onChange={(e) => setNotes(e.target.value)} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `autoResize` | `boolean` | `false` | Grows vertically as content is added (via `react-textarea-autosize`) |
| `invalid` | `boolean` | `false` | Renders error visual; sets `aria-invalid` |
| `disabled` | `boolean` | `false` | Disables interaction |
| `rows`, `cols`, `maxLength`, … | inherited from `<textarea>` | — | All native textarea props pass through |

## Accessibility

Same rules as `<Input>`: pair with `<Label>` or `<FormField>`. Auto-resize
doesn't change focus or selection behavior.

## Related

- `<Input>` — for single-line text
- `<FormField>` — wraps field components with label + error display

## Anti-patterns

- ❌ **Don't** disable both `autoResize` and `rows`. Without either, the
  textarea defaults to a single visible row, which is rarely useful.
