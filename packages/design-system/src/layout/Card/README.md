# Card

A self-contained content surface with consistent padding, border, and
shadow. The base building block for grouped content within a page.

## Usage

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@tensaw/design-system';

<Card>
  <CardHeader>
    <CardTitle>Patient summary</CardTitle>
    <CardDescription>Last visit 12/14</CardDescription>
  </CardHeader>
  <CardContent>{/* body */}</CardContent>
  <CardFooter>{/* actions */}</CardFooter>
</Card>
```

## Components

- **Card** — outer container; props: `variant`, `className`
- **CardHeader** — header region (default `p-6`)
- **CardTitle** — heading (h3)
- **CardDescription** — subtitle (muted)
- **CardContent** — body region (default `p-6 pt-0`)
- **CardFooter** — footer region (default `p-6 pt-0`)

## Variants

- **default**: Bordered with subtle shadow
- **outlined**: Bordered, no shadow
- **elevated**: Stronger shadow, no border
- **ghost**: No border, no shadow (for grouping without visible chrome)

## Accessibility

- Card is semantically a `<div>` — consumers should add `role="region"`
  + `aria-labelledby` only if the card represents a discrete page section
- The CardTitle is rendered as h3 by default

## Related

- `<Widget>` — Card with lifecycle integration for self-fetching panels
- `<Panel>` — resizable content region
- `<Section>` — heading + content region tied to a page heading

## Anti-patterns

- ❌ **Don't** nest Cards inside Cards. The visual nesting collapses;
  use Section for in-card grouping.
- ❌ **Don't** override Card padding by hand. Compose with the inner
  components or use `<Card className="p-…">` only when the slot system
  truly doesn't fit.
