# EmptyState

A visual + textual placeholder for empty lists, search-no-results, and
zero-data scenarios.

## Usage

```tsx
import { EmptyState } from '@tensaw/design-system';
import { Inbox } from 'lucide-react';

<EmptyState
  icon={<Inbox size={40} className="text-muted-foreground" />}
  title="No claims yet"
  description="When new claims are submitted, they will appear here."
  action={<Button>New claim</Button>}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `ReactNode` | **required** | Headline |
| `description` | `ReactNode` | — | Body text |
| `icon` | `ReactNode` | — | Decorative icon |
| `action` | `ReactNode` | — | CTA button or button group |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sizing |

## Accessibility

- The icon is decorative
- Title is rendered as a heading; consumers don't need to provide their own
- Action is a real focusable button — Tab order works as expected

## Related

- `<Alert>` — for "warning about data" rather than "no data"
- `<DataExplorer>` — uses EmptyState internally for empty/no-results states

## Anti-patterns

- ❌ **Don't** show EmptyState while data is loading. Use Skeleton.
- ❌ **Don't** make the action mandatory; sometimes "nothing to do here"
  is the right message.
