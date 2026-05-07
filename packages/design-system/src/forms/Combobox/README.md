# Combobox

A searchable single-value picker. Supports static option lists or async
search functions. Use when the list is large enough to benefit from
type-to-filter.

## Usage

```tsx
import { Combobox } from '@tensaw/design-system';

// Static list
<Combobox options={specialties} value={specialty} onValueChange={setSpecialty} />

// Async search
<Combobox
  search={async (q) => await fetchProviders(q)}
  value={providerId}
  onValueChange={setProviderId}
  placeholder="Search providers…"
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `T \| null` | **required** | Selected value |
| `onValueChange` | `(value) => void` | **required** | Fires on selection |
| `options` | `ComboboxOption<T>[]` | — | Static list (mutually exclusive with `search`) |
| `search` | `(query) => Promise<options>` | — | Async search (mutually exclusive with `options`) |
| `searchDebounceMs` | `number` | `200` | Debounce for async search |
| `placeholder` | `string` | — | Trigger placeholder |
| `disabled` | `boolean` | `false` | Disables the control |

Built on `cmdk` inside a Popover.

## Accessibility

- Roles: `combobox`, `listbox`, `option` per WAI-ARIA Combobox pattern
- Arrow keys navigate; Enter selects; Escape closes
- Async search announces "Loading" via aria-live

## Related

- `<Select>` — for short static lists where search isn't needed
- `<MultiSelect>` — for many-of-N

## Anti-patterns

- ❌ **Don't** pass both `options` and `search`. Pick one.
- ❌ **Don't** debounce async search to < 100ms. Servers don't need that
  level of chatter; users won't notice the difference.
