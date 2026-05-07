# Checkbox

A binary on/off control with an indeterminate third state for parent-row
patterns.

## Usage

```tsx
import { Checkbox } from '@tensaw/design-system';

<Checkbox checked={agreed} onCheckedChange={setAgreed} />
<Checkbox checked="indeterminate" />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `checked` | `boolean \| 'indeterminate'` | — | Controlled state |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial state |
| `onCheckedChange` | `(next) => void` | — | Fires on toggle |
| `disabled` | `boolean` | `false` | Disables interaction |

Built on Radix's Checkbox primitive; all Radix props pass through.

## Accessibility

- Renders as a native checkbox with a custom-styled wrapper
- Spacebar toggles; Enter does not (HTML default — use Switch for keyboard activation patterns)
- Indeterminate state announces correctly to screen readers via Radix

## Examples

```tsx
// Term acceptance pattern
<label className="flex items-center gap-2 text-sm">
  <Checkbox /> I agree to the terms
</label>

// Multi-select header (parent row)
<Checkbox
  checked={
    allSelected ? true : someSelected ? 'indeterminate' : false
  }
  onCheckedChange={toggleAll}
/>
```

## Related

- `<Switch>` — for binary state with the on/off framing of a preference
- `<RadioGroup>` — for one-of-N choices
- `<MultiSelect>` — for many-of-N from a known list

## Anti-patterns

- ❌ **Don't** use Checkbox for switching between two views. Use Switch
  or Tabs.
- ❌ **Don't** wrap each Checkbox in its own `<form>`. Group with `<FormField>`
  or treat the Checkbox state as local component state.
