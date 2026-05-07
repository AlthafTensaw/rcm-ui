# ExternalLink

A link to an external URL with `target="_blank"`, `rel="noopener noreferrer"`,
and a visual external-link icon.

## Usage

```tsx
import { ExternalLink } from '@tensaw/design-system';

<ExternalLink href="https://docs.example.com">Documentation</ExternalLink>
<ExternalLink href="https://example.com" showIcon={false}>Plain</ExternalLink>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `href` | `string` | **required** | Target URL |
| `showIcon` | `boolean` | `true` | Renders the external-link icon after children |
| `className`, `children`, … | inherited from `<a>` | — | All native anchor props pass through |

## Accessibility

- `target="_blank"` and `rel="noopener noreferrer"` set automatically
- Visual icon (when `showIcon`) is decorative; screen readers announce
  "link" via the `<a>` semantics

## Related

- `<Link>` — for internal navigation via react-router

## Anti-patterns

- ❌ **Don't** use ExternalLink for internal app links — `<Link>` is the
  right tool for routing without a full page reload.
- ❌ **Don't** strip `rel="noopener"` for external links. Window opener
  exploits are a real risk.
