# Prop conventions

Every interactive component in `@tensaw/design-system` extends one of four
base prop interfaces declared in `src/types/props.ts`. The motivation is
consistency: any consumer reading three components in a row should see the
same names, types, and meanings for `className`, `disabled`, `loading`,
`error`, etc. Drift across components — even small differences like
`isDisabled` vs `disabled` — kills the feel of one cohesive system.

The four base interfaces are locked in Phase 2; the worked examples at the
bottom of this doc were filled in during Phase 12 (§16).

## The four base interfaces

### `BaseProps`

Every visible component supports these.

| Prop | Type | What it does |
| --- | --- | --- |
| `className` | `string` | Ad-hoc class composition escape hatch. The component composes it via `cn()` so Tailwind conflicts resolve correctly. |
| `id` | `string` | DOM id for `for=`-attribute association. Often auto-generated when omitted. |
| `data-testid` | `string` | Stable hook for tests. Only set when no semantic query fits. |

### `InteractiveProps extends BaseProps`

Anything the user can interact with. Adds:

| Prop | Type | What it does |
| --- | --- | --- |
| `disabled` | `boolean` | Disables interaction visually and functionally. The component handles `aria-disabled` itself. |
| `loading` | `boolean` | In-flight async action. The component renders a spinner/skeleton appropriate to its shape and sets `aria-busy="true"`. |
| `aria-label` | `string` | Accessible name when no visible label. Required on icon-only controls. |
| `aria-describedby` | `string` | Id of an element that further describes this control. |

### `FieldBaseProps extends InteractiveProps`

Form-field-like components (Input, Textarea, Select, Combobox, etc.). Adds:

| Prop | Type | What it does |
| --- | --- | --- |
| `label` | `ReactNode` | Visible label rendered as a `<Label>` and associated by id. |
| `required` | `boolean` | Renders an asterisk after the label and adds `aria-required`. |
| `error` | `string` | Validation error message; switches the field to its error visual and sets `aria-invalid`. |
| `helperText` | `string` | Helper text below the field; hidden when `error` is present. |
| `name` | `string` | Form-system field name (used by react-hook-form, etc.). |

### `ActionableProps extends InteractiveProps`

Action-trigger components (Button, ActionButton). Adds:

| Prop | Type | What it does |
| --- | --- | --- |
| `onClick` | `(event: MouseEvent) => void` | Click handler. The component manages keyboard activation (Enter/Space) internally. |
| `type` | `'button' \| 'submit' \| 'reset'` | Form-submission semantics for `<button>`. |

## Two more universal rules

**No `is*` boolean prefixes.** Use `disabled`, not `isDisabled`. Use
`loading`, not `isLoading`. The exception is when the prop reads as a
question rather than a state — none of the design-system props currently fit
this exception, so in practice always use the bare adjective.

**`onValueChange`, not `onChange`, for controlled components with non-DOM
values.** A `<Select onValueChange={(v) => ...}>` returns the chosen value,
not a `ChangeEvent`. Reserve `onChange` for components that pass through to
a native DOM `<input>` and want to surface the raw event.

## When you need a prop that isn't here

If a new prop seems universally useful, propose it in the Phase 12 doc
update — don't add it ad hoc to a single component. Drift from these
conventions is the single biggest risk to design-system feel; the surface
area is small on purpose.

If a single component has a unique need (e.g., DataExplorer's
`selectionMode`), add it to that component's interface only. Do not extend
the base interfaces.

---

## Worked examples

### `className` — escape hatch composition

```tsx
import { Button, cn } from '@tensaw/design-system';

// One-off width override.
<Button className="w-full">Save</Button>

// Conditional class composition. `cn()` merges Tailwind correctly.
<Button className={cn('mt-2', isUrgent && 'animate-pulse')}>Submit</Button>
```

`className` always merges with the component's own classes via `cn()`.
Tailwind conflicts resolve in your favor: `<Button className="bg-red-500">`
overrides the component's `bg-primary`. This is the only sanctioned way to
override a component's visual presentation per call.

### `disabled` — visual + functional

```tsx
<Button disabled onClick={...}>Save</Button>
// Renders dimmed, ignores clicks, and adds aria-disabled="true".
```

`disabled` is honored by every interactive component. Form fields apply it
to the underlying `<input>` so browser autofocus skips the field. Buttons
intercept the click before it reaches `onClick`.

### `loading` — in-flight async

```tsx
<Button loading>Saving…</Button>
// Adds aria-busy="true", swaps content for spinner, blocks click.

<Input loading />
// Renders a small spinner inside the input affordance area; field stays editable.
```

`loading` is the right way to express "something is happening, you don't
need to act." Avoid combining `disabled` + a manual spinner — the dedicated
prop handles ARIA and visual state correctly.

### `error` + `helperText` on form fields

```tsx
<FormField name="email" label="Email" required>
  {({ value, onChange, name, error }) => (
    <Input
      id={`field-${name}`}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      invalid={Boolean(error)}
    />
  )}
</FormField>
```

`<FormField>` reads the validation error from the form context and surfaces
it below the field. Individual primitives accept `invalid` as a styling
flag — they don't show the message themselves; the field wrapper owns that.

### `onValueChange` vs `onChange`

```tsx
// onValueChange: receives the value, not the event.
<Select onValueChange={(value) => setPayer(value)} />

// onChange: receives the raw DOM event (only on plumbing primitives).
<Input onChange={(e) => setName(e.target.value)} />
```

The rule of thumb: if the value isn't a string the user typed, the prop is
`onValueChange`. If it's a string the user typed straight into a native
input, the prop is `onChange` and it gets the `ChangeEvent`.

### `aria-label` on icon-only controls

```tsx
<IconButton aria-label="Delete claim" icon={<Trash2 size={16} />} />
// Required at the type level — IconButton's interface enforces it.
```

Icon-only controls have no visible label, so `aria-label` is mandatory.
`<IconButton>` makes this a TypeScript error if you forget. For controls
with both an icon and visible text, `aria-label` is optional and the visible
text serves as the accessible name.

### `data-testid` — last-resort test hook

```tsx
<Card data-testid="claim-card-12345">…</Card>

// In tests:
expect(screen.getByTestId('claim-card-12345')).toBeDefined();
```

Only reach for `data-testid` when no semantic query fits. Prefer
`getByRole`, `getByLabelText`, `getByText`. If you find yourself adding
`data-testid` everywhere, the component is probably under-using accessible
markup — fix the markup, not the tests.

### `forwardRef` on every primitive

Every primitive (Button, Input, Select, etc.) is a `forwardRef` component:

```tsx
const ref = useRef<HTMLButtonElement>(null);
<Button ref={ref}>Save</Button>
```

This makes the primitives composable with focus management, scroll-into-view,
animations, and the `Slot` pattern (`asChild`). Composite components (Card,
Widget, Form) generally don't forward refs to a single element — they're
multi-element, so a single ref is ambiguous.
