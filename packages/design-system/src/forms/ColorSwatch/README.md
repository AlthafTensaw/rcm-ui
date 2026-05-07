# ColorSwatch

A grid of color swatches for picking from a curated palette. Use for tag
colors, calendar event colors, and other low-stakes color choices.

## Usage

```tsx
import { ColorSwatch } from '@tensaw/design-system';

<ColorSwatch
  aria-label="Tag color"
  value={tagColor}
  onValueChange={setTagColor}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `string \| null` | **required** | Currently selected color |
| `onValueChange` | `(color) => void` | **required** | Fires on selection |
| `defaultColors` | `string[]` | Tensaw 10-color palette | Override the default set |
| `customColors` | `string[]` | — | Append custom colors after defaults |
| `disabled` | `boolean` | `false` | Disables the control |
| `aria-label` | `string` | — | Accessible name for the group |

## Accessibility

- Each swatch has `role="radio"` with the color name as its accessible label
- Arrow keys navigate within the group
- Selected swatch announces with `aria-checked="true"`

## Related

- For full-spectrum picking (RGB / hex), use a custom component or a
  third-party color picker library

## Anti-patterns

- ❌ **Don't** use ColorSwatch for accent-color customization in tenant
  branding settings — that needs a full color picker for tenant-chosen
  HSL values.
