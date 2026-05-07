# Img

An image element with skeleton placeholder and fallback support. Use for
non-person images (logos, attachments, charts).

## Usage

```tsx
import { Img } from '@tensaw/design-system';

<Img src="/logo.png" alt="Logo" width={120} height={40} />
<Img src="/maybe.jpg" alt="Photo" fallbackSrc="/placeholder.png" />
<Img src="/large.jpg" alt="Photo" showSkeleton />
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `src` | `string` | **required** | Image source URL |
| `alt` | `string` | **required** | Accessible alt text |
| `fallbackSrc` | `string` | — | URL to swap in if `src` errors |
| `showSkeleton` | `boolean` | `false` | Renders a Skeleton placeholder while loading |
| `width`, `height`, `loading`, … | inherited from `<img>` | — | All native props pass through |

## Accessibility

- `alt` is required; pass empty string `""` only when truly decorative
  (and the image is part of a labelled control)
- Skeleton placeholder doesn't change focus or layout — pre-set width and
  height to avoid layout shift

## Related

- `<Avatar>` — for person thumbnails with initials fallback
- `<Skeleton>` — used internally by Img when `showSkeleton`

## Anti-patterns

- ❌ **Don't** use Img for icons. Use `<Icon>` for the curated set.
- ❌ **Don't** load high-res hero images without explicit width/height.
  Layout shift from late-loading images breaks user trust.
