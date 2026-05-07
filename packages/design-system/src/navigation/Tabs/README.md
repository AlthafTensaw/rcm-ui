# Tabs

A horizontal tab strip for switching between content views.

## Usage

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@tensaw/design-system';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="overview"><OverviewView /></TabsContent>
  <TabsContent value="details"><DetailsView /></TabsContent>
  <TabsContent value="history"><HistoryView /></TabsContent>
</Tabs>
```

## Components

- **Tabs** — root; props: `value`, `defaultValue`, `onValueChange`, `variant`, `size`, `orientation`
- **TabsList** — strip container
- **TabsTrigger** — clickable tab; props: `value`, `disabled`
- **TabsContent** — body for a tab; props: `value`

Built on Radix's Tabs primitive.

## Variants

- **default**: Underlined active state
- **pill**: Filled-pill active state
- **underline**: Bold underline-only

## Accessibility

- Roles: `tablist`, `tab`, `tabpanel`
- Arrow keys move between tabs (per Radix)
- Active tab's content is focusable; others have `aria-hidden`

## Related

- `<TabbedPanel>` — Card+Tabs convenience wrapper
- `<Stepper>` — for sequential, finite-state progress

## Anti-patterns

- ❌ **Don't** put more than 7 tabs. Use a select or sub-page.
- ❌ **Don't** put tabs inside a tab. The visual hierarchy collapses.
