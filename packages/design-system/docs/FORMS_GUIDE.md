# Forms guide

Forms are where the design system, the runtime, the actions layer, and the
wired-components layer all converge. This guide walks through the mental
model, the trio of `Form` + `FormField` + `FormError`, and the patterns for
client-side validation, action dispatch, and async error handling.

---

## The mental model

A Tensaw form has **four layers**:

1. **Schema** (`zod`) — single source of truth for shape and validation.
2. **Form state** (`react-hook-form`) — values, dirty, errors, submission.
3. **Field rendering** (design-system primitives) — `<Input>`, `<Select>`, …
4. **Submission** (`<Form>`'s `onSubmit`, or `<ActionForm>`'s wired action).

Each layer owns one concern. The schema doesn't know about the inputs; the
inputs don't know about the schema; the form doesn't know about the
submission target. This separation is what makes forms in the system
testable and refactor-friendly.

---

## The trio: Form, FormField, FormError

```tsx
import { Form, FormField, FormError, Input, Button } from '@tensaw/design-system';
import { z } from 'zod';

const schema = z.object({
  patientName: z.string().min(1, 'Required'),
  email: z.string().email('Must be a valid email'),
});

type ClaimRequest = z.infer<typeof schema>;

function NewClaimForm() {
  return (
    <Form<ClaimRequest>
      schema={schema}
      defaultValues={{ patientName: '', email: '' }}
      onSubmit={(values) => console.log('submit', values)}
    >
      <FormError />

      <FormField name="patientName" label="Patient name" required>
        {({ value, onChange, name, error }) => (
          <Input
            id={`field-${name}`}
            name={name}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            invalid={Boolean(error)}
          />
        )}
      </FormField>

      <FormField
        name="email"
        label="Email"
        helperText="We'll send the receipt here."
      >
        {({ value, onChange, name, error }) => (
          <Input
            id={`field-${name}`}
            type="email"
            name={name}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            invalid={Boolean(error)}
          />
        )}
      </FormField>

      <Button type="submit">Save</Button>
    </Form>
  );
}
```

### `<Form>`

Owns the form context. Wraps `react-hook-form`'s `useForm` + `FormProvider`.
Wires schema validation via `@hookform/resolvers/zod`. Calls `onSubmit` only
with values that pass the schema.

### `<FormField>`

A render-prop wrapper around RHF's `<Controller>`. Renders the visible label
+ helper text + error message; lets you supply the input control. The
render-prop API is intentional: it lets you compose any field type without
the wrapper needing to know `<Input>` from `<Select>` from a custom
component.

### `<FormError>`

Renders the form-level submission error if present (e.g., a network failure
caught in `onSubmit`). Renders nothing when there's no error. Place it
near the top of the form so users see it immediately on submit-fail.

---

## Field-by-field validation patterns

### Required fields

```tsx
const schema = z.object({
  patientName: z.string().min(1, 'Required'),
});

<FormField name="patientName" label="Patient name" required>
  {…}
</FormField>
```

The `required` prop on `<FormField>` adds the visual asterisk + ARIA
`required` attribute. The schema's `.min(1)` is what actually enforces it —
they are independent on purpose so consumers can mark a field visually
required while accepting an empty string at the schema level (rare but
valid).

### Conditional validation

```tsx
const schema = z
  .object({
    insuranceType: z.enum(['commercial', 'medicare', 'self-pay']),
    memberId: z.string().optional(),
  })
  .refine(
    (data) => data.insuranceType === 'self-pay' || data.memberId,
    { path: ['memberId'], message: 'Required for insurance' },
  );
```

`refine()` puts the error on the field via `path`. The matching
`<FormField name="memberId">` will surface it.

### Async / server-only validation

When the validation rule lives on the server (e.g., "is this MRN unique?"),
keep the schema synchronous and use the `onSubmit` handler:

```tsx
async function handleSubmit(values: ClaimRequest, methods: UseFormReturn<ClaimRequest>) {
  const dup = await checkDuplicateMrn(values.mrn);
  if (dup) {
    methods.setError('mrn', { message: 'MRN already in use' });
    return;
  }
  await dispatchAction('claim.create', values);
}
```

Async validators in Zod work but block submit; field-scoped server
validation via `setError` is faster and gives clearer UX.

---

## Submitting via `<ActionForm>`

When the form's submit target is a registered action, `<ActionForm>` from
`@tensaw/wired-components` collapses the wiring:

```tsx
import { ActionForm } from '@tensaw/wired-components';
import { FormField, Input } from '@tensaw/design-system';

<ActionForm<ClaimRequest, { claimId: string }>
  actionId="claim.create"
  schema={schema}
  defaultValues={{ patientName: '', email: '' }}
  onSuccess={(data) => navigate(`/claims/${data.claimId}`)}
  toastOnSuccess="Claim created"
>
  <FormField name="patientName" label="Patient name" required>
    {…}
  </FormField>
  <Button type="submit">Save</Button>
</ActionForm>
```

`ActionForm` is `Form` + `dispatchAction` glue. Use it whenever the form's
result should hit the actions layer — which is most of the time. Use plain
`<Form>` only when the submit target isn't a registered action (e.g.,
external-service forms, debug consoles).

See `WIRING_PATTERNS.md` for when to use which.

---

## Multi-step forms (Wizard pattern)

The design system ships `<Stepper>` for the visual progress indicator.
Compose it with a single `<Form>` whose schema covers all steps:

```tsx
const wizardSchema = z.object({
  // Step 1
  patientName: z.string().min(1),
  dob: z.date(),
  // Step 2
  insuranceType: z.enum(['commercial', 'medicare', 'self-pay']),
  memberId: z.string().optional(),
  // Step 3
  visitType: z.string(),
});

function ClaimWizard() {
  const [step, setStep] = useState(0);
  return (
    <Form<WizardValues> schema={wizardSchema} defaultValues={initial} onSubmit={…}>
      {(methods) => (
        <>
          <Stepper currentStep={step} steps={STEP_LABELS} />
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < 2 ? (
              <Button onClick={async () => {
                const ok = await methods.trigger(STEP_FIELDS[step]);
                if (ok) setStep((s) => s + 1);
              }}>
                Next
              </Button>
            ) : (
              <Button type="submit">Submit</Button>
            )}
          </div>
        </>
      )}
    </Form>
  );
}
```

The render-prop form of `<Form>` exposes the RHF methods. `methods.trigger(['…'])`
runs validation on a subset of fields — enables "validate this step before
moving on."

---

## Surfacing field errors visually

`<FormField>` automatically renders the error message below its slot. The
rendered control should also reflect the invalid state:

```tsx
<FormField name="email" label="Email">
  {({ value, onChange, name, error }) => (
    <Input
      id={`field-${name}`}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      invalid={Boolean(error)}
      aria-describedby={error ? `field-${name}-error` : undefined}
    />
  )}
</FormField>
```

`<FormField>` already wires `aria-describedby` via the error message id, so
the explicit `aria-describedby` here is for completeness — most consumers
don't need it.

---

## The right field type for each value type

| Value | Field |
| --- | --- |
| Free-form text | `<Input>` |
| Long text / notes | `<Textarea>` |
| Single value from a known list | `<Select>` |
| Multiple values from a known list | `<MultiSelect>` |
| Single value from a searchable list | `<Combobox>` (static `options` or async `search`) |
| One of N visible options | `<RadioGroup>` (≤ 5 choices) |
| Boolean toggle (preference) | `<Switch>` |
| Boolean checkbox (terms acceptance) | `<Checkbox>` |
| Date | `<DatePicker>` |
| Date range | `<DateRangePicker>` |
| Time of day | `<TimePicker>` |
| Color | `<ColorSwatch>` |
| File upload | `<FileUpload>` |

When in doubt, see `CHOOSING_COMPONENTS.md` for the decision tree.

---

## Common pitfalls

### Forgetting `id={field-${name}}` on the rendered control

`<FormField>` writes the `<Label>` with `htmlFor={field-${name}}`. The
control inside the render prop must match for the click-to-focus
association. The pattern is mechanical — copy/paste it; don't think
about it.

### Using `defaultValues` with non-matching schema

`defaultValues` types should be `DefaultValues<T>` where `T` is the schema's
inferred type. RHF lets you pass a partial; the schema enforces the full
shape on submit. If a default is missing for a required field, validation
will fire on first submit attempt — that's working as intended.

### Mixing controlled and uncontrolled fields

Always use `<FormField>`'s render-prop `value` + `onChange`. Don't pass a
local `useState` value into a `<FormField>`-wrapped input. Mixing the two
sources of truth produces stale-value bugs that are hard to spot in tests.

### Submitting on every keystroke

The form context exposes `methods.watch()` for "live" derived state, but
calling `methods.handleSubmit` on every keystroke is a footgun. Run the
side effect via `useEffect` listening to `watch()` instead.

---

## Testing forms

Pattern from `@tensaw/wired-components/src/ActionForm/ActionForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('submits valid values', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <Form<{ name: string }> schema={schema} onSubmit={onSubmit}>
      <FormField name="name" label="Name">
        {({ value, onChange, name }) => (
          <Input
            id={`field-${name}`}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </FormField>
      <Button type="submit">Save</Button>
    </Form>,
  );
  await user.type(screen.getByLabelText('Name'), 'Jane');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Jane' }));
});
```

Testing checklist:
- Submit with valid values → schema passes → handler called.
- Submit with missing required → error visible → handler not called.
- Async error in handler → user-facing error message present.

---

## Related

- **`WIRING_PATTERNS.md`** — When `<ActionForm>` beats `<Form>` + manual
  dispatch, and vice versa.
- **`PROP_CONVENTIONS.md`** — `disabled`, `loading`, `error`, `helperText`
  on field components.
- **`CHOOSING_COMPONENTS.md`** — Picking the right field type for the data.
- **`A11Y.md`** — Form-field accessibility: `aria-invalid`, error
  associations, required-field announcements.
