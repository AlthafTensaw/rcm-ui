# Input

A text input with consistent styling, validation visuals, and ARIA wiring.

Use as the underlying control inside `<FormField>` for form-validated input,
or directly when you just need an input outside a form.

## Usage

```tsx
import { Input } from '@tensaw/design-system';

<Input placeholder="Patient name" />
<Input type="email" invalid={hasError} aria-describedby="email-error" />
<Input loading />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `type` | `string` | `'text'` | HTML input type (`text`, `email`, `password`, `number`, `tel`, `url`, `search`) |
| `invalid` | `boolean` | `false` | Renders error visual; sets `aria-invalid` |
| `loading` | `boolean` | `false` | Renders an inline spinner (field stays editable) |
| `disabled` | `boolean` | `false` | Disables interaction |
| `leadingIcon` | `ReactNode` | — | Decorative icon at the start |
| `trailingIcon` | `ReactNode` | — | Decorative icon at the end |

All native `<input>` props pass through.

## Accessibility

- Always pair with `<Label>` (or `<FormField>` which handles this)
- `id` association via `htmlFor` is the consumer's responsibility outside `<FormField>`
- Loading state announces via `aria-busy="true"`; field stays editable so users can type ahead
- `invalid={true}` sets `aria-invalid`; pair with `aria-describedby` pointing at an error message id

## Examples

```tsx
// Inside a form
<FormField name="email" label="Email" required>
  {({ value, onChange, name, error }) => (
    <Input
      id={`field-${name}`}
      type="email"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      invalid={Boolean(error)}
    />
  )}
</FormField>

// Search field
<Input type="search" placeholder="Search claims…" leadingIcon={<Search size={14} />} />
```

## Related

- `<Textarea>` — for multi-line input
- `<FormField>` — wraps field components with label + error display
- `<Combobox>` — for typeahead / autocomplete patterns
- `<NumberInput>` — for formatted numeric input (use `react-number-format`
  inside an Input for currency / percentage formatting)

## Anti-patterns

- ❌ **Don't** style the focus state away. The default focus ring is required.
- ❌ **Don't** use `<Input type="number">` for currency. Numeric inputs lose
  precision; use formatted-number patterns instead.
- ❌ **Don't** put a button inside an Input. Use `trailingIcon` for visual
  affordances; for clickable affordances, compose Input + IconButton in a row.
