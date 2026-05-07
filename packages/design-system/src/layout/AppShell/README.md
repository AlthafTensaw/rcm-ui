# AppShell

The top-level application chrome. Composes `<TopNav>` (top), `<SideNav>`
(left rail), and main content. Provides the consistent app frame across
all pages.

## Usage

```tsx
import { AppShell } from '@tensaw/design-system';

<AppShell
  topNav={<TopNav brand={<Logo />} items={…} />}
  sideNav={<SideNav>{…}</SideNav>}
>
  <Outlet />  {/* react-router outlet */}
</AppShell>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `topNav` | `ReactNode` | — | Top navigation slot |
| `sideNav` | `ReactNode` | — | Left rail navigation slot |
| `rightPanel` | `ReactNode` | — | Right side panel slot (optional) |
| `children` | `ReactNode` | **required** | Main content |
| `topNavHeight` / `sideNavWidth` / `rightPanelWidth` | `number` | sensible defaults | Layout sizing |

## Layout

The shell uses a static three-column grid (rail / main / optional right
panel) with the top nav spanning the top. Responsive shrinking (collapse
to drawer on narrow viewports) is deferred to v0.2 — current target is
desktop / tablet ≥ 1280px.

## Accessibility

- The top nav is `<header>`
- The side nav is `<nav aria-label="Side">`
- The main content is `<main>`
- Skip-to-content link is the consumer's responsibility (typically the
  first element in `topNav`)

## Related

- `<TopNav>` — top navigation
- `<SideNav>` — side rail navigation
- `<Panel>` — for sub-page content regions

## Anti-patterns

- ❌ **Don't** mount more than one AppShell. The shell owns the page-level
  grid; nesting breaks layout assumptions.
- ❌ **Don't** put route-level state in AppShell. The shell is layout
  only; let pages own their state.
