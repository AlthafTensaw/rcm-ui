# Choosing components

When the design system has 58 components, the question stops being "is
there a component for this?" and becomes "which one?" This doc is a
decision tree organized around what you're trying to accomplish.

The main ones first; everything else by category.

---

## I want the user to take an action

| Situation | Component |
| --- | --- |
| Single button, action is registered | `<ActionButton>` |
| Single button, custom orchestration | `<Button>` + `useActionMutation` |
| Destructive action (delete, void, void-and-rebill) | `<ConfirmActionButton>` |
| Multi-step orchestration after click | `<Button>` + manual handler |
| Icon-only action | `<IconButton>` (always with `aria-label`) |
| Several related actions in a kebab/overflow | `<ActionMenu>` |
| Form submission | `<ActionForm>` (if registered) or `<Form>` |
| Open a different page | `<Link>` (manual route) or `<ActionLink>` (action-driven) |
| Open an external URL | `<ExternalLink>` |

See `WIRING_PATTERNS.md` for the wired-vs-presentational split.

---

## I want the user to choose from a list

| Situation | Component |
| --- | --- |
| 1 of N, ≤ 5 visible options | `<RadioGroup>` |
| 1 of N, ≤ 50 options, no search | `<Select>` |
| 1 of N, large list or async source | `<Combobox>` |
| Many of N | `<MultiSelect>` |
| Boolean preference (settings) | `<Switch>` |
| Boolean acceptance (terms) | `<Checkbox>` |
| One of a small color set | `<ColorSwatch>` |
| Tabs to switch between views | `<Tabs>` |

**Mnemonic.** Visible-and-few → Radio. Hidden-but-known → Select. Searchable
→ Combobox. Multiple → MultiSelect. State preference → Switch. Acceptance →
Checkbox.

---

## I want to collect typed input

| Type of value | Component |
| --- | --- |
| Short free-form text | `<Input>` |
| Long free-form text | `<Textarea>` |
| Email | `<Input type="email">` |
| Password | `<Input type="password">` |
| Number | `<Input type="number">` (use `react-number-format` for formatted) |
| Date | `<DatePicker>` |
| Date range | `<DateRangePicker>` |
| Time | `<TimePicker>` |
| File | `<FileUpload>` |
| Color | `<ColorSwatch>` |

All field components compose with `<FormField>` for validation + label +
error display. See `FORMS_GUIDE.md`.

---

## I want to confirm something with the user

| Situation | Component |
| --- | --- |
| "Are you sure?" prompt before an action | `<ConfirmDialog>` (or `<ConfirmActionButton>` if action-driven) |
| Inline destructive confirmation in a row | `<ConfirmActionButton variant="destructive">` |
| Form-style overlay with inputs | `<Dialog>` |
| Slide-out form / detail panel | `<Drawer>` |
| Quick disambiguation popover | `<Popover>` |

---

## I want to inform the user about something

### Persistent — they can read it at their pace

| Severity / Context | Component |
| --- | --- |
| Inline alert in a page or section | `<Alert>` |
| Empty list / empty page | `<EmptyState>` |
| Field-level helper text | `<FormField helperText="…">` |
| Inline page-level form-submission error | `<FormError>` |

### Transient — they didn't ask for it

| Severity / Context | Component |
| --- | --- |
| Operation succeeded, fade out | `<Snackbar>` (or `pushToast` via `<ToastHost>`) |
| Operation failed, needs attention | `<Toast variant="error">` |
| Background event (new release, sync done) | `<Toast variant="info">` |

Mount `<ToastHost>` once at AppShell; calls to `pushToast()` from anywhere
will surface there. Don't manually render `<Toast>` in pages.

### Just to make a label more discoverable on hover

`<Tooltip>` — *only* for supplementary info. Don't use it as the only
accessible name.

---

## I want to show the user that something is loading

| Situation | Component |
| --- | --- |
| Inside a button waiting for a click handler | `<Button loading>` |
| Whole page or panel loading | `<Spinner>` (centered) |
| Skeleton placeholder while fetching list/cards | `<Skeleton>` |
| Section is loading data progressively | `<Spinner size="sm">` inline |
| Table is loading | `<DataExplorerWired loading>` (built-in skeleton rows) |

`<Skeleton>` is for content shapes you can roughly predict. `<Spinner>` is
the fallback when the shape is unknown.

---

## I want to label or tag something

| Situation | Component |
| --- | --- |
| Status (Filed, Denied, Paid) | `<Badge>` |
| Tag with optional remove button | `<Pill>` |
| Profile thumbnail | `<Avatar>` |
| Iconographic indicator | `<Icon>` (12 commonly-used icons exposed) |

`<Badge>` is for state ("Open"). `<Pill>` is for filters ("Payer: Medicare ✕"). Don't mix the two.

---

## I want to lay out a page

### Top-level

| Situation | Component |
| --- | --- |
| Whole-app shell (top nav + side nav + main + right panel) | `<AppShell>` |
| Top-level navigation bar | `<TopNav>` |
| Side navigation rail | `<SideNav>` |

### Content grouping

| Situation | Component |
| --- | --- |
| Self-contained content card | `<Card>` |
| Re-usable, self-fetching widget | `<Widget>` |
| Resizable content region | `<Panel>` |
| Tabbed content region | `<TabbedPanel>` |
| Heading + content region within a page | `<Section>` |
| Accordion / FAQ-style collapsing list | `<Accordion>` |

### Navigation aids

| Situation | Component |
| --- | --- |
| Page hierarchy crumb trail | `<Breadcrumbs>` |
| Multi-step form / wizard progress | `<Stepper>` |
| Tab strip within a panel | `<Tabs>` |

---

## I want to display a list / table of records

| Situation | Component |
| --- | --- |
| Self-fetching table with pagination, sort, search | `<DataExplorerWired>` |
| Static table with explicit data | `<DataExplorer>` (in `@tensaw/composition`) |
| Pagination controls only | `<Pagination>` |
| Schema-driven grid | `<SchemaDataGrid>` (in `@tensaw/composition`) |

**Rule of thumb.** If the page owns the data flow, use `<DataExplorerWired>`.
If the data comes from elsewhere (parent component, modal pre-fill, mocked
in tests), use `<DataExplorer>` directly.

---

## I want a power-user keyboard interaction

| Situation | Component |
| --- | --- |
| Global search / command palette | `<CommandPaletteWired>` |
| Manual command palette with curated entries | `<CommandPalette>` |
| Keyboard shortcuts inside a menu | `<DropdownMenuItem shortcut="⌘K">` |

---

## I want to show progress

`<Stepper>` — for sequential, named, finite steps with state (done /
current / pending / error).

`<Spinner>` — for unknown duration.

`<Skeleton>` — for known content shape.

---

## Special cases

### "I just need a div with the right padding"

That's `<Card>`, `<Section>`, or `<Panel>` depending on what's around it.
Reach for plain `<div>` only if none of those fit, then use Tailwind
spacing classes from `DESIGN_TOKENS.md`.

### "I need a fragment of UI that fetches data and re-renders"

That's a widget. Build it inside `<Widget>` so it picks up the lifecycle
hooks (visibility, refresh, instance ID).

### "I need a banner across the top of the page"

`<Alert>` with `variant="info"` or `variant="warning"`. Don't roll your
own.

### "I need a search input"

`<Input type="search">` works for free-form. `<Combobox>` for selecting
from a list. `<DataExplorerWired>` already includes search; don't add a
separate input next to it.

### "I need a thing that looks like a button but acts like a link"

If it's navigating (changing the URL), use `<Link>` (or `<ActionLink>` if
the destination is action-driven). Don't use a button styled like a link;
that breaks middle-click and right-click behavior.

If it's not navigating but you want a link's visual style, use
`<Button variant="link">`. The visual is the same; the semantics differ.

### "I need a stack of items where each is selectable"

If the items represent navigable destinations: `<SideNav>` if it's
top-level navigation; otherwise a list of `<Link>`s.

If they represent selectable values: `<RadioGroup>` for one-of-N visible,
`<MultiSelect>` for many.

### "I need to embed a nested form"

Don't nest `<Form>`. Instead, manage all fields in one outer `<Form>` and
group them visually using `<Section>` or `<Card>`. Nested forms break
Enter-to-submit and confuse RHF's context.

---

## When the answer is "none of the above"

Sometimes the right answer really is a custom component. Three guidelines:

1. **Start by reading `PROP_CONVENTIONS.md`** so the new component speaks
   the same prop dialect.
2. **Compose existing components** before building from scratch. A
   "claims-list-row" is a `<Card>` with a few `<Badge>`s and a button.
3. **Use design tokens** for any color, spacing, or typography (see
   `DESIGN_TOKENS.md`). Don't hardcode hex values.

When the same custom component appears in three places, that's the signal
to propose adding it to the design system or composition layer.

---

## Related

- **`WIRING_PATTERNS.md`** — Wired-vs-presentational decision rules.
- **`FORMS_GUIDE.md`** — Field selection inside forms.
- **`PROP_CONVENTIONS.md`** — Naming + behavior contracts.
- Per-component READMEs (in each `<Component>/README.md`) cover the
  finer-grained "when to use X over Y" within the same family.
