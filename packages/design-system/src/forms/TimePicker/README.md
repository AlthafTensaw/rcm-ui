# TimePicker

A time-of-day picker with hour and minute steppers. Supports 12h and 24h
formats.

## Usage

```tsx
import { TimePicker } from '@tensaw/design-system';

<TimePicker value={time} onValueChange={setTime} format="12h" step={15} />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `{ hours: number; minutes: number } \| null` | **required** | Selected time |
| `onValueChange` | `(time \| null) => void` | **required** | Fires on change |
| `format` | `'12h' \| '24h'` | `'24h'` | Display format; 12h adds AM/PM toggle |
| `step` | `number` | `1` | Minute step (1, 5, 15, 30) |
| `disabled` | `boolean` | `false` | Disables the control |

The value type is `{ hours, minutes }` rather than `Date` so the field is
calendar-agnostic. Consumers wanting a full datetime combine TimePicker
with DatePicker.

## Accessibility

- Hour and minute fields are independent number inputs
- Up/down arrows step through values respecting `step`
- AM/PM toggle (12h) is a Switch-like control

## Related

- `<DatePicker>` — pair for full datetime input

## Anti-patterns

- ❌ **Don't** use TimePicker when you actually want a duration. Use two
  numeric inputs instead.
