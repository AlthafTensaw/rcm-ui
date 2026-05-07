# Testing patterns

How `@tensaw/design-system` components are tested. Use this as the template for
every new component file's co-located `<Component>.test.tsx`.

## What we use

- **`vitest`** — test runner, already wired in the workspace
- **`@testing-library/react`** — DOM-driven rendering and queries
- **`@testing-library/user-event`** — keyboard / pointer interaction
- **`jsdom`** — DOM environment (configured in `vitest.config.ts`)
- **a11y assertions** — `axe-core` integration via the Storybook a11y addon
  for visual review; component-level a11y is asserted with role-based queries
  in tests

## What every component test covers

For a Layer 1 primitive (Button, Input, Label, Checkbox, etc.) and beyond,
the co-located test file covers, at minimum:

1. **Renders with default props.** Smoke test — the component mounts and
   produces a sane DOM.
2. **Each visible variant.** One assertion per `variant` and `size` value
   confirming the variant class lands on the rendered element. Use
   `getByRole`-style queries; do not snapshot.
3. **Disabled state.** Confirms the component is not interactive when
   `disabled` is true (button doesn't fire `onClick`, input rejects typing,
   etc.) and exposes the appropriate ARIA state.
4. **Loading state where applicable.** Confirms the loading spinner / skeleton
   renders, the control is non-interactive, and `aria-busy="true"` is set.
5. **Error state for form fields.** Confirms the error visual lands and
   `aria-invalid="true"` is set when an `error` prop is provided.
6. **Keyboard interaction.** Tab / Enter / Space behave as expected on
   actionable elements. For overlays (Dialog, DropdownMenu, etc.), Escape
   closes the surface and focus traps within while open.
7. **Ref forwarding.** When the component uses `forwardRef`, a test confirms
   a passed `ref` receives the underlying DOM element.

Tier 2+ components (overlays, navigation shells, data display) add scenario
tests appropriate to their behavior — e.g., Tabs switches active panel on
trigger click, DataExplorer paginates on page-button click.

## Test file shape

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders spinner and disables interaction when loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

## Querying conventions

Always prefer the most accessible query that succeeds, in this order:

1. `getByRole(role, { name })` — most a11y-aligned; failures usually indicate
   a real a11y gap
2. `getByLabelText(label)` — for form fields with associated labels
3. `getByPlaceholderText(text)` — for fields without visible labels (avoid
   when possible)
4. `getByText(text)` — for non-interactive content
5. `getByTestId(id)` — last resort; only when no semantic query fits

If you find yourself reaching for `getByTestId`, consider whether the
component is missing a role or label. Add `data-testid` only when there is
genuinely no semantic anchor.

## Async assertions

Use `findBy*` queries and `waitFor` for anything that depends on a microtask:

```tsx
await user.click(screen.getByRole('button', { name: 'Open dialog' }));
expect(await screen.findByRole('dialog')).toBeDefined();
```

Avoid `waitFor` with arbitrary timeouts. The default 1000 ms is sufficient
for component-scoped tests; if a test needs longer, the component is likely
doing too much in a render.

## Theming in tests

Components that read from `useTheme()` need a `<ThemeProvider>` in the test
tree. The default mode is `light` and density is `comfortable`; pass props
to test other combinations:

```tsx
import { ThemeProvider } from '@tensaw/design-system/theme';

render(
  <ThemeProvider mode="dark">
    <Button>Save</Button>
  </ThemeProvider>,
);
```

For density and accent-color permutations, write parametrized tests rather
than separate test files per combination.

## Cleanup

`@testing-library/react`'s default cleanup runs between tests automatically.
Components that add side effects to `document` (focus traps, body styles,
event listeners) should clean up in their own `useEffect` return; if a test
needs explicit teardown beyond that, add it to an `afterEach` rather than
adding cleanup to the component.

## Snapshot tests are off

We don't use `toMatchSnapshot`. Snapshots either rot silently or get
rubber-stamped on update. Assertions should make a specific, intentional
claim about behavior or DOM shape. If you need to visualize a component,
that's what Storybook is for.

## Co-location

Test files live next to their component:

```
packages/design-system/src/primitives/Button/
├── Button.tsx
├── Button.test.tsx
├── Button.stories.tsx           # added in Phase 11
├── README.md                    # added in Phase 12
└── index.ts
```

The `tsconfig.json` excludes `**/*.test.ts(x)` from the build but vitest
picks them up via its own glob.

## CI gate

`pnpm test` from the workspace root runs every package's test suite in
parallel. The Phase 14 verification gate requires every test to pass on a
fresh clone — so test that depend on local state, network, or `process.env`
beyond what's stubbed in `vitest.setup.ts` will fail in CI.
