# Avatar

A profile thumbnail with initials fallback. Use for users, providers, or
tenants — anywhere a person/entity needs a visual identifier.

## Usage

```tsx
import { Avatar } from '@tensaw/design-system';

<Avatar alt="Jane Doe" />                              {/* initials */}
<Avatar src="/photo.jpg" alt="Jane Doe" />            {/* image */}
<Avatar size="lg" alt="Jane Doe" />                    {/* sized */}
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `alt` | `string` | **required** | Used both for image alt-text and to compute initials |
| `src` | `string` | — | Image source; falls back to initials on error |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Sizing |
| `fallback` | `ReactNode` | — | Override the initials with a custom node |

Built on Radix's Avatar primitive.

## Accessibility

- `alt` is required; treats absent images as decorative would lose context
- Initials are computed from the first two name parts (e.g., "Jane Smith" → "JS")
- For non-person entities (tenants, departments), pass a single-word `alt`
  for a single-letter fallback

## Examples

```tsx
// Group with overlap
<div className="flex -space-x-2">
  <Avatar alt="Alex Smith" />
  <Avatar alt="Bea Tan" />
  <Avatar alt="Cole Roy" />
</div>
```

## Related

- `<Img>` — for non-person images with skeleton + fallback support

## Anti-patterns

- ❌ **Don't** use Avatar for arbitrary thumbnails. Use `<Img>` for
  generic image content.
- ❌ **Don't** set `alt=""` to "make it decorative." Avatars are
  identifiers, not decoration.
