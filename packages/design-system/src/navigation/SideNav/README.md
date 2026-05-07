# SideNav

A vertical navigation rail. Use in `<AppShell>` as the primary section
navigation alongside or instead of `<TopNav>`.

## Usage

```tsx
import { SideNav, SideNavGroup, SideNavItem, SideNavSearch } from '@tensaw/design-system';

<SideNav>
  <SideNavSearch placeholder="Search…" onSearch={…} />
  <SideNavGroup label="Workflow">
    <SideNavItem to="/cases" icon={<Folder />}>Cases</SideNavItem>
    <SideNavItem to="/claims" icon={<File />}>Claims</SideNavItem>
  </SideNavGroup>
  <SideNavGroup label="Admin">
    <SideNavItem to="/users" icon={<Users />}>Users</SideNavItem>
  </SideNavGroup>
</SideNav>
```

## Components

- **SideNav** — outer container; props: `collapsed`, `width`
- **SideNavGroup** — labelled section
- **SideNavItem** — link; auto-active when current pathname matches `to` exactly or starts with `${to}/`
- **SideNavSearch** — debounced search input (300ms default)

## Accessibility

- `<nav aria-label="Side">`
- Active items marked with `aria-current="page"`

## Related

- `<TopNav>` — for app-level horizontal nav
- `<AppShell>` — composes SideNav + TopNav + main

## Anti-patterns

- ❌ **Don't** use SideNav for in-page section navigation. Use Tabs.
- ❌ **Don't** nest SideNavGroups. Use one level of grouping.
