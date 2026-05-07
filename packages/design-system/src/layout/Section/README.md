# Section

A heading + content region for grouping within a page. Renders an h2 +
optional description + child content.

## Usage

```tsx
import { Section } from '@tensaw/design-system';

<Section title="Insurance" description="Active policies for this patient.">
  <InsuranceList />
</Section>

<Section
  title="Recent visits"
  actions={<Button variant="link">See all</Button>}
>
  <VisitsList />
</Section>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | **required** | Heading text |
| `description` | `ReactNode` | — | Subtitle |
| `actions` | `ReactNode` | — | Right-aligned header actions (e.g., link buttons) |
| `headingLevel` | `1 \| 2 \| 3 \| 4` | `2` | Semantic heading level |
| `children` | `ReactNode` | — | Body content |

## Accessibility

- Heading rendered with the configured level (h2 by default)
- Use `headingLevel={3}` when nesting Sections inside a page that already
  has h2 sections

## Related

- `<Card>` — for bordered/contained content
- `<Panel>` — for resizable regions
- `<Widget>` — for self-fetching dashboard panels

## Anti-patterns

- ❌ **Don't** nest Sections more than 2 levels deep. The visual hierarchy
  flattens; use Cards for bounded sub-groupings instead.
- ❌ **Don't** use Section just for spacing. The heading is required;
  if you don't have a heading, use plain divs with margin classes.
