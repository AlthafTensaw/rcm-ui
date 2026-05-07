# Link

A navigation link wrapping `react-router-dom`'s `<Link>`. Use for in-app
navigation. Use `<ActionLink>` (in `@tensaw/wired-components`) when the
destination is action-driven.

## Usage

```tsx
import { Link } from '@tensaw/design-system';

<Link to="/cases">View all cases</Link>
<Link to="/help" variant="subtle">Help</Link>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `to` | `string \| Path` | **required** | Destination (react-router) |
| `variant` | `'default' \| 'subtle' \| 'destructive'` | `'default'` | Visual variant |
| `className`, `state`, `replace`, … | inherited from react-router `<Link>` | — | All RR props pass through |

## Variants

- **default**: Primary link color (typically tenant accent)
- **subtle**: Foreground-color text; underlines on hover only
- **destructive**: Destructive (red) — use sparingly, e.g., "Delete account"

## Accessibility

- Renders as `<a>` with proper `href` so middle-click and right-click work
- Focus ring matches all interactive elements
- Underline appears on hover/focus for clarity

## Related

- `<ExternalLink>` — for `target="_blank"` links to external sites
- `<ActionLink>` (wired-components) — for action-driven navigation
- `<Button variant="link">` — for button-like behavior with link styling

## Anti-patterns

- ❌ **Don't** use Link for non-navigation triggers. Use `<Button>`.
- ❌ **Don't** open in new tab from internal links. That's `<ExternalLink>`'s
  job; it handles the security attributes correctly.
