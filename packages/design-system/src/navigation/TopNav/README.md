# TopNav

The application's top-level navigation bar. Lives at the top of `<AppShell>`.

## Usage

```tsx
import { TopNav, TopNavItem, TopNavUserMenu } from '@tensaw/design-system';

<TopNav
  brand={<Logo />}
  items={
    <>
      <TopNavItem to="/cases">Cases</TopNavItem>
      <TopNavItem to="/claims">Claims</TopNavItem>
      <TopNavItem href="https://help.example.com">Help</TopNavItem>
    </>
  }
  trailing={
    <TopNavUserMenu user={currentUser} items={[…]} />
  }
/>
```

## Components

- **TopNav** — outer container; props: `brand`, `items`, `trailing`
- **TopNavItem** — nav link; props: `to` (router) | `href` (external) | `onClick`, `active?`
- **TopNavUserMenu** — avatar + dropdown of user actions; props: `user`, `items`

## Accessibility

- `<nav aria-label="Top">` semantics
- Active item marked via `aria-current="page"` (auto-derived from current route)

## Related

- `<SideNav>` — for secondary side-rail navigation
- `<AppShell>` — composes TopNav with SideNav and main content

## Anti-patterns

- ❌ **Don't** include 10+ items. Top nav is for high-level sections.
- ❌ **Don't** put critical workflow controls in top nav. Those belong
  in panels close to the data.
