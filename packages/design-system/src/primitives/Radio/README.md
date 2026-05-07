# Radio + RadioGroup

One-of-N selection where the options should be visible at all times. Use
when there are 5 or fewer options and the user benefits from seeing them
all without clicking.

## Usage

```tsx
import { Radio, RadioGroup } from '@tensaw/design-system';

<RadioGroup defaultValue="commercial" onValueChange={(v) => setPayer(v)}>
  <label className="flex items-center gap-2"><Radio value="commercial" /> Commercial</label>
  <label className="flex items-center gap-2"><Radio value="medicare" /> Medicare</label>
  <label className="flex items-center gap-2"><Radio value="medicaid" /> Medicaid</label>
</RadioGroup>
```

## Props (RadioGroup)

| Prop | Type | What it does |
| --- | --- | --- |
| `value` / `defaultValue` | `string` | Controlled / uncontrolled selected value |
| `onValueChange` | `(value) => void` | Fires on selection |
| `disabled` | `boolean` | Disables all radios in the group |
| `orientation` | `'horizontal' \| 'vertical'` | Visual layout (also affects keyboard nav) |

## Props (Radio)

| Prop | Type | What it does |
| --- | --- | --- |
| `value` | `string` | Required — identifies this radio in the group |

Built on Radix's RadioGroup primitive.

## Accessibility

- Arrow keys move selection (Radix handles this)
- Single tab stop for the group; arrow keys cycle within
- Each Radio needs an associated label — wrap in `<label>` or use `<FormField>`

## Related

- `<Select>` — for one-of-N when options should hide until clicked
- `<Combobox>` — for searchable one-of-N
- `<Checkbox>` — for binary toggles

## Anti-patterns

- ❌ **Don't** use RadioGroup with > 7 options. Switch to `<Select>`.
- ❌ **Don't** use it for binary state. Use `<Switch>` or `<Checkbox>`.
- ❌ **Don't** put unrelated Radios on the same page without grouping —
  they'll behave as separate groups but visually suggest a connection.
