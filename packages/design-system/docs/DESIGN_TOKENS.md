# Design tokens

Every visible value in `@tensaw/design-system` resolves through a token. No
component hardcodes a hex color, a pixel padding, or a font size. The token
layer is the seam where tenant branding, light/dark mode, and density
preferences plug in — change a token and every component that consumes it
updates.

This document covers what tokens exist, where they live, and how to use them
when building custom UI on top of the design system.

> **Note.** Two parallel token systems coexist in v0.1:
> the **shadcn/ui-style CSS variables** (`--background`, `--foreground`,
> `--primary`, …) consumed by every component built in Phases 3 → 10, and
> the **Tensaw legacy variables** (`--tw-color-*`, `--tw-fs-*`, …) consumed
> by the pre-existing RCM components in `src/rcm/`. The two are additive
> today and will be unified in a follow-up. New work should use the
> shadcn-style tokens.

---

## Where tokens live

| Layer | File | Purpose |
| --- | --- | --- |
| Source of truth | `src/styles/global.css` | shadcn-style CSS variables on `:root` and `.dark` |
| Tailwind bridge | `tailwind.config.js` (root) | Maps utility class names (`bg-primary`) to the CSS variables |
| TS reflection | `src/tokens/colors.ts`, `dimensions.ts`, `effects.ts` | Type-safe token names for JS consumers |
| Theme writer | `src/tokens/cssVariables.ts` | Runtime `ThemeProvider` writes legacy `--tw-*` variables here |

Components consume tokens **through Tailwind utility classes** — never raw
CSS variables. That makes overrides predictable: `<Button className="bg-red-500">`
works without touching the design system.

---

## Color tokens

All colors live in HSL space and are referenced via Tailwind's
`hsl(var(--…))` bridge. The naming follows shadcn conventions: every
foreground has a paired background.

### Surface colors

| Token | Tailwind class | Light value | Dark value | Use |
| --- | --- | --- | --- | --- |
| `--background` | `bg-background` | white | near-black | App canvas |
| `--foreground` | `text-foreground` | near-black | near-white | Default text |
| `--card` | `bg-card` | white | near-black | Card surface |
| `--card-foreground` | `text-card-foreground` | near-black | near-white | Card text |
| `--popover` | `bg-popover` | white | near-black | Popover/dropdown panel |
| `--muted` | `bg-muted` | grey-50 | grey-900 | Subtle backgrounds (form helpers, table headers) |
| `--muted-foreground` | `text-muted-foreground` | grey-500 | grey-400 | Subtle text |
| `--accent` | `bg-accent` | grey-50 | grey-900 | Hover surfaces (menu items, list rows) |

### Semantic colors

| Token | Tailwind class | Use |
| --- | --- | --- |
| `--primary` | `bg-primary` / `text-primary-foreground` | Primary actions; brand accent |
| `--secondary` | `bg-secondary` / `text-secondary-foreground` | Secondary actions |
| `--destructive` | `bg-destructive` / `text-destructive-foreground` | Delete, void, irreversible actions |

### Border + ring

| Token | Use |
| --- | --- |
| `--border` | Default border color |
| `--input` | Form-field borders specifically |
| `--ring` | Focus ring (`focus-visible:ring-2 focus-visible:ring-ring`) |

### When a feedback variant needs its own color

Some feedback components (Alert, Toast, Snackbar, Badge, Pill) expose
variant-specific colors that read as `text-emerald-600`, `bg-amber-50`, etc.
These come straight from Tailwind's default palette — they are token
consumers, not new tokens. If a tenant needs different success/warning hues,
override at the Tailwind config level rather than at the component level.

---

## Spacing scale

Tensaw uses Tailwind's default spacing scale. Components do not introduce
new spacing values; if you find yourself reaching for `p-[13px]`, the design
is wrong, not the token system. Common patterns:

| Use | Class | Pixels (default density) |
| --- | --- | --- |
| Tight gap inside a row | `gap-1` / `gap-2` | 4 / 8 |
| Default padding | `p-3` / `p-4` | 12 / 16 |
| Card padding | `p-6` | 24 |
| Section padding | `p-8` / `p-10` | 32 / 40 |
| Page padding | `p-12` | 48 |

---

## Typography

Font families are CSS variables for tenant override:

| Token | CSS variable | Default |
| --- | --- | --- |
| Sans | `--font-sans` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …` |
| Mono | `--font-mono` | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, …` |

Font sizes use Tailwind's scale — `text-xs` (12), `text-sm` (14),
`text-base` (16), `text-lg` (18), `text-xl` (20), `text-2xl` (24), and up.
The default body size is `text-sm` (14px) for most components — denser than
`text-base` for the high-information-density RCM workflows the system is
built for.

---

## Density

Density is a runtime toggle wired through `<ThemeProvider density="…">`.
Today the value flows into the legacy `--tw-*` variables that older
components consume; new components are built density-aware via their own
`size` prop (`sm` / `md` / `lg`). The pattern:

- **Comfortable density** (default): `size="md"` looks normal, `size="sm"`
  is the dense option.
- **Compact density**: consumers default to `size="sm"`, with `size="md"`
  as the comfortable option.

Density does not change typography or radii — only padding and component
heights. A future refactor will fold density into shared CSS variables so
every component reads it from the same place.

---

## Border radius

| Token | CSS variable | Default | Use |
| --- | --- | --- | --- |
| Default | `--radius` | `0.5rem` (8px) | Cards, dialogs, buttons |
| Inherited | `rounded-md` (Tailwind) | derived from `--radius` | All standard surfaces |
| Pills | `rounded-full` | — | Pill, Avatar, IconButton (when round) |

---

## Effects

| Token | CSS variable | Use |
| --- | --- | --- |
| Default shadow | `--shadow` (legacy) | Cards, popovers, dropdowns |
| Focus ring | `--ring` | `focus-visible:ring-2 focus-visible:ring-ring` |

The legacy `--shadow` is still the source of truth for elevation today;
shadcn-style elevation is consumed via Tailwind's `shadow-*` classes.

---

## Using tokens in custom components

When you need to build a one-off component that lives outside the design
system but should match its visual language, follow these rules:

1. **Read tokens through Tailwind classes**, not CSS variables. The
   utility classes pick up dark mode, density, and accent overrides
   automatically.
2. **Compose with `cn()`** for class merging. It resolves Tailwind
   conflicts correctly:

    ```tsx
    import { cn } from '@tensaw/design-system';

    function CustomBox({ className, ...props }) {
      return (
        <div
          className={cn(
            'rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm',
            className,
          )}
          {...props}
        />
      );
    }
    ```

3. **Don't introduce new tokens for one-off colors.** Reach for Tailwind
   palette classes (`bg-emerald-50`, `text-rose-600`) for variant-specific
   hues; if you find yourself reusing the same hand-picked color in three
   places, *that* is when a new token earns its keep.
4. **Theme overrides go through CSS variables**, not Tailwind config.
   Tenant accent customization writes to `--primary` / `--ring` / etc.;
   never re-import the Tailwind config to swap palettes.

---

## Adding or changing a token

1. Update the value in `src/styles/global.css` (both `:root` and `.dark`).
2. If the token needs a Tailwind utility class, add it to `tailwind.config.js`'s
   `theme.extend.colors` (or appropriate section).
3. If JS code needs the value, add it to the appropriate file in
   `src/tokens/` so consumers get autocomplete.
4. Smoke-test against Storybook — every component reads from these tokens,
   so you'll see breakage immediately.
5. Update this doc if the token is part of the public surface.

---

## Related

- **`PROP_CONVENTIONS.md`** — How components expose `className` for
  per-call style overrides without breaking token consistency.
- **`THEMING.md`** — Tenant branding, accent colors, light/dark mode.
- **`A11Y.md`** — Color-contrast requirements that constrain token choices.
