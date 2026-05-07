# Form, FormField, FormError

The form trio. `<Form>` owns the context (react-hook-form + Zod);
`<FormField>` wires individual controls to the form state; `<FormError>`
surfaces submission-level errors.

## Usage

```tsx
import { Form, FormField, FormError, Input, Button } from '@tensaw/design-system';
import { z } from 'zod';

const schema = z.object({
  patientName: z.string().min(1, 'Required'),
  email: z.string().email('Must be a valid email'),
});

type Values = z.infer<typeof schema>;

<Form<Values>
  schema={schema}
  defaultValues={{ patientName: '', email: '' }}
  onSubmit={async (values) => { … }}
>
  <FormError />
  <FormField name="patientName" label="Patient name" required>
    {({ value, onChange, name }) => (
      <Input
        id={`field-${name}`}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </FormField>
  <Button type="submit">Save</Button>
</Form>
```

See `docs/FORMS_GUIDE.md` for the full mental model.

## Props (Form)

| Prop | Type | What it does |
| --- | --- | --- |
| `schema` | `ZodSchema<T>` | Optional Zod schema for validation |
| `defaultValues` | `DefaultValues<T>` | Initial values |
| `onSubmit` | `SubmitHandler<T>` | Called with validated values |
| `children` | `ReactNode \| ((methods) => ReactNode)` | Static children or render-prop with RHF methods |

## Props (FormField)

| Prop | Type | What it does |
| --- | --- | --- |
| `name` | `string` | Path into form values (supports dotted paths) |
| `label` | `ReactNode` | Visible label |
| `required` | `boolean` | Visual asterisk + `aria-required` |
| `helperText` | `string` | Below-field hint (hidden on error) |
| `children` | `(args) => ReactNode` | Render-prop with `value, onChange, onBlur, name, error` |

## Props (FormError)

Renders the form-level error if RHF's `formState.errors.root` is set.
Renders nothing otherwise.

## Accessibility

- Label-control association via `htmlFor` + `id` (consumer pattern: `id={field-${name}}`)
- Error announcement via `aria-describedby`
- Required marker via `aria-required` on the rendered control

## Related

- `<ActionForm>` (`@tensaw/wired-components`) — Form + dispatch combined
- `docs/FORMS_GUIDE.md` — full patterns + multi-step + async validation

## Anti-patterns

- ❌ **Don't** nest `<Form>`. Use one outer Form per submission target.
- ❌ **Don't** pass local `useState` values to controls inside `<FormField>`.
  The render-prop owns the value.
