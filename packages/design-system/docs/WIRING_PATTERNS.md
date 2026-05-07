# Wiring patterns

Tensaw splits UI into two layers: **design-system primitives** that are
purely presentational (they render pixels and emit DOM events), and
**wired components** that connect those pixels to the actions registry,
the runtime stores, and the API surface.

This split is the backbone of the architecture. Get it right and the same
button works in tests, in Storybook, and in production. Get it wrong and
you build duplicate logic in every page.

---

## The two layers

| Layer | Package | Knows about | Doesn't know about |
| --- | --- | --- | --- |
| Design system | `@tensaw/design-system` | DOM, styles, ARIA, keyboard | Actions, queries, auth, fetch |
| Wired components | `@tensaw/wired-components` | Actions, dispatcher, stores | DOM details, styles |

Design-system components compose into pages directly when the page already
has the data it needs. Wired components pull data themselves — useful when
the page is the data's only owner.

---

## The split, by component family

| Presentation | Wired counterpart | What the wired version adds |
| --- | --- | --- |
| `<Button>` | `<ActionButton>` | Dispatches a registered action; surfaces loading + error; toast on success |
| `<Button>` + `<ConfirmDialog>` | `<ConfirmActionButton>` | Same, with a confirmation step before dispatch |
| `<Link>` | `<ActionLink>` | Real `href` from a navigate-action's `to(args)`; dispatches on click |
| `<DropdownMenu>` | `<ActionMenu>` | Each item dispatches an action; per-item confirm gate |
| `<Form>` | `<ActionForm>` | On submit, dispatches a registered action with the form values |
| `<DataExplorer>` | `<DataExplorerWired>` | Fetches via `useActionQuery`; manages pagination/sort/search state |
| `<CommandPalette>` | `<CommandPaletteWired>` | Auto-populates from the actions registry; permission-filtered |
| `<Toast>` | `<ToastHost>` | Subscribes to `useNotificationsStore`; renders the queue |
| `<Snackbar>` | `<SnackbarHost>` | Placeholder until the store grows a snackbar slot |

Every wired component is a thin shell around its presentational counterpart.
You can always drop down a layer if the wired version doesn't fit.

---

## When to reach for a wired component

Use a wired component when **all three** are true:

1. The action you want to dispatch is **registered** in the actions
   registry.
2. The component is the **single owner** of the dispatch (not part of a
   larger workflow that needs custom orchestration).
3. The default success/error treatment is **what you want** (toast on
   success, error surface via dispatcher's policy).

If any of those break, drop down to the presentational component and wire
manually:

```tsx
// Wired path — boring is good.
<ActionButton actionId="claim.retry" request={{ claimId }}>
  Retry
</ActionButton>

// Manual path — needed when:
// - action isn't registered (one-off external call)
// - you want to chain multiple dispatches
// - you want to coordinate with other UI state (animations, multi-step wizards)
const [retry, { isLoading }] = useActionMutation('claim.retry');
<Button
  loading={isLoading}
  onClick={async () => {
    await retry({ claimId });
    triggerConfetti();
    closeDrawer();
  }}
>
  Retry
</Button>
```

The wired components save you from typing the same handler everywhere it
appears. The presentational components let you compose anything.

---

## Pattern catalog

### Pattern 1 — Single-button action

The simplest case. Use `<ActionButton>`:

```tsx
<ActionButton
  actionId="claim.retry"
  request={{ claimId }}
  toastOnSuccess="Claim retried"
>
  Retry
</ActionButton>
```

What it does: validates request via Zod, checks permission, fires the
dispatcher, surfaces loading state on the button, toasts on success,
toasts on error (if the action's policy allows).

### Pattern 2 — Destructive action with confirmation

```tsx
<ConfirmActionButton
  actionId="claim.delete"
  request={{ claimId }}
  confirmTitle="Delete claim?"
  confirmDescription="This cannot be undone."
  confirmVariant="destructive"
  toastOnSuccess="Claim deleted"
>
  Delete
</ConfirmActionButton>
```

The button opens a `<ConfirmDialog>`; "Confirm" dispatches the action.
On error, the dialog stays open for retry. On cancel, no dispatch.

### Pattern 3 — Multi-step orchestration

When one click triggers a sequence — dispatch action A, wait, dispatch
action B, navigate — drop to manual mode:

```tsx
const [createClaim] = useActionMutation('claim.create');
const [submitClaim] = useActionMutation('claim.submit');

async function handleSubmit() {
  const created = await createClaim(values);
  if (!created.ok) return;
  await submitClaim({ claimId: created.data.claimId });
  navigate(`/claims/${created.data.claimId}`);
}

<Button loading={isSaving} onClick={handleSubmit}>Create + submit</Button>
```

The wired components are single-action; orchestration is yours.

### Pattern 4 — Form that creates a record

`<ActionForm>` collapses Zod schema + values + dispatch:

```tsx
<ActionForm<ClaimRequest, { claimId: string }>
  actionId="claim.create"
  schema={claimSchema}
  defaultValues={{ patientName: '', email: '' }}
  onSuccess={(data) => navigate(`/claims/${data.claimId}`)}
  toastOnSuccess="Claim created"
>
  <FormField name="patientName" label="Patient name" required>
    {({ value, onChange, name }) => (
      <Input id={`field-${name}`} … />
    )}
  </FormField>
  <Button type="submit">Save</Button>
</ActionForm>
```

The schema's inferred type is the action's request type — the action
registry enforces this, so consumer code can't drift.

### Pattern 5 — Self-fetching data table

`<DataExplorerWired>` owns the request/response loop:

```tsx
<DataExplorerWired<Claim, ListClaimsRequest>
  actionId="claim.list"
  request={{ stateCode: 'OPEN' }}
  columns={claimColumns}
  selectRows={(data) => data.rows}
  selectTotal={(data) => data.totalCount}
  initialPageSize={25}
/>
```

State for pagination/sort/search lives in the component. The action's
`request` type expects `offset, limit, sort, search` keys — the wired
component injects them.

### Pattern 6 — Navigation links from a route registry

```tsx
<ActionLink actionId="case.open-detail" request={{ caseId }}>
  Open case
</ActionLink>
```

The navigate-action's `to(args)` resolves the URL at render time, so the
rendered anchor has a real `href`. Right-click → "Open in new tab" works.
On left-click, the component dispatches via the router adapter.

### Pattern 7 — Action menu

```tsx
<ActionMenu
  trigger={<IconButton aria-label="More" icon={<MoreVertical size={16} />} />}
  items={[
    {
      actionId: 'claim.retry',
      request: { claimId },
      label: 'Retry',
      icon: <RotateCcw size={14} />,
    },
    {
      actionId: 'claim.delete',
      request: { claimId },
      label: 'Delete',
      icon: <Trash2 size={14} />,
      variant: 'destructive',
      confirmBefore: { title: 'Delete?', description: 'No undo.' },
    },
  ]}
/>
```

Items are dynamic; per-item confirm is built in.

### Pattern 8 — Notification host

Mount `<ToastHost>` once at app root:

```tsx
<AppShell>
  …
  <ToastHost />
</AppShell>
```

Every `pushToast(...)` call from anywhere surfaces here. Don't render
toasts manually in pages — let the host own the queue.

### Pattern 9 — Command palette

```tsx
<CommandPaletteWired open={open} onOpenChange={setOpen} />
```

Auto-populates with every registered action whose permission the user
holds. For curated palettes, pass `extraGroups` and a `filter`.

---

## Anti-patterns

### Building your own dispatch handler when an `ActionButton` would do

```tsx
// ❌ DON'T
function RetryClaimButton({ claimId }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={async () => {
        setLoading(true);
        const result = await dispatchAction('claim.retry', { claimId });
        setLoading(false);
        if (result.ok) toast('Retried');
        else toast(result.error.message);
      }}
    >
      Retry
    </Button>
  );
}

// ✅ DO
<ActionButton
  actionId="claim.retry"
  request={{ claimId }}
  toastOnSuccess="Retried"
>
  Retry
</ActionButton>
```

The wired component does all of this and more — including correct
permission gating, validation, telemetry, and accessibility. Reaching for
the manual handler means duplicating logic that's already in the framework.

### Wrapping `ActionButton` to add styling

```tsx
// ❌ DON'T
function PrimaryActionButton(props) {
  return <ActionButton {...props} className="bg-blue-600 text-white" />;
}
```

`<ActionButton>` accepts the same `variant` prop as `<Button>`. Use it:

```tsx
// ✅ DO
<ActionButton variant="primary" actionId="…" request={{}}>
```

If your tenant theme needs different primary colors, override at the token
layer (`DESIGN_TOKENS.md`), not at the component layer.

### Forgetting to mount `<ToastHost>` and rendering toasts inline

If `pushToast()` calls return without a visible toast, you forgot the
host. Mount once at AppShell. There's only one host; toasts dedupe by
`toastId`.

### Wiring data fetching inside a presentational component

```tsx
// ❌ DON'T  — DataExplorer is presentational
function ClaimsTable() {
  const { data } = useActionQuery('claim.list', {});
  return <DataExplorer rows={data?.rows ?? []} … />;
}

// ✅ DO — DataExplorerWired exists for exactly this
<DataExplorerWired actionId="claim.list" request={{}} … />
```

The wired version handles loading, error, retry, pagination state,
sort state, and search debouncing. The hand-rolled version is what
people deleted to make the wired version.

---

## When the layers don't fit

Sometimes the data flow is genuinely one-of-a-kind. Build a custom
component that composes design-system primitives directly. That's fine.
What's not fine: building it to be reusable when it isn't, or pulling
patterns from it back into the presentational layer. The presentational
layer is intentionally thin.

If you're writing the same custom wiring in three places, propose adding
a new wired component or extending an existing one. The wired-components
package is open to growth as long as each addition is clearly more useful
than the manual pattern.

---

## Mocking the API in tests and dev

If you write MSW handlers — for integration tests, dev-server stubs, or
storybook fixtures — every response **must** be wrapped in the platform
envelope. `authenticatedFetch` strictly validates incoming responses
against `apiSuccessSchema` / `apiErrorSchema`; returning a raw body
produces a `PLATFORM_ENVELOPE_INVALID` error and the action dispatch
fails before your component sees data.

The `@tensaw/runtime` package exports two builders for this:

```ts
import { buildSuccessEnvelope, buildErrorEnvelope } from '@tensaw/runtime';
import { http, HttpResponse } from 'msw';

http.get('/api/v1/cases/:id', ({ params }) => {
  // Success path — wrap the data, then pass to HttpResponse.json
  return HttpResponse.json(buildSuccessEnvelope({ id: params.id, ... }));
});

http.get('/api/v1/cases/:id/missing', () => {
  // Error path — wrap with status code separately
  return HttpResponse.json(
    buildErrorEnvelope('CASE_NOT_FOUND', 'No such case.'),
    { status: 404 },
  );
});
```

Both builders attach a fresh `meta` block (`correlationId`, `timestamp`,
`apiVersion: 'v1'`) per call, matching the shape real backends produce.
`buildErrorEnvelope` accepts an optional `details` argument for
field-level validation errors and other structured context.

**Don't roll your own.** A new consumer hit `PLATFORM_ENVELOPE_INVALID`
during the Operations Console buildout because the envelope requirement
wasn't documented and the builders weren't exported. Both are now part
of the public runtime API; use them.

---

- **`PROP_CONVENTIONS.md`** — `disabled`, `loading`, `aria-*` on the
  primitives. Wired components inherit these from their bases.
- **`FORMS_GUIDE.md`** — `<ActionForm>` patterns in depth.
- **`CHOOSING_COMPONENTS.md`** — Picking presentational vs wired in
  context.
- Per-package READMEs in `packages/design-system/` and
  `packages/wired-components/` cover the architectural rationale.
