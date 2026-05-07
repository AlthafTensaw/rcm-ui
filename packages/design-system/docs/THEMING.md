# Theming

Tensaw apps are multi-tenant: every clinic potentially gets its own visual
identity. This is solved at the token layer — the design system never
hardcodes a color, so every component participates in theming for free.

This doc covers the three theming axes (mode, density, tenant accent), how
they compose, and the override patterns for tenant brand customization.

---

## The three axes

| Axis | Values | Wired through |
| --- | --- | --- |
| **Mode** | `light` / `dark` | `<ThemeProvider mode="…">` toggles `.dark` class on `<html>` |
| **Density** | `comfortable` / `compact` | `<ThemeProvider density="…">` writes legacy `--tw-*` vars |
| **Tenant accent** | HSL triplet string | `<ThemeProvider accentColor="…">` overrides `--primary` + `--ring` |

These compose orthogonally: every combination of mode × density × accent
is supported.

---

## `<ThemeProvider>`

Every Tensaw app mounts `<ThemeProvider>` at the root, typically inside
`<AppShell>`:

```tsx
import { ThemeProvider } from '@tensaw/design-system';

function App() {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [density, setDensity] = useState<Density>('comfortable');
  const tenantAccent = useTenantAccent(); // null or '190 70% 40%'

  return (
    <ThemeProvider
      mode={mode}
      density={density}
      accentColor={tenantAccent}
    >
      <AppShell topNav={<TopNav />} sideNav={<SideNav />}>
        …
      </AppShell>
    </ThemeProvider>
  );
}
```

### Props

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `mode` | `'light' \| 'dark'` | `'light'` | Adds/removes `.dark` on `<html>`; flips shadcn variables |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` | Writes density-aware legacy `--tw-*` variables |
| `accentColor` | `string \| null` | `null` | HSL triplet (e.g. `"190 70% 40%"`); overrides `--primary` + `--ring` |
| `target` | `HTMLElement` | `document.documentElement` | Where to write the variables (storybook nests differently) |

---

## Light / dark mode

Mode is a binary today. The shadcn-style variables in
`src/styles/global.css` define both palettes:

```css
:root         { --background: 0 0% 100%;     --foreground: 0 0% 3.9%; }
.dark         { --background: 0 0% 3.9%;     --foreground: 0 0% 98%;  }
```

Every component reads via Tailwind utility classes (`bg-background`,
`text-foreground`), so the toggle propagates automatically.

The provider writes `class="dark"` on the chosen target. If you mount
`<ThemeProvider>` somewhere other than the root, dark mode applies only
inside that subtree — useful for previews where you want a dark-mode demo
inline on a light page.

### Pitfalls

- **Don't read `mode` at render time to compute styles** — let the CSS
  variables do the work. Reading the prop is fine for non-visual decisions
  (e.g., selecting a `<img src>` for a logo with light/dark variants).
- **Per-component mode override doesn't exist.** If a single component
  must always be dark (e.g., a hero panel), wrap it in
  `<ThemeProvider mode="dark">` — but consider whether that's the right
  call: it can be jarring on a light page.

---

## Density

Density today flows through the legacy `--tw-*` variables (consumed by
older RCM components). New components built in Phases 3–10 are
density-aware via their own `size` prop:

| Density preference | Default `size` | Use |
| --- | --- | --- |
| `comfortable` (default) | `md` | Standard spacing |
| `compact` | `sm` | Dense data-rich workflows |

Consumers of new components decide per-instance:

```tsx
<Button size="sm">Compact</Button>
<Input size="md">Comfortable</Input>
```

The runtime density preference is read for components that compose
multiple primitives (DataExplorer, Form layouts) so they can pass through
matching sizes consistently.

### A future refactor will fold density into shared CSS variables. The
goal is for new components to read density from the same place as legacy
ones — at which point per-component `size` prop continues to be the
override surface, but the default tracks the provider.

---

## Tenant accent customization

Each tenant can override the primary accent color with an HSL triplet:

```tsx
<ThemeProvider accentColor="190 70% 40%">
```

The provider writes:

```css
:root {
  --primary: 190 70% 40%;
  --ring: 190 70% 40%;
}
```

What this affects:

- Every component that uses `bg-primary`, `text-primary`, `border-primary`
- Focus rings (Tab navigation, focus-visible)
- Button primary variant
- Active state in Tabs, SideNav, Stepper
- Tenant-branded badges and links (when consumers reach for the primary
  variant)

What this **doesn't** affect:

- Destructive (red) — semantically constant
- Success (green), warning (amber), info (blue) — also semantic
- Foreground / background — controlled by mode, not tenant

### Choosing an accent color

The accent must:

1. **Pass contrast.** Use the
   [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)
   to verify ≥ 4.5:1 against the foreground/background (both modes).
2. **Distinguish from the destructive variant.** Tenants whose brand color
   is red should pick a non-red accent or coordinate the destructive
   palette change in step.
3. **Be tested in dark mode.** Saturated colors that look great on white
   often vibrate against dark backgrounds. Test against `.dark`.

Tenants whose branding requires more than just an accent (e.g., bespoke
typography, custom component shapes) escalate to a **white-label tier**
that overrides additional tokens. That's outside this guide.

---

## Override priority

When multiple sources set a token, the cascade is:

1. **Inline component classes** (`<Button className="bg-red-500">`) — wins
2. **Component variant** (`<Button variant="destructive">`) — provides
   `bg-destructive`
3. **Tenant accent** — overrides `--primary`
4. **Mode** — overrides `--background`, `--foreground`, etc.
5. **Token defaults** — shadcn's neutral palette in `global.css`

So a `<Button className="bg-red-500" variant="primary">` always shows red
regardless of mode/tenant. A `<Button>` with no overrides shows the
tenant's primary in the active mode.

---

## Implementation details

### Why HSL triplets, not hex

Tailwind's `hsl(var(--primary))` bridge needs the variable to be a
space-separated H/S/L without the `hsl()` wrapper:

```css
--primary: 190 70% 40%;       /* ✅ works */
--primary: hsl(190 70% 40%);  /* ❌ Tailwind double-wraps */
--primary: #38bdf8;           /* ❌ no opacity-modulation */
```

This is intentional. Tailwind classes like `bg-primary/50` need to
modulate alpha, which only works on space-separated HSL.

### Where the variables actually live

- **Shadcn-style** (`--background`, `--primary`, …): in
  `src/styles/global.css`'s `:root` and `.dark` blocks. Components consume
  via Tailwind classes wired through `tailwind.config.js`.
- **Tensaw legacy** (`--tw-color-*`, `--tw-fs-*`, …): written at runtime
  by `<ThemeProvider>` via `src/tokens/cssVariables.ts`.
- **Tenant accent override**: written at runtime by `<ThemeProvider>` to
  the same `:root`, after the static defaults.

### Resetting an override

`<ThemeProvider accentColor={null}>` removes the previous override and
restores the static default. Useful for "preview tenant branding" UIs that
want to revert.

---

## Testing themed UI

In test files, wrap render in a configured provider:

```tsx
import { ThemeProvider } from '@tensaw/design-system';

render(
  <ThemeProvider mode="dark" accentColor="190 70% 40%">
    <ComponentUnderTest />
  </ThemeProvider>,
);
```

This is rarely needed — most tests don't care about visuals. When they
do (e.g., asserting class names that include color tokens), a wrapper
keeps the test deterministic.

In Storybook, the global toolbar has theme + density toggles, so every
story is auto-themed without consumer effort.

---

## Future work

- Unify legacy `--tw-*` and shadcn `--*` variables into a single token
  layer
- Per-component theming overrides (e.g., a "high-contrast" mode beyond
  light/dark)
- Animation theming (currently fixed durations; tenants may want slower
  for dense workflows)

These are tracked as v0.2 followups; current behavior is stable.

---

## Related

- **`DESIGN_TOKENS.md`** — Full token reference and the rules for
  consuming them.
- **`A11Y.md`** — Color-contrast constraints that bound tenant accent
  choices.
- **`PROP_CONVENTIONS.md`** — How `className` overrides compose with
  themed variants.
