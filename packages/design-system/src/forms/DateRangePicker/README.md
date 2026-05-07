# DateRangePicker

A two-date range picker with a single calendar popover showing two months
side-by-side.

## Usage

```tsx
import { DateRangePicker } from '@tensaw/design-system';

<DateRangePicker
  value={range}
  onValueChange={setRange}
  placeholder="Pick a range"
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `{ from: Date \| null; to: Date \| null }` | **required** | Range |
| `onValueChange` | `(range) => void` | **required** | Fires on selection |
| `format` | `string` | `'PP'` | date-fns format for display |
| `minDate` / `maxDate` | `Date` | — | Range constraints |
| `disabled` | `boolean` | `false` | Disables the control |
| `error` | `boolean` | `false` | Renders error visual |

## Accessibility

Same as `<DatePicker>`; selection happens in two clicks (start, then end).

## Related

- `<DatePicker>` — for single-date selection

## Anti-patterns

- ❌ **Don't** allow `from` to be after `to`. The picker enforces this
  internally; if your form schema lets the swap happen, fix the schema.
