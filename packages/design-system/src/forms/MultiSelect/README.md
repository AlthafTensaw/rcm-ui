# MultiSelect

A multi-value picker with chip display for selected items. Use for
many-of-N from a known list.

## Usage

```tsx
import { MultiSelect } from '@tensaw/design-system';

<MultiSelect
  options={PAYERS}
  values={selectedPayers}
  onValuesChange={setSelectedPayers}
  placeholder="Pick payers…"
  maxDisplay={3}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `options` | `SelectOption[]` | **required** | Available options |
| `values` | `string[]` | **required** | Currently selected values |
| `onValuesChange` | `(values) => void` | **required** | Fires on any change |
| `maxDisplay` | `number` | `3` | Max chips shown before "+N more" truncation |
| `placeholder` | `string` | — | Empty-state text |
| `disabled` | `boolean` | `false` | Disables the control |
| `error` | `boolean` | `false` | Renders error visual |

## Accessibility

- Chips have remove buttons keyboard-accessible
- Tab order: trigger → first chip's remove → next chip's remove → … → input
- Selected items announce on selection/removal

## Related

- `<Select>` — for single-value selection
- `<Combobox>` — when the list is large enough to need search
- `<MultiCombobox>` — does not exist today; build on top of Combobox if needed

## Anti-patterns

- ❌ **Don't** use MultiSelect with > 100 options unless you also offer
  filter/search. Consider building a custom Combobox + chips combo.
