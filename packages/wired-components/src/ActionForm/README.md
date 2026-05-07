# ActionForm

A `<Form>` whose submit dispatches a registered action. Combines schema
validation, dispatch, success/error handling, and toast-on-success in
one component.

## Usage

```tsx
import { ActionForm } from '@tensaw/wired-components';
import { FormField, Input, Button } from '@tensaw/design-system';

<ActionForm<ClaimRequest, { claimId: string }>
  actionId="claim.create"
  schema={claimSchema}
  defaultValues={{ patientName: '', email: '' }}
  onSuccess={(data) => navigate(`/claims/${data.claimId}`)}
  toastOnSuccess="Claim created"
>
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
</ActionForm>
```

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `actionId` | `string` | The action to dispatch on submit |
| `schema` | `ZodSchema<TRequest>` | Form validation; should match the action's request schema |
| `defaultValues` | `DefaultValues<TRequest>` | Initial form values |
| `onSuccess` | `(data: TResponse) => void` | Called with the response data |
| `onError` | `(error) => void` | Called with the error |
| `toastOnSuccess` | `string \| ToastConfig` | Pushed on success |
| `children` | `ReactNode` | Form fields |

The two type parameters match the action's request and response types.

## Behavior

- Schema validates → invalid: shows field errors, blocks dispatch
- Schema valid → dispatches via the action's mutation hook
- On success → calls `onSuccess`, optionally toasts
- On error → form-level error surfaced via `<FormError>`

## Accessibility

Inherits Form's accessibility; submitting state during dispatch disables
the form and sets `aria-busy="true"`.

## Related

- `<Form>` — without action wiring
- `<ActionButton>` — for single-button actions outside a form
- `docs/FORMS_GUIDE.md` — full form patterns

## Anti-patterns

- ❌ **Don't** use ActionForm for actions whose request type is empty.
  Use `<ActionButton>` instead.
- ❌ **Don't** override the dispatch by handling `onSubmit` manually. Use
  plain `<Form>` if you need custom submit logic.
