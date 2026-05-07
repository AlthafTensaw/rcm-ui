# DatePicker

A single-date picker with a calendar popover.

## Usage

```tsx
import { DatePicker } from '@tensaw/design-system';

<DatePicker value={dob} onValueChange={setDob} placeholder="Date of birth" />
<DatePicker minDate={today} maxDate={ninetyDaysOut} value={dos} onValueChange={setDos} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `Date \| null` | **required** | Selected date |
| `onValueChange` | `(date \| null) => void` | **required** | Fires on selection |
| `format` | `string` | `'PP'` | date-fns format string ("Jan 1, 2026") |
| `minDate` / `maxDate` | `Date` | — | Date range constraints |
| `placeholder` | `string` | — | Trigger placeholder |
| `disabled` | `boolean` | `false` | Disables the control |
| `error` | `boolean` | `false` | Renders error visual |

Built on `react-day-picker` inside a Popover.

## Accessibility

- Calendar uses `gridcell` semantics with arrow-key navigation
- Header announces month/year on change
- Keyboard: arrow keys to navigate days; PageUp/PageDown for months

## Related

- `<DateRangePicker>` — for date ranges
- `<TimePicker>` — for time-of-day input
- `<Input type="date">` — when you don't need the popover affordance

## Anti-patterns

- ❌ **Don't** use DatePicker for past birthdates with no lower bound.
  Set `minDate` to a sensible floor; otherwise the user is paginating
  through centuries.
