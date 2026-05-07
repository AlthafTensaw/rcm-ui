# Label

A `<label>` element with consistent typography and required-asterisk
support. Pairs with form-field controls via `htmlFor`.

## Usage

```tsx
import { Label } from '@tensaw/design-system';

<Label htmlFor="patient-name">Patient name</Label>
<Label required>Email</Label>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `required` | `boolean` | `false` | Renders a red asterisk after the label text |
| `htmlFor`, `children`, … | inherited from `<label>` | — | All native label props pass through |

## Accessibility

- Always set `htmlFor` to the id of the associated control (`<FormField>`
  uses `field-{name}` by convention)
- The required-asterisk is decorative; `aria-required` on the input is
  what assistive tech reads

## Related

- `<FormField>` — handles label + control association automatically
- `<Input>`, `<Textarea>`, `<Select>`, etc. — controls that pair with `<Label>`

## Anti-patterns

- ❌ **Don't** use Label without `htmlFor` outside `<FormField>`. An
  unassociated label doesn't announce as a field name.
