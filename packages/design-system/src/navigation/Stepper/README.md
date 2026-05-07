# Stepper

A horizontal progress indicator for multi-step flows (wizards, onboarding,
checkout).

## Usage

```tsx
import { Stepper } from '@tensaw/design-system';

<Stepper
  currentStep={1}
  steps={[
    { label: 'Patient info' },
    { label: 'Insurance' },
    { label: 'Visit' },
    { label: 'Review' },
  ]}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `currentStep` | `number` | — | 0-indexed active step |
| `steps` | `StepperStep[]` | — | `{ label, status?, description? }` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout |
| `onStepClick` | `(index) => void` | — | Optional navigation handler |

Step status: `'pending' \| 'current' \| 'complete' \| 'error'`. If a step
has explicit `status: 'error'`, the auto-derived current-step logic
respects it.

## Accessibility

- Each step has aria attributes for state
- When `onStepClick` is provided, steps render as buttons; otherwise as plain elements

## Related

- `<Tabs>` — for non-sequential view-switching
- `<Breadcrumbs>` — for hierarchical navigation

## Anti-patterns

- ❌ **Don't** use Stepper for non-sequential flows. Use Tabs.
- ❌ **Don't** allow stepping forward past a step with errors silently.
  Validate the current step before allowing advance.
