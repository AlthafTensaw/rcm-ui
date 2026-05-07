# Switch

A binary on/off toggle for preferences and settings. Visually distinct
from a checkbox to convey "state" rather than "choice."

## Usage

```tsx
import { Switch } from '@tensaw/design-system';

<Switch
  aria-label="Compact density"
  checked={isDense}
  onCheckedChange={setIsDense}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `aria-label` | `string` | — | Accessible name (required when no visible label) |
| `checked` / `defaultChecked` | `boolean` | — | Controlled / uncontrolled state |
| `onCheckedChange` | `(next) => void` | — | Fires on toggle |
| `disabled` | `boolean` | `false` | Disables interaction |

Built on Radix's Switch primitive.

## Accessibility

- Spacebar **and** Enter both toggle (unlike Checkbox)
- Announces as "switch" with on/off state
- Pair with a visible `<label>` or set `aria-label`

## Related

- `<Checkbox>` — for choice / acceptance (e.g., "I agree to terms")
- `<Tabs>` — for switching between two views
- `<RadioGroup>` — for non-binary choices

## Anti-patterns

- ❌ **Don't** use Switch for binary form values where the user is
  declaring a fact (e.g., "Has insurance?"). That's a Checkbox.
- ❌ **Don't** mix Switches with destructive actions in close proximity.
  Toggling a Switch should be reversible.
