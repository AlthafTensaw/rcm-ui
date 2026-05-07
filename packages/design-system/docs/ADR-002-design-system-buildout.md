# ADR-002 — Design system buildout architecture

**Status:** Accepted
**Date:** May 2026 (Phase 12 of the design system buildout)
**Supersedes:** —
**Superseded by:** —

---

## Context

The Tensaw codebase began with a small set of legacy RCM components in
`@tensaw/design-system/src/rcm/` and one standalone primitive (TextField).
The Phase 0–14 buildout (per spec
`Tensaw_UI_Design_System_Buildout_Handoff.md`) shipped a full design
system: 60 production components across primitives, forms, overlays,
feedback, navigation, layout, data display, and a separate wired-components
package that connects the presentational layer to the actions registry.

This ADR records the architectural decisions made during that buildout
that aren't obvious from reading the component files alone — the choices
that future contributors will need context to understand or revisit.

---

## Decision 1 — Two-layer split: design system + wired components

**What.** Separate `@tensaw/design-system` (presentational primitives) from
`@tensaw/wired-components` (action-registry-wired counterparts).

**Why.** Three forces pushed the split:

1. **Testability.** Presentational components are trivially testable —
   render, click, assert. Action-wired components need a configured
   registry, fake fetch, signed-in user. Mixing the two shapes into one
   package makes every test slower and pulls more dependencies into every
   consumer.
2. **Bundle isolation.** Apps that don't use the actions registry
   (Storybook docs, marketing pages) shouldn't pull in `@tanstack/react-query`,
   the dispatcher, or the Zod runtime. Splitting packages keeps the
   design-system bundle tight.
3. **Pedagogical clarity.** The split forces each component to declare
   "who owns the wiring" — page consumer or wired component. Without
   that boundary, components drift into half-wired states that are hard
   to compose.

**Trade-off.** Two import paths instead of one (`Button` from
design-system, `ActionButton` from wired-components). Some duplication of
prop surface (`<ActionButton>` re-exposes most of `<Button>`'s props).
The trade-off is acceptable because the duplication is type-driven; if
`<Button>`'s props change, `<ActionButton>` updates automatically.

**See:** `docs/WIRING_PATTERNS.md`.

---

## Decision 2 — Sub-path package exports

**What.** Both `@tensaw/design-system` and `@tensaw/composition` expose
sub-paths in `package.json` exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./primitives": "./src/primitives/index.ts",
    "./forms": "./src/forms/index.ts",
    "./overlays": "./src/overlays/index.ts",
    …
  }
}
```

**Why.** Two reasons:

1. **Discoverability.** `import { Button } from '@tensaw/design-system/primitives'`
   makes layer membership visible at the import site. Reading a file's
   imports tells you what kind of component each one is.
2. **Tree-shaking insurance.** While modern bundlers tree-shake the root
   index well in theory, sub-paths give us a deterministic ceiling on
   what each consumer pulls in. Storybook's stricter bundling needs this.

The root index (`@tensaw/design-system`) re-exports everything, so
consumers who prefer flat imports work unchanged.

**Trade-off.** Slightly more `package.json` config to maintain. Worth it
for the import-site clarity.

---

## Decision 3 — Storybook stories co-located with components

**What.** Stories live at `<Component>/<Component>.stories.tsx` next to
the component, not in a separate `storybook/stories/` folder.

**Why.** The spec's example showed sibling-folder organization, but the
codebase rhythm (and Phase 2's Storybook config) co-locates tests next to
components. Mixing two organizational patterns for closely-related files
hurts more than it helps.

**Trade-off.** The `tsconfig` exclude pattern needs to skip stories
(otherwise the component package's build emits story files into `dist/`).
Phase 11 added the necessary excludes to `design-system`, `composition`,
and `wired-components` tsconfigs.

---

## Decision 4 — Two CSS variable systems coexist

**What.** The design system has two parallel token systems:
- **shadcn/ui-style** (`--background`, `--foreground`, `--primary`, …)
  consumed by every component built in Phases 3–10.
- **Tensaw legacy** (`--tw-color-*`, `--tw-fs-*`, …) consumed by the
  pre-existing RCM components in `src/rcm/` and runtime body styles.

**Why.** A clean cut would have required rewriting the legacy RCM
components in lockstep with the buildout. That risked breaking the
patient app mid-migration. Instead, the two systems coexist additively
in `global.css`. New components build on shadcn variables; legacy
components keep working.

**Trade-off.** Future contributors see variables that aren't documented
in the same place; `DESIGN_TOKENS.md` calls this out explicitly. A
unification follow-up is queued for v0.2.

---

## Decision 5 — DataExplorer in `@tensaw/composition`, not `@tensaw/design-system`

**What.** `<DataExplorer>` lives in `@tensaw/composition/data-display`
even though it's a presentational component.

**Why.** DataExplorer composes `<SchemaDataGrid>` (from
`@tensaw/composition/grids`) with `<Pagination>` and `<EmptyState>` (from
design-system). Putting DataExplorer in design-system would create a
circular dependency: design-system → composition → design-system.

The composition package already exists for this kind of "presentational
but composing across packages" component. DataExplorer fits naturally
there.

**Trade-off.** Consumers import from two different packages
(`@tensaw/design-system` for primitives, `@tensaw/composition` for
DataExplorer). The package READMEs and `CHOOSING_COMPONENTS.md` make
this discoverable.

---

## Decision 6 — Form trio in one file

**What.** `Form`, `FormField`, and `FormError` are exported from a single
file (`forms/Form/Form.tsx`) rather than split into three.

**Why.** They're tightly coupled — `FormField` and `FormError` depend on
the React context that `Form` provides. Splitting into three files would
mean each child file imports from the parent or from a shared
context module. The single-file form keeps the primitives discoverable
and the file size manageable (~300 lines).

The story file follows suit: one `Form.stories.tsx` covers all three.
The README does too: one `Form/README.md`.

**Trade-off.** Slightly larger single file. Acceptable.

---

## Decision 7 — `defineAction` schemas are the source of truth for shapes

**What.** Wired components like `<ActionButton>` and `<ActionForm>` accept
`actionId` and infer the request/response types from the action's Zod
schemas, not from explicit type parameters.

**Why.** A two-source-of-truth pattern (TypeScript types + Zod schemas)
drifts. Inferring from Zod gives runtime validation + compile-time types
from one declaration.

**Trade-off.** TypeScript autocomplete on `request` requires the actions
registry to be discoverable from the consumer's tsconfig. The
project-wide `paths` resolution handles this.

---

## Decision 8 — Permission gating defaults to "hide"

**What.** When a user lacks the permission for an action, wired components
default to hiding the trigger, not disabling it.

**Why.** Hiding leaves no trace of forbidden capabilities — the user
doesn't see something they can't use. Disabled triggers are visual noise
for users who can't act, and an information leak (showing what's possible
elsewhere). The `disableIfNotAllowed` opt-in is available where layout
needs the empty space preserved.

**Trade-off.** A page might render fewer affordances for low-permission
users than for admins, leading to "why can't I see X?" questions. The
contract is documented per-component.

---

## Decision 9 — `ConfirmActionButton` reopens on error

**What.** When a `<ConfirmActionButton>`'s dispatch errors, the dialog
closes briefly and reopens (via `setTimeout(0)`) so the user can retry.

**Why.** Closing the dialog on error loses the user's confirmation
intent. Keeping it open looks like the dispatch hasn't fired. The
brief close-then-reopen pattern makes the error visible (toast +
reopened dialog) and lets the user retry without re-clicking the
trigger.

**Trade-off.** A 16ms flash. Acceptable; alternatives (keeping it open,
showing inline error) had worse UX.

---

## Decision 10 — Toast/Snackbar are presentational; hosts wire the queue

**What.** `<Toast>` and `<Snackbar>` are presentational primitives.
`<ToastHost>` (and the placeholder `<SnackbarHost>`) subscribe to the
runtime store and render the queue.

**Why.** Three benefits:

1. The presentational primitives are testable in isolation without a
   provider.
2. The host is mounted once at AppShell, not in every page that pushes
   notifications.
3. Pushing toasts is decoupled from rendering them — any code path
   (action dispatch, page handler, mutation hook) can push without
   needing context.

**Trade-off.** SnackbarHost is a no-op today (the runtime store doesn't
yet have a snackbar slot). Documented in the SnackbarHost README so
consumers don't get surprised.

---

## Decision 11 — `<ActionLink>` renders a real anchor

**What.** ActionLink renders `<a href={action.to(args)}>` and dispatches
on left-click; modifier-clicks (middle-click, Cmd/Ctrl+click) bypass
dispatch.

**Why.** Right-click "Open in new tab" and middle-click "Open in
background tab" are workflow-critical for power users. Buttons-styled-as-links
break both. A real anchor with a real `href` works the way the browser
expects.

**Trade-off.** Navigate actions must define a `to(args)` URL builder.
That's required by the action declaration anyway.

---

## Decision 12 — Single MockActionsProvider for all wired-component stories

**What.** Wired-component stories use a `withMockActions(...)` decorator
factory rather than each story building its own mock environment.

**Why.** The setup is non-trivial: clear registry, sign in synthetic
user, register actions, stub fetch with envelope-shaped responses,
clean up on unmount. Putting this in every story file copies ~40 lines
of code per file. The decorator factory takes the variable parts
(actions, response map, permissions) as a config object and reuses the
rest.

**Trade-off.** Stories are coupled to the harness's API. Acceptable —
the harness is internal to wired-components and changes lockstep with
the registry.

---

## Decision 13 — Stories cover variants, sizes, and states; not full app flows

**What.** Stories per component focus on the component's own surface
(variants, sizes, loading, disabled, error, empty). They don't simulate
multi-step flows or page-level interactions.

**Why.** Flow-level testing belongs in integration tests (Phase 13's
patient app work). Stories are the presentational surface — what a
designer or new contributor sees when reading the component. Padding
stories with flows balloons the count and obscures the variant grid.

**Trade-off.** Some interaction patterns (multi-step Stepper, full Form
submission) are under-represented in stories. Acceptable; integration
tests carry that load.

---

## Decision 14 — Tabs lazy-render with `forceMount` + ref-gate

**What.** `<Tabs>` mounts all tab panels (`forceMount`) but uses a ref
gate to avoid running the inactive panels' effects until they're shown.

**Why.** Pure lazy mount (the Radix default) loses scroll position and
form state when switching tabs. `forceMount` keeps the DOM but the ref
gate prevents data fetches in inactive tabs. Best of both — state
preserved, no wasted requests.

**Trade-off.** Inactive panels still take some DOM cost. Acceptable for
typical use (≤ 7 tabs).

---

## Decision 15 — `lifecycleContext` on Widget, not auto-wiring

**What.** `<Widget>` accepts a `lifecycleContext` prop rather than
hooking into a context provider for visibility/refresh signals.

**Why.** Widgets compose into different parents (dashboards, panels,
test harnesses) with different signal sources. A required context
provider would make widgets harder to test in isolation. The explicit
prop lets each parent supply the appropriate context.

**Trade-off.** Consumers wire it manually. Mitigated by the dashboard
component that provides a context-injecting wrapper for the typical case.

---

## Consequences

The buildout is complete with these decisions in place. Phase 13
(patient app migration) will exercise the architecture against a real
production app — that's where remaining edge cases will surface. ADR-003
will record any architecture-level changes that emerge from Phase 13.

The decisions here are **revisitable, not permanent.** Re-opening any of
them is appropriate when the surrounding code or product needs change.
The only one that's load-bearing for v0.1 is Decision 1 (the two-layer
split); the others are local choices with limited blast radius.

---

## See also

- `Tensaw_UI_Design_System_Buildout_Handoff.md` — full spec
- `docs/WIRING_PATTERNS.md` — Decision 1 in user-facing form
- `docs/DESIGN_TOKENS.md` — Decision 4 in user-facing form
- `docs/CHOOSING_COMPONENTS.md` — Decision 5 surfaced in the decision tree
- ADR-001 — pre-buildout dispatcher and runtime store decisions
