# Select

A single-value picker rendering an opt-in dropdown. Use for one-of-N
selection from a known list of ≤ 50 options where the options should hide
until the user clicks.

## Usage

```tsx
import { Select } from '@tensaw/design-system';

<Select
  options={[
    { value: 'commercial', label: 'Commercial' },
    { value: 'medicare', label: 'Medicare' },
  ]}
  value={payer}
  onValueChange={setPayer}
  placeholder="Choose a payer…"
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `options` | `SelectOption[]` | **required** | Array of `{ value, label, disabled? }` |
| `value` / `defaultValue` | `string` | — | Controlled / uncontrolled |
| `onValueChange` | `(value) => void` | — | Fires on selection |
| `placeholder` | `string` | — | Empty-state text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sizing |
| `width` | `number \| string` | — | Trigger width (px or any CSS value) |
| `disabled` | `boolean` | `false` | Disables the entire control |

Built on Radix's Select primitive.

## Accessibility

- Type-ahead: typing characters jumps to matching options
- Arrow keys navigate; Enter selects
- Escape closes; the previous selection is restored
- Pair with `<Label>` or `<FormField>`

## Related

- `<MultiSelect>` — for many-of-N
- `<Combobox>` — for searchable lists or async sources
- `<RadioGroup>` — for visible-at-all-times choice (≤ 5 options)

## Anti-patterns

- ❌ **Don't** use Select for > 50 options. Switch to `<Combobox>` so
  users can search.
- ❌ **Don't** use Select for binary choices. Use `<Switch>` or `<Checkbox>`.
