# Breadcrumbs

A trail showing the user's location in the navigation hierarchy.

## Usage

```tsx
import { Breadcrumbs } from '@tensaw/design-system';

<Breadcrumbs
  items={[
    { label: 'Cases', to: '/cases' },
    { label: 'Open', to: '/cases/open' },
    { label: 'Case 12345' },  // current — no `to` makes it non-link
  ]}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `items` | `BreadcrumbItem[]` | **required** | `{ label, to? }` |
| `separator` | `ReactNode` | `<ChevronRight />` | Between-items separator |

## Accessibility

- `<nav aria-label="Breadcrumb">` wraps the list
- Current page (last item, no `to`) marked with `aria-current="page"`

## Related

- `<Link>` — for navigation links inside other contexts
- `<TopNav>` — for top-level navigation

## Anti-patterns

- ❌ **Don't** include the current page as a link. The last item should
  have no `to`.
- ❌ **Don't** show breadcrumbs on top-level pages where the trail is
  meaningless.
