# Tensaw UI Developer Guide

This is the working developer's manual for the Tensaw UI library. It explains what each package contains, how they fit together, how to build a real page (using the AR Mgmt Portal as the worked example), and how to test it.

It is written for someone sitting in front of the codebase. Where there's a tradeoff between comprehensiveness and practicality, this document picks practicality.

---

## Table of contents

1. Mental model
2. Repository layout
3. The packages, in dependency order
4. The action contract
5. Composition primitives
6. The worklist archetype
7. Building a page: AR Mgmt Portal walkthrough
8. Testing strategy
9. Common patterns and gotchas
10. Where to look when things break

---

## 1. Mental model

The Tensaw UI is a **monorepo of small, layered packages** rather than one giant frontend. Pages don't write fetch calls. Pages don't write Redux. Pages don't write CSS frameworks. Pages declare:

- **Actions** — every backend call the page needs (`ar.list`, `ar.update-owner`, etc.)
- **Cells / fields** — how individual pieces of data render and edit
- **Composition** — what archetype the page uses and which slots are filled with what

The runtime, action package, design system, and composition primitives do everything else: store wiring, cache, optimistic updates, debounced preference saves, idle timeouts, permission gating, surface stack management, schema-driven grids, and standard loading/empty/error states.

Three rules stay true everywhere:

1. **Every backend call is a registered action with a stable id.** No raw `fetch` in pages.
2. **Hooks at the top, conditional returns below.** Pages and widgets follow React's rules of hooks strictly — and the integration tests will catch you if you don't.
3. **Compose, don't replicate.** If two pages need the same behavior, the right answer is almost always to push it into a primitive package, not copy it.

---

## 2. Repository layout

```
tensaw-ui/
├── apps/
│   └── patient/              # The patient-facing app (first vertical slice)
│       ├── src/
│       │   ├── AppShell.tsx      # Boot sequence + top-level routing
│       │   ├── App.tsx           # The "v3 demo" page (legacy showcase)
│       │   ├── main.tsx          # Vite entry
│       │   └── pages/
│       │       ├── ar-mgmt/      # ← The page this guide walks through
│       │       │   ├── ARMgmtPage.tsx
│       │       │   ├── actions.ts
│       │       │   └── cells.tsx
│       │       └── ar-detail/
│       │           └── ARDetailPage.tsx (stub)
│       ├── test/
│       │   ├── ar-mgmt.integration.test.tsx
│       │   └── helpers.tsx
│       ├── vitest.config.ts
│       ├── vitest.setup.ts
│       └── vite.config.ts
│
├── packages/
│   ├── runtime/              # Store, middleware, events, auth, config, HIPAA primitives
│   ├── actions/              # Action contract — defineAction, useActionQuery, etc.
│   ├── platform-rules/       # (Stub for future cross-cutting policy)
│   ├── codes/                # CPT/ICD/HCPCS/POS/state lookup tables
│   ├── design-system/        # Tokens, theme, primitives, RCM fields, validators
│   ├── visualization/        # Cells, KPI cards, status badges, charts (read-only)
│   ├── composition/          # ArchetypeShell, ZoneRenderer, WidgetHost, SchemaDataGrid, page chrome
│   ├── archetypes/           # Reserved for future cross-archetype helpers
│   ├── worklist/             # Search-list archetype primitives (FilterStrip, BulkActionBar, ...)
│   └── mock-server/          # MSW handlers + fixtures + Zod schemas (used in dev and tests)
│
├── tools/
│   ├── gen-page/             # CLI scaffolder (stub)
│   ├── gen-widget/           # CLI scaffolder (stub)
│   └── openapi-emitter/      # Emits openapi.yaml from registered actions
│
├── storybook/                # Component sandbox (stub)
├── docs/                     # Architecture documents
├── openapi/                  # Generated API specs (e.g. ar.yaml)
├── prompts/                  # AI generation prompt templates
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json        # Strict TS settings inherited by every package
└── tsconfig.json             # Project references
```

### Workspace conventions

- **Monorepo manager:** pnpm 9 (`pnpm-workspace.yaml`)
- **Package scope:** `@tensaw/*` (private — not published)
- **TypeScript:** strict + `noUncheckedIndexedAccess`. `tsconfig.base.json` sets the floor.
- **Module style:** ESM only. Every package has `"type": "module"`.
- **Commands run from the root:**
  - `pnpm install` — install all deps
  - `pnpm -r typecheck` — typecheck every package
  - `pnpm -r build` — build every library
  - `pnpm -r test` — run every package's vitest
  - `pnpm dev` — run all apps in parallel (currently just `apps/patient`)

---

## 3. The packages, in dependency order

Packages depend strictly downward in this list — `runtime` depends on nothing internal, `composition` depends on `runtime` + `design-system` + `visualization`, etc. If you find an upward dependency, it's a bug.

### 3.1 `@tensaw/runtime` — the foundation

Implements the platform's runtime primitives: Redux store, middleware, event bus, authenticated API client, HIPAA helpers, and the bootstrap thunk.

```
packages/runtime/src/
├── config/         # loadConfig() + the validated PlatformConfig singleton
├── auth/           # TokenProvider abstraction over AWS Amplify / mocks
├── api/            # authenticatedBaseQuery + envelope helpers
├── events/         # Event catalog, eventMiddleware, registerEventHandler
├── slices/         # Twelve slices: auth, app, context, ui, preferences,
│                   #   events, pageRuntime, widgets, surfaces, dirtyState,
│                   #   notifications, polling
├── middleware/     # preferenceMiddleware (debounced save), idleTimeoutMiddleware,
│                   #   errorListenerMiddleware
├── privacy/        # scrubString, scrubObject, auditPHI
├── bootstrap/      # bootstrapApp() thunk — auth + preferences hydration
├── store/          # configureStore + buildStore (overridable for tests)
├── types.ts        # All slice state types, defined once for circular safety
├── hooks.ts        # useAppDispatch, useAppSelector, useAppStore (typed)
└── index.ts        # Public surface
```

**Public surface (highlights):**

```ts
import {
  // Config
  config,                   // singleton PlatformConfig
  loadConfig,
  // Auth
  setTokenProvider,
  // Store
  store,                    // default singleton
  buildStore,               // for tests
  type RootState,
  type AppDispatch,
  // Hooks
  useAppDispatch,
  useAppSelector,
  // Slices (action creators + reducers)
  authReducer, signedIn, signedOut,
  uiReducer, setLeftPanelWidth, setRightPanelWidth,
  preferencesReducer, setDensity, setSavedView,
  widgetsReducer, registerWidget, markWidgetDisposed,
  surfacesReducer, openSurface, closeSurface,
  dirtyStateReducer, markDirty, clearDirty,
  notificationsReducer, pushToast, dismissToast,
  // ...
  // Middleware
  preferenceMiddleware, setPreferenceSaver,
  idleTimeoutMiddleware,
  // Bootstrap
  bootstrapApp,
  // Events
  publishEvent, buildEvent, registerEventHandler,
  // HIPAA
  scrubString, scrubObject, auditPHI,
} from '@tensaw/runtime';
```

**The slice catalog** (types live in `runtime/src/types.ts`):

| Slice | Purpose |
|---|---|
| `auth` | Signed-in user, permissions, clinic id, last activity timestamp |
| `app` | App id, current page id, initialized flag, global fatal error |
| `context` | Currently-selected entity ids (patientId, claimId, encounterId, etc.) |
| `ui` | Session-only panel widths, container expand/collapse, grid column visibility/sort/pageSize |
| `preferences` | Persisted versions of `ui` state — debounced save through middleware |
| `events` | Ring buffer of recent platform events (debugging) |
| `pageRuntime` | Current archetype, page lifecycle |
| `widgets` | Per-instance widget lifecycle (registered, error, dataLoaded, disposed) |
| `surfaces` | Stack of open modals/drawers/popups |
| `dirtyState` | Per-instance unsaved-changes tracking; pending route transitions |
| `notifications` | Toast queue |
| `polling` | Active polling subscriptions |

### 3.2 `@tensaw/actions` — typed backend calls

Implements the [Action Contract](../packages/actions/docs/ACTION_CONTRACT.md). Read that document if you're wiring new endpoints; this section is the operational summary.

```
packages/actions/src/
├── types/        # ActionDeclaration union, ActionResult, OptimisticPattern
├── registry/     # defineAction, getAction, _clearActionRegistry
├── dispatcher/   # dispatchAction, setActionStore, setRouterAdapter,
│                 #   readCacheValue, _clearActionCache
├── hooks/        # useActionQuery, useActionMutation, useActionDispatcher
├── patterns/     # applyOptimistic — built-in patch shapes
├── utils/        # parseEndpoint, deterministicStringify, resolveCacheKey
└── index.ts
```

**Action kinds (exactly four):**

| Kind | Purpose | Returns |
|---|---|---|
| `query` | Read data | `data` |
| `mutation` | Write data, possibly with optimistic update | `data` |
| `surface` | Open a modal/drawer/popup | (nothing — opens UI) |
| `navigate` | Change route | (nothing — navigates) |

**A query action declaration:**

```ts
import { defineAction } from '@tensaw/actions';
import { z } from 'zod';

defineAction({
  actionId: 'ar.list',
  kind: 'query',
  endpoint: 'GET /api/v1/ar',
  permission: 'ar.read',
  description: 'List AR rows with filter, sort, and pagination.',
  request: ARListRequestSchema,    // Zod schema
  response: ARListResponseSchema,
  cache: {
    tag: 'ar-list',
    invalidatedBy: [
      'ar.update-owner',
      'ar.update-due-date',
      'ar.bulk-update-owner',
      'claims.add-to-workflow',
    ],
  },
});
```

**A mutation action with optimistic update:**

```ts
defineAction({
  actionId: 'ar.update-owner',
  kind: 'mutation',
  endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
  permission: 'ar.write',
  request: z.object({
    rowId: z.string(),
    ownerId: z.string().nullable(),
  }),
  response: ARRowSchema,
  optimistic: {
    pattern: 'update-row-field',
    target: 'ar-list',
    rowIdFrom: (req) => (req as { rowId: string }).rowId,
    fields: (req) => ({ ownerId: (req as { ownerId: string | null }).ownerId }),
  },
  onSuccess: { toast: 'Owner updated' },
  onError: { toast: { kind: 'error-message' } },
});
```

**Built-in optimistic patterns** (in `packages/actions/src/patterns/optimistic.ts`):

- `update-row-field` — patch a row's fields by id
- `replace-row` — swap a whole row by id
- `append-row` — add a row to the end
- `prepend-row` — add a row to the front
- `remove-row` — drop a row by id
- `none` — no optimistic behavior

If your mutation needs custom merge logic, **the mutation should not include it** — promote that logic into a widget hook instead. The optimistic patterns are intentionally a small fixed set.

**The hooks:**

```tsx
// useActionQuery — fetch + subscribe
const { data, isLoading, isError, error, refetch } =
  useActionQuery<ARListResponse>('ar.list', {
    mode: 'working',
    pageIndex: 0,
    pageSize: 25,
  });

// useActionMutation — fire mutation, get state
const [updateOwner, { isLoading, isError }] = useActionMutation('ar.update-owner');
await updateOwner({ rowId: 'row_ar_001', ownerId: 'usr_kishore' });

// useActionDispatcher — raw escape hatch
const dispatch = useActionDispatcher();
const result = await dispatch('ar.update-owner', { ... }, { dryRun: true });
```

**Boot wiring** (called once, in your app's bootstrap):

```ts
import { setActionStore, setRouterAdapter } from '@tensaw/actions';
import { store } from '@tensaw/runtime';

setActionStore(store);
setRouterAdapter({
  push: (target: string) => navigate(target),
});
registerARActions(); // Your page's defineAction calls
```

### 3.3 `@tensaw/codes` — reference data

Pure data tables. CPT, ICD-10, HCPCS, POS, NUCC taxonomy, US states, ZIP code → state, CARC/RARC denial codes, CAS group codes, plan-type codes, workflow status codes, adjustment-reason codes.

```
packages/codes/src/
├── cpt/           # CPT code lookups
├── icd/           # ICD-10
├── hcpcs/
├── pos/
├── states/
├── zip/
├── nucc-taxonomy/
├── carc/, rarc/, cas-group/
├── adjustment-reason/, plan-type/, workflow/
└── index.ts
```

Each module exports `LOOKUP` (the table), `getX(code)` (single lookup), and helpers like `searchCpt(query)`. These power the design-system's coding fields (`<CptCodeField>`, `<IcdCodeField>`, etc.).

### 3.4 `@tensaw/design-system` — tokens, theme, primitives, RCM fields

The visual layer.

```
packages/design-system/src/
├── tokens/         # CSS variables (colors, spacing, typography)
├── theme/          # ThemeProvider — pushes tokens into :root
├── styles/         # global.css, reset
├── primitives/     # TextField (and the seed of more primitives)
├── privacy/        # PrivacyField — masking + reveal + audit
├── address/        # AddressField — Google Places integrated
├── coding/         # CptCodeField, IcdCodeField, HcpcsCodeField, PosCodeField, CodeSearchCombobox
├── rcm-fields/     # PhoneField, SsnField, EinField, NpiField, MoneyField, DateOfBirthField
├── validators/     # Zod schemas + helpers: phone, ssn, ein, npi, dob, money
└── index.ts
```

**Tokens** are CSS variables, not JS objects. The convention is `--tw-color-*`, `--tw-spacing-*`, etc. Components reference them inline with sensible fallbacks:

```ts
const style = {
  background: 'var(--tw-color-surface-raised, #FFFFFF)',
  color: 'var(--tw-color-text-primary, #1F2937)',
};
```

**RCM fields** know their own validation. `<EinField>` enforces 9 digits and rejects non-issued IRS prefixes. `<NpiField>` runs the Luhn checksum. `<PhoneField>` rejects 555-01XX (fictional reservation). The validators are also exported standalone for use in forms:

```ts
import { isValidEin, einSchema, formatEin } from '@tensaw/design-system';
```

**The `PrivacyField`** wraps any field with mask/reveal behavior. It logs every reveal through `auditPHI`. SSNs default to `***-**-NNNN`; you provide a custom `maskFn` for other field types.

### 3.5 `@tensaw/visualization` — read-only display components

Cells, KPI cards, status badges, charts, and document viewers. Strictly **display-only** — no editing, no field validation. Pages use these to render rows, cards, and charts.

```
packages/visualization/src/
├── cells/         # PrimitiveCells (TextCell, MoneyCell, DateCell), DomainCells (PriorityCell)
├── status/        # StatusBadge, PriorityDot, taxonomy.ts (status families)
├── kpi/           # KpiCard (number + delta), Indicators
├── display/       # WorklistItemCard, ReadOnlyFieldGrid, AlertCard, AssumptionsList,
│                  #   InsightCard, DefinitionPanel, TimelineEntry, AppointmentSlot
├── charts/        # (Recharts wrappers — building out)
├── documents/     # PDF/image preview surfaces
├── utils/         # formatMoney, formatPercent, formatInteger, formatDeltaPercent
└── index.ts
```

**Status taxonomy.** `taxonomy.ts` maps the platform's controlled status vocabulary to color families. `<StatusBadge status="denied">` resolves to the danger family, `<StatusBadge status="filed">` resolves to neutral, etc. Pages don't pick colors — they pass the status string and the badge picks.

### 3.6 `@tensaw/composition` — layout and orchestration

The largest package. This is where pages get assembled.

```
packages/composition/src/
├── types/          # WidgetEntry, ContainerEntry, ZoneEntry, PageComposition,
│                   #   ArchetypeShellProps
├── registry/       # widgetRegistry — registerWidget(), getWidgetRegistration()
├── states/         # LoadingState, EmptyState, ErrorState, PermissionDeniedState
├── widgets/        # WidgetHost — resolves widgetId, gates by permission,
│                   #   wraps in error boundary, emits lifecycle events
├── containers/     # ContainerRenderer — chrome (title, collapse, tabs)
├── zones/          # ZoneRenderer — declarative or bespoke
├── shells/         # ArchetypeShell — three-panel, full-width, dashboard, etc.
├── surfaces/       # SurfaceHost — modal/drawer/popup stack manager
├── grids/          # SchemaDataGrid — schema-driven table on TanStack Table
├── chrome/         # PageHeader, AppLauncher, NotificationBell, UserMenu,
│                   #   GlobalAlertBanner, SavedViewSelector, TabsWithCount,
│                   #   HelpButton
└── index.ts
```

**The composition stack, top-down:**

```
ArchetypeShell           ← picks a layout (3-panel, full-width, dashboard, ...)
  ├─ ZoneRenderer        ← left/main/right zones
  │    ├─ ContainerRenderer  ← chrome + collapse + tabs
  │    │    └─ WidgetHost    ← permission gate + error boundary + lifecycle
  │    │         └─ <Widget />
  │    └─ ContainerRenderer
  │         └─ ...
  └─ ZoneRenderer
       └─ ...
SurfaceHost              ← rendered as a sibling, manages modal/drawer stack
```

**SchemaDataGrid** is special — it's the workhorse table component. Built on TanStack Table v8. You give it a column array and rows; it handles sort, selection, column visibility, density, sticky headers, row click, and per-cell renderers:

```tsx
<SchemaDataGrid<ARRow>
  rows={rows}
  columns={columns}              // SchemaDataGridColumn<ARRow>[]
  getRowId={(r) => r.id}
  selection={selection}
  onSelectionChange={setSelection}
  selectionMode="multi"
  onRowClick={(row) => onRowClick?.(row.id)}
  sort={sort}
  onSortChange={setSort}
  columnVisibility={visibility}
  onColumnVisibilityChange={setVisibility}
  density="compact"
/>
```

**WidgetHost lifecycle.** When a `<WidgetHost>` mounts, it dispatches `registerWidget` to the `widgets` slice. When it unmounts, it dispatches `markWidgetDisposed`. If the widget throws during render, the error boundary catches it, dispatches `setWidgetError`, and renders an `<ErrorState>` instead of crashing the page.

### 3.7 `@tensaw/worklist` — search-list archetype primitives

Everything you need to build a list-based portal page with filters, multi-select, column visibility, bulk actions, and pagination.

```
packages/worklist/src/
├── primitives/
│   ├── FilterStrip.tsx               # Horizontal chip rail
│   ├── MultiSelectComboboxFilter.tsx # The filter chip itself
│   ├── ColumnVisibilityMenu.tsx      # Show/hide columns drop-down
│   ├── BulkActionBar.tsx             # Sticky bar shown when rows selected
│   ├── WorklistTotalsFooter.tsx      # Footer with paging + totals slot
│   ├── ModeToggle.tsx                # Segmented control (e.g. "Working" ↔ "Add to workflow")
│   └── WorklistShell.tsx             # The orchestrator that wires them all
├── useColumnVisibility.ts            # Hook — column visibility state + persistence
└── index.ts
```

`WorklistShell` is the assembly point. You hand it a filter strip, a bulk action bar, rows, columns, selection state, and pagination state. It places everything in the right slot, renders the column-visibility menu, sticks the footer, and shows empty/loading states automatically.

### 3.8 `@tensaw/mock-server` — MSW handlers + fixtures

```
packages/mock-server/src/
├── schemas/        # Zod schemas — ARRow, ARListRequest, ARListResponse, RefDataItem
├── fixtures/       # Deterministic mock data — arRows.ts, refData.ts
├── handlers/       # buildARHandlers(baseUrl), arState.ts (mutable in-memory store)
└── index.ts
```

In dev, `AppShell` starts MSW in the browser via `setupWorker(...buildARHandlers(config.api.baseUrl))`. In tests, the patient app's `vitest.setup.ts` runs MSW in node via `setupServer(...)`. Same handlers, different transport.

`resetMockARState()` is called between tests so mutations from one test don't leak into the next.

### 3.9 `@tensaw/archetypes`, `@tensaw/platform-rules`

Reserved package shells. The plan is for `archetypes` to host shared cross-archetype helpers and for `platform-rules` to host policy primitives (rate limits, retry policy, etc.) once we hit those problems.

---

## 4. The action contract

A few principles, then the reference.

**Principles:**

1. **Every backend call is a registered action.** The action id is permanent; renaming requires a deprecation cycle.
2. **Actions describe what, not how.** No business logic. No conditional branches. The moment you reach for an `if`, you have a widget hook, not an action.
3. **Cache invalidation is declarative.** Either the query lists who invalidates it (`invalidatedBy`) or the mutation lists what it invalidates (`invalidates`). Both work; pick one and stick to it per page.
4. **Optimistic updates use built-in patterns.** Custom merge logic is a code smell.
5. **Errors return, they don't throw.** `dispatchAction()` returns `{ ok: true, data }` or `{ ok: false, error: { code, message } }` — always.

**Field reference (common):**

| Field | Required | Notes |
|---|---|---|
| `actionId` | yes | `<domain>.<verb>` form, permanent |
| `kind` | yes | `'query' \| 'mutation' \| 'surface' \| 'navigate'` |
| `description` | optional but encouraged | Used by tooling |
| `permission` | optional | Resolved against `state.auth.user.permissions` |
| `timeoutMs` | optional | Default 30s. For known long calls (bulk, exports) bump it |

**Query-only:**

| Field | Required |
|---|---|
| `endpoint` | yes — `'GET /path/{rowId}'` |
| `request` | yes — Zod schema |
| `response` | yes — Zod schema |
| `cache.tag` | yes |
| `cache.invalidatedBy` | optional |
| `cacheKey` | optional — override deterministic stringify |

**Mutation-only:**

| Field | Required |
|---|---|
| `endpoint` | yes |
| `request` / `response` | yes |
| `optimistic` | optional — defaults to `{ pattern: 'none' }` |
| `invalidates` | optional |
| `onSuccess.toast` | optional — string, function, or undefined |
| `onError.toast` | optional |

**Surface-only:**

| Field | Required |
|---|---|
| `surfaceKind` | yes — `'modal' \| 'drawer' \| 'popup'` |
| `componentId` | yes — registry key for the surface body |
| `request` | yes |
| `propsFromArgs` | optional — maps args to component props |

**Navigate-only:**

| Field | Required |
|---|---|
| `request` | yes |
| `to` | yes — `(args) => '/some/path'` |

**A `dryRun` mode** is supported for any action. Pass `{ dryRun: true }` in `DispatchOptions` and the dispatcher returns `{ ok: true, data: { dryRun: true, wouldDispatch: { method, url, body } } }` without touching the network. Useful for AI generators and debugging.

For the full spec, read `packages/actions/docs/ACTION_CONTRACT.md` (560 lines, locked through §15).

---

## 5. Composition primitives

The composition package gives you the layout vocabulary every page uses.

### 5.1 ArchetypeShell

Picks a layout. Today the worklist archetype is the most polished; three-panel detail is being built.

```tsx
<ArchetypeShell archetype="search-list" pageId="ar-mgmt">
  {/* zones go here */}
</ArchetypeShell>
```

In practice, archetype-specific shells (like `WorklistShell`) wrap `ArchetypeShell` and present a more focused API.

### 5.2 ZoneRenderer

A **zone** is a region of the page (e.g. "left", "main", "right"). A zone can be **declarative** (a list of containers) or **bespoke** (a render function).

Most pages don't touch ZoneRenderer directly — they use a shell. But the rendering chain is good to know about because errors will show up in stack traces with these names.

### 5.3 ContainerRenderer

A **container** is a chrome-wrapped grouping of widgets. It owns the title bar, the collapse/expand button, and (optionally) tabs. Containers persist their expanded state and active tab id in the `ui` slice, keyed by `${pageId}:${containerId}`.

### 5.4 WidgetHost

The most important component to internalize. It is the boundary between the page composition layer and the widget itself.

What it does, in order:

1. Resolves the component (registry lookup or escape-hatch `component` prop)
2. Computes required permission (entry override → registration default → none)
3. Reads the user's permissions from the `auth` slice
4. Renders an `<ErrorState>` if the widget can't be resolved
5. Renders a `<PermissionDeniedState>` if the user lacks permission
6. Otherwise dispatches `registerWidget` and renders the widget inside an error boundary
7. Cleans up by dispatching `markWidgetDisposed` on unmount
8. If the widget throws during render, dispatches `setWidgetError` and shows an `<ErrorState>` with the error message

Widgets receive a typed `WidgetProps`:

```ts
interface WidgetProps {
  instanceId: string;
  widgetId: string;
  containerId: string;
  pageId: string;
  staticProps: Record<string, unknown>;
}
```

Use the `instanceId` for state keying (e.g. column visibility). Use `pageId` for preference scoping.

### 5.5 SchemaDataGrid

Schema-driven table. Pass it columns and rows; it produces a fully-functional grid with sort, selection, column visibility, density, and per-cell renderers. Backed by TanStack Table v8.

A column declaration:

```ts
interface SchemaDataGridColumn<TRow> {
  id: string;
  header: string | ReactNode;
  cell: (ctx: { row: TRow }) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  truncate?: 'none' | 'tail';
  defaultHidden?: boolean;
  sortable?: boolean;
}
```

**Hooks rule reminder.** All hooks (including `useMemo` for column maps and derived state) must run on every render. We caught a real bug where a `useMemo` was placed *after* an early `if (rows.length === 0) return ...`. The first render had no rows, the early return ran, and the second render — when data arrived — called more hooks than the first. React threw "Rendered more hooks than during the previous render." If you write a grid-adjacent component, put **every** hook above **every** conditional return.

### 5.6 SurfaceHost

Manages the stack of open modals, drawers, and popups. Backed by the `surfaces` slice.

```tsx
import { openSurface, closeSurface } from '@tensaw/runtime';

dispatch(openSurface({
  surfaceKind: 'modal',
  componentId: 'eob.preview',
  props: { remitId: 'r-1' },
}));
```

Surface actions are the preferred way to open surfaces — they're declarative and dry-runnable.

### 5.7 Page chrome

Stock components for top-of-page concerns: `<PageHeader>`, `<AppLauncher>`, `<NotificationBell>`, `<UserMenu>`, `<HelpButton>`, `<GlobalAlertBanner>`, `<SavedViewSelector>`, `<TabsWithCount>`. Use them; don't roll your own.

---

## 6. The worklist archetype

A worklist page is: a header, a filter strip, a bulk-action bar that appears on selection, a table, and a totals/paging footer.

### Primitives

```tsx
import {
  FilterStrip,                  // The container for filter chips
  MultiSelectComboboxFilter,    // A single filter chip with inline + "+N more"
  ColumnVisibilityMenu,         // Show/hide columns dropdown
  BulkActionBar,                // The sticky bar shown when rows selected
  WorklistTotalsFooter,         // Footer with totals + paging
  ModeToggle,                   // Segmented control
  WorklistShell,                // The orchestrator
  useColumnVisibility,          // Persisted column visibility hook
} from '@tensaw/worklist';
```

### `useColumnVisibility`

Persists per-user column visibility to the `preferences` slice (and from there, debounced through `preferenceMiddleware` to the backend).

```ts
const {
  visibility,         // Record<string, boolean> — column id → visible
  setVisibility,      // setter that triggers persistence
  resetVisibility,    // back to schema defaults
} = useColumnVisibility({
  pageId: 'ar-mgmt',
  gridId: 'ar-list',
  columns,            // SchemaDataGridColumn<ARRow>[]
});
```

### `WorklistShell`

The full assembly. You hand it pieces; it places them in the right slots:

```tsx
<WorklistShell<ARRow>
  topSlot={null}
  filterStrip={filterStrip}
  bulkActionBar={bulkActionBar}
  rows={rows}
  columns={columns}
  getRowId={(r) => r.id}
  selection={selection}
  onSelectionChange={setSelection}
  selectionMode="multi"
  onRowClick={(row) => onRowClick?.(row.id)}
  sort={sort}
  onSortChange={setSort}
  columnVisibility={visibility}
  onColumnVisibilityChange={setVisibility}
  onColumnVisibilityReset={resetVisibility}
  pageIndex={pageIndex}
  pageSize={pageSize}
  totalCount={totalCount}
  onPageChange={setPageIndex}
  onPageSizeChange={setPageSize}
  footerTotalsSlot={totalsSlot}
  density="compact"
/>
```

The `bulkActionBar` is the only slot that's allowed to be conditional — `WorklistShell` shows it only when the parent passes a non-null element. Most pages pass `{selectedIds.length > 0 ? <BulkActions ... /> : null}`.

---

## 7. Building a page: AR Mgmt Portal walkthrough

Now the practical part. We'll walk through the AR Mgmt Portal — `apps/patient/src/pages/ar-mgmt/`. Three files:

- **`actions.ts`** (228 lines) — every backend call the page needs
- **`cells.tsx`** (216 lines) — inline cell editors and read-only renderers
- **`ARMgmtPage.tsx`** (639 lines) — the page itself

### 7.1 Actions

Open `actions.ts`. It exports a single function, `registerARActions()`, which calls `defineAction` once per action id. The app's bootstrap calls this once at startup.

The action set includes:

| Action id | Kind | Endpoint | Role |
|---|---|---|---|
| `ar.list` | query | `GET /api/v1/ar` | List rows |
| `ar.get-detail` | query | `GET /api/v1/ar/{rowId}` | Single-row fetch |
| `ref.clinics`, `ref.providers`, `ref.payers`, `ref.owners` | query | `GET /api/v1/ref/...` | Filter chip lookups |
| `ar.update-owner` | mutation | `PATCH /api/v1/ar/{rowId}/owner` | Inline owner edit |
| `ar.update-due-date` | mutation | `PATCH /api/v1/ar/{rowId}/due-date` | Inline due-date edit |
| `ar.bulk-update-owner` | mutation | `PATCH /api/v1/ar:bulk-update-owner` | Bulk owner |
| `ar.bulk-update-due-date` | mutation | `PATCH /api/v1/ar:bulk-update-due-date` | Bulk due date |
| `claims.add-to-workflow` | mutation | `POST /api/v1/workflow/cases:bulk` | Switch mode mutation |
| `ar.open-detail` | navigate | — | Row click → detail page |

Notice three things:

- **`ar.list` declares its invalidators upstream** (in its `cache.invalidatedBy`). When any owner-update or due-date-update mutation succeeds, the `ar-list` cache flushes and rerenders.
- **The single-row mutations declare `optimistic: { pattern: 'update-row-field', ... }`.** The cell updates immediately on edit; the cache reverts only if the server rejects.
- **The bulk mutations don't declare `optimistic`.** Bulk updates go through the full request → response cycle before rerendering. That's a deliberate choice — bulk merge logic is exactly the kind of code we don't want in actions.

### 7.2 Cells

Open `cells.tsx`. Each cell is a small React component that takes a row plus optional context (e.g. the owners list) and renders. Editor cells use `useActionDispatcher` directly:

```tsx
export function OwnerCell({ row, owners }: OwnerCellProps) {
  const dispatch = useActionDispatcher();
  const [pending, setPending] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value === '' ? null : e.target.value;
    if (next === row.ownerId) return;
    setPending(true);
    await dispatch('ar.update-owner', { rowId: row.id, ownerId: next });
    setPending(false);
  };

  return (
    <select
      value={row.ownerId ?? ''}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}    // don't toggle row selection
      disabled={pending}
    >
      <option value="">Unassigned</option>
      {owners.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}
```

Three details worth calling out:

1. **`onClick={(e) => e.stopPropagation()}`** — the table row's `onClick` toggles selection. Inline editors must stop propagation, or every interaction with the editor would also toggle the row. This bites everyone the first time.
2. **The cell doesn't update local state on success.** The optimistic pattern in the action declaration patches the cache, the cache change re-renders the row, the re-render passes a new `row` prop with the new value. Cells stay simple.
3. **No try/catch around `dispatch()`.** Dispatch returns a result object — `{ ok: false, error }` for failures — and the action's `onError.toast` policy handles user-facing reporting.

### 7.3 The page

Open `ARMgmtPage.tsx`. The page is a single function component, ~640 lines, organized into clearly-marked sections:

```ts
export function ARMgmtPage({ onRowClick }: ARMgmtPageProps) {
  // ---- Mode --------------------------------------------------------------
  const [mode, setMode] = useState<WorklistMode>('working');

  // ---- Filters (controlled, owned by the page) --------------------------
  const [clinicIds, setClinicIds] = useState<readonly string[]>([]);
  const [providerIds, setProviderIds] = useState<readonly string[]>([]);
  const [payerIds, setPayerIds] = useState<readonly string[]>([]);
  const [ownerIds, setOwnerIds] = useState<readonly string[]>([]);

  // ---- Sort + paging (controlled) ---------------------------------------
  const [sort, setSort] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // ---- Selection --------------------------------------------------------
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.entries(selection).filter(([, v]) => v).map(([k]) => k),
    [selection],
  );

  // ---- Reference data (queries) ----------------------------------------
  const clinicsQ   = useActionQuery<RefDataResponse>('ref.clinics', {});
  const providersQ = useActionQuery<RefDataResponse>('ref.providers', {});
  const payersQ    = useActionQuery<RefDataResponse>('ref.payers', {});
  const ownersQ    = useActionQuery<RefDataResponse>('ref.owners', {});

  // ---- AR list query ----------------------------------------------------
  const listRequest = useMemo(
    () => ({ mode, clinicIds, providerIds, payerIds, ownerIds, sort, pageIndex, pageSize }),
    [mode, clinicIds, providerIds, payerIds, ownerIds, sort, pageIndex, pageSize],
  );
  const listQ = useActionQuery<ARListResponse>('ar.list', listRequest);

  // ---- Mutations -------------------------------------------------------
  const [bulkUpdateOwner]    = useActionMutation('ar.bulk-update-owner');
  const [bulkUpdateDueDate]  = useActionMutation('ar.bulk-update-due-date');
  const [addToWorkflow]      = useActionMutation('claims.add-to-workflow');

  // ---- Columns ---------------------------------------------------------
  const columns = useMemo<SchemaDataGridColumn<ARRow>[]>(() => [
    { id: 'patient', header: 'Patient', cell: ({ row }) => <PatientCell row={row} /> },
    { id: 'clinic',  header: 'Clinic',  cell: ({ row }) => <span>{row.clinicName}</span> },
    { id: 'owner',   header: 'Owner',
      cell: ({ row }) => <OwnerCell row={row} owners={ownersQ.data?.items ?? []} /> },
    { id: 'dueAt',   header: 'Due date', cell: ({ row }) => <DueDateCell row={row} /> },
    { id: 'priority', header: 'Priority', cell: ({ row }) => <PriorityCell value={row.priority} /> },
    { id: 'status',  header: 'Status',   cell: ({ row }) => <StatusCell value={row.status} /> },
    { id: 'balance', header: 'Balance', align: 'right',
      cell: ({ row }) => <BalanceCell value={row.balance} /> },
  ], [ownersQ.data]);

  // ---- Column visibility (persisted) -----------------------------------
  const { visibility, setVisibility, resetVisibility } = useColumnVisibility({
    pageId: 'ar-mgmt',
    gridId: 'ar-list',
    columns,
  });

  // ---- Filter strip ----------------------------------------------------
  const filterStrip = (
    <FilterStrip
      activeFilterCount={activeFilterCount}
      onClearAll={clearAllFilters}
    >
      <MultiSelectComboboxFilter
        label="Clinic"
        items={clinicsQ.data?.items ?? []}
        selectedIds={clinicIds}
        onChange={setClinicIds}
      />
      {/* Provider, Payer, Owner identical pattern */}
    </FilterStrip>
  );

  // ---- Bulk action bar (mode-specific) ---------------------------------
  const bulkActionBar = mode === 'working'
    ? <WorkingBulkActions selectedIds={selectedIds} owners={...} onSelectOwner={...} onSetDueDate={...} />
    : <AddToWorkflowBulkActions selectedIds={selectedIds} onAddToWorkflow={...} />;

  // ---- Mode toggle -----------------------------------------------------
  const modeToggle = (
    <ModeToggle<WorklistMode>
      value={mode}
      onChange={(next) => { setMode(next); clearSelection(); setPageIndex(0); setSort(null); }}
      options={[
        { id: 'working',         label: 'Working list',   count: workingCountQ.data?.totalCount },
        { id: 'add-to-workflow', label: 'Add to workflow', count: candidateCountQ.data?.totalCount },
      ]}
    />
  );

  // ---- Render ----------------------------------------------------------
  return (
    <div>
      <PageHeader title="AR Mgmt Portal" actions={modeToggle} />
      <WorklistShell<ARRow>
        topSlot={null}
        filterStrip={filterStrip}
        bulkActionBar={selectedIds.length > 0 ? bulkActionBar : null}
        rows={listQ.data?.rows ?? []}
        columns={columns}
        getRowId={(r) => r.id}
        selection={selection}
        onSelectionChange={setSelection}
        selectionMode="multi"
        onRowClick={(row) => onRowClick?.(row.id)}
        sort={sort}
        onSortChange={(next) => { setSort(next); setPageIndex(0); }}
        columnVisibility={visibility}
        onColumnVisibilityChange={setVisibility}
        onColumnVisibilityReset={resetVisibility}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={listQ.data?.totalCount ?? 0}
        onPageChange={setPageIndex}
        onPageSizeChange={(n) => { setPageSize(n); setPageIndex(0); }}
        footerTotalsSlot={totalsSlot}
        density="compact"
      />
    </div>
  );
}
```

Patterns to internalize from this:

- **State is local.** Filters, selection, sort, paging, and mode all live in `useState`. Nothing lifts to Redux except things that genuinely cross instances (auth, surfaces, etc.).
- **Reference data is just more queries.** `clinicsQ`, `providersQ`, `payersQ`, `ownersQ` use the same `useActionQuery` hook as the list itself.
- **`listRequest` is memoized.** Without `useMemo`, every render rebuilds the request object, which (because the cache key is derived from a deterministic stringify of the request) wouldn't actually re-fetch — but it would create new objects unnecessarily. The memo also makes downstream `useEffect` deps stable.
- **The columns array is memoized too** because it depends on `ownersQ.data` (the Owner cell needs the owners list). When owners change, the columns rebuild; otherwise they stay stable.
- **Mode change resets dependent state.** Switching to "Add to workflow" clears selection, resets pagination, and clears sort. Otherwise stale selection from one fixture would carry into the other.
- **The bulk action bar is mode-specific.** Two different bulk-bar components, each with its own action set.
- **Row click is one-shot.** `onRowClick` calls `onRowClick?.(row.id)`, which the AppShell wires to navigation.

### 7.4 Bootstrap wiring

The page doesn't bootstrap itself. `apps/patient/src/AppShell.tsx` does, once:

```tsx
async function bootstrap() {
  setActionStore(store);
  setRouterAdapter({
    push: (target: string) => { /* parse and route */ },
  });
  registerARActions();

  if (import.meta.env.DEV) {
    const { setupWorker } = await import('msw/browser');
    const { buildARHandlers } = await import('@tensaw/mock-server');
    const worker = setupWorker(...buildARHandlers(config.api.baseUrl));
    await worker.start({ quiet: true, onUnhandledRequest: 'bypass' });
  }
}
```

In production, MSW doesn't start — calls go to the real backend.

---

## 8. Testing strategy

The library is tested at three levels.

### 8.1 Unit tests (per-package)

Each package has its own `vitest` config and runs in isolation. Run a single package's tests with:

```
pnpm --filter @tensaw/runtime test
```

Or all packages:

```
pnpm -r test
```

Patterns enforced across the suite:

- **`vitest.setup.ts` stubs `import.meta.env`** for any package that imports `@tensaw/runtime` (because the runtime config is loaded eagerly at module init). Without these stubs the very first import throws "Invalid platform configuration."
- **`afterEach(cleanup)` from `@testing-library/react`** runs in every package that mounts components. We learned this the hard way — without it, DOM nodes from previous tests pollute selectors and cause "found multiple elements with role X" failures that look like component bugs.
- **`vi.useFakeTimers()` + `act()` for timer-driven tests.** Advancing fake timers does not flush React state updates by itself; wrap `vi.advanceTimersByTime(ms)` in `act(() => { ... })` whenever the timer drives a state change.
- **Validators test the full input, not the truncated form.** When a `stripFoo()` truncates input for formatting, `isValidFoo()` must count raw digits, not call `stripFoo` and then count — otherwise too-long input is silently accepted.

### 8.2 Integration tests (per-app)

The patient app has end-to-end integration tests in `apps/patient/test/` that mount the **real** page against the **real** action package and the **real** runtime store, with MSW responses coming from the **real** mock-server handlers running in node.

Setup is in two files:

**`apps/patient/vitest.setup.ts`** — runs before any test module:

```ts
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Env stubs FIRST — runtime config is eagerly loaded at module init.
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.tensaw.local');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_test');
// ... other VITE_* keys

// MSW server in node.
const { setupServer } = await import('msw/node');
const { buildARHandlers, resetMockARState } = await import('@tensaw/mock-server');
const server = setupServer(...buildARHandlers('https://api.test.tensaw.local'));

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockARState();
});
afterAll(() => server.close());
```

**`apps/patient/test/helpers.tsx`** — shared store factory and bootstrap:

```ts
export function bootstrapForTest(options: BootstrapOptions = {}) {
  const store = makeIntegrationStore();
  setActionStore(store);
  _clearActionRegistry();    // tests don't share global state
  _clearActionCache();
  store.dispatch(signedIn({ user: { ..., permissions: options.permissions ?? [...] } }));
  registerARActions();
  return store;
}

export function renderWithStore(ui: ReactElement, store: ReturnType<typeof makeIntegrationStore>) {
  return render(<Provider store={store}>{ui}</Provider>);
}
```

### 8.3 The four AR Mgmt integration tests

`apps/patient/test/ar-mgmt.integration.test.tsx`:

**Test 1 — initial mount + list query:**

```ts
it('mounts, queries the AR list via MSW, and renders rows', async () => {
  const store = bootstrapForTest();
  renderWithStore(<ARMgmtPage onRowClick={() => undefined} />, store);

  expect(screen.getByText(/AR Mgmt Portal/i)).toBeDefined();

  await waitFor(() => {
    const patients = screen.queryAllByText(/Andrews|Binoy|Patel|Stiles/);
    expect(patients.length).toBeGreaterThan(0);
  }, { timeout: 10000 });
});
```

This proves: config loads, store builds, action registers, `useActionQuery('ar.list')` fires, MSW intercepts, the response unwraps the envelope, the cache writes, the row renders.

**Test 2 — inline owner edit (optimistic mutation):**

```ts
it('inline owner edit dispatches ar.update-owner and updates the cell', async () => {
  const user = userEvent.setup();
  const store = bootstrapForTest();
  renderWithStore(<ARMgmtPage onRowClick={() => undefined} />, store);

  // Wait for rows to render.
  await waitFor(() => {
    expect(screen.queryAllByText(/Andrews/).length).toBeGreaterThan(0);
  }, { timeout: 10000 });

  // Find the owner select on row_ar_001 (current value: usr_vineeth).
  const ownerSelects = screen
    .getAllByRole('combobox')
    .filter((el): el is HTMLSelectElement =>
      el instanceof HTMLSelectElement && el.value === 'usr_vineeth');

  const firstSelect = ownerSelects[0]!;
  await user.selectOptions(firstSelect, 'usr_kishore');

  // Optimistic update: cell reflects the new value immediately.
  await waitFor(() => expect(firstSelect.value).toBe('usr_kishore'));
  await waitFor(() => expect(firstSelect.disabled).toBe(false));
});
```

This proves: `useActionDispatcher` works, the optimistic patch lands in the cache, the cell re-renders with the new value, MSW handles PATCH, the select re-enables on response.

**Test 3 — mode switch:**

```ts
it('mode toggle switches the visible row set', async () => {
  const user = userEvent.setup();
  const store = bootstrapForTest();
  renderWithStore(<ARMgmtPage onRowClick={() => undefined} />, store);

  await waitFor(() => {
    expect(screen.queryAllByText(/Andrews/).length).toBeGreaterThan(0);
  }, { timeout: 10000 });

  const addToWorkflowTab = screen.getByRole('tab', { name: /add to workflow/i });
  await user.click(addToWorkflowTab);

  await waitFor(() => {
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  }, { timeout: 10000 });
});
```

This proves: cache key changes correctly when the request shape changes, the second mode's fixture rows render.

**Test 4 — row selection reveals bulk action bar:**

```ts
it('selecting rows reveals the bulk-action bar with the correct count', async () => {
  const user = userEvent.setup();
  const store = bootstrapForTest();
  renderWithStore(<ARMgmtPage onRowClick={() => undefined} />, store);

  await waitFor(() => {
    expect(screen.queryAllByText(/Andrews/).length).toBeGreaterThan(0);
  }, { timeout: 10000 });

  expect(screen.queryByText(/\d+ selected/)).toBeNull();

  const tableRows = document.querySelectorAll('tbody tr');
  const firstRow = tableRows[0]!;
  const secondRow = tableRows[1]!;
  await user.click(firstRow.querySelector('td')!);
  await user.click(secondRow.querySelector('td')!);

  await waitFor(() => expect(screen.getByText(/2 selected/)).toBeDefined());
});
```

This proves: row-click selection toggling, selection state propagation, `BulkActionBar`'s render gate (`if selectedIds.length === 0 return null`), and count display.

### 8.4 Writing your own integration tests

When you add a new page, copy the pattern:

1. Add a `vitest.setup.ts` to your app if one doesn't exist (env stubs + MSW + cleanup).
2. Add a `test/helpers.tsx` with a `bootstrapForTest()` and `renderWithStore()`.
3. Write tests that **don't mock the action package**. Mock only the bottom layer (network, via MSW). Everything above it should be real.
4. Use `userEvent`, not `fireEvent`, except in narrow cases. `userEvent` simulates the full click-input-blur sequence that real users produce.
5. Use `waitFor` generously. Async data + RTK Query's defer + React's batching means most assertions need to wait.
6. **Reset global state between tests:** `_clearActionRegistry()`, `_clearActionCache()`, `resetMockARState()`, RTL `cleanup()`. The integration helper does this for you.

### 8.5 Running tests

```
# Single test file, single it()
pnpm --filter @tensaw/app-patient exec vitest run test/ar-mgmt.integration.test.tsx -t "inline owner edit"

# Whole patient app
pnpm --filter @tensaw/app-patient test

# Whole monorepo
pnpm -r test
```

### 8.6 What the tests have caught (so far)

- **`SchemaDataGrid` hooks-rule violation** — `useMemo` placed below an early `if (rows.length === 0) return ...`. First render: empty rows, fewer hooks. Second render: data arrived, more hooks. React threw. The integration test surfaced it; unit tests in isolation never would have because they didn't exercise the populated → empty → populated transition.
- **Phone number 555-01XX rule had area code and exchange code swapped.** Test for `(212) 555-0123` exposed it.
- **`stripEin` truncated input to 9 digits**, so `isValidEin('87-32639712')` (10 raw digits) was returning true. Validator now counts raw digits before truncation.
- **Composition tests were finding leaked DOM nodes** because `globals: false` in the vitest config meant testing-library's auto-cleanup never ran.

---

## 9. Common patterns and gotchas

### 9.1 Do put hooks at the top

Every hook — `useState`, `useMemo`, `useCallback`, `useEffect`, `useAppSelector`, `useActionQuery` — must be called on every render. Conditional returns go below them. **Never** put a hook below an early return.

### 9.2 Don't fetch outside an action

If you find yourself writing `fetch(...)` or `axios(...)` directly, stop. Define an action. The benefits: cache, invalidation, optimistic, permissions, consistent error shapes, and free OpenAPI emission.

### 9.3 Don't reach into the cache from a component

`readCacheValue()` and `subscribeToCacheKey()` exist for the dispatcher and for very rare introspection cases. From a component, use `useActionQuery(...)` and accept the data prop.

### 9.4 Don't share state through globals

Tests demonstrated this is real: the action registry is global, the action cache is global, the mock AR state is global. Tests reset all three between cases. In production, the registry is set once during bootstrap, the cache is per-session, and the mock state doesn't exist (real backend). But the global-ness is real and worth being aware of when designing widgets — your widget shouldn't mutate or rely on undisclosed global state.

### 9.5 Stop click propagation in cell editors

```tsx
<select onClick={(e) => e.stopPropagation()}>
```

Without this, every click on the editor toggles row selection.

### 9.6 Memoize request objects passed to `useActionQuery`

```ts
const listRequest = useMemo(() => ({ mode, pageIndex, pageSize, ... }), [mode, pageIndex, pageSize, ...]);
const listQ = useActionQuery<Resp>('ar.list', listRequest);
```

The hook's cache key is derived from a deterministic stringify of the request, so a new object with identical content **does not** cause a refetch — but it does churn React reconciliation.

### 9.7 Prefer the registry to escape hatches

`<WidgetHost entry={{ widgetId: 'x.widget' }}>` looks up `'x.widget'` in the registry. You can also pass `component={SomeComponent}` directly, but the registry path is preferred — it's discoverable, JSON-serializable, and the preferred AI-generation target. Reserve `component={...}` for one-offs and tests.

### 9.8 Strict TypeScript means strict TypeScript

`noUncheckedIndexedAccess` is on. `arr[0]` is `T | undefined`. `Object.entries(record)[0]` is `[string, T] | undefined`. Use the `!` non-null assertion when you've already verified the array is non-empty, or write an explicit guard. Don't disable the flag.

### 9.9 If you need an `if`, you have a hook, not an action

The action contract is intentionally restrictive. The moment your action needs to branch on response data, transform fields, chain calls, or apply business logic, the right answer is a custom widget hook that uses the dispatcher under the hood.

---

## 10. Where to look when things break

| Symptom | Likely cause | First place to check |
|---|---|---|
| `Invalid platform configuration. Fix the following env vars...` | Env stubs missing for a test that imports runtime | `vitest.setup.ts` for the package — add `vi.stubEnv('VITE_*', ...)` |
| `Found multiple elements with role X` | RTL cleanup not running | Add `afterEach(cleanup)` to `vitest.setup.ts` |
| `Rendered more hooks than during the previous render` | A hook is below a conditional return | Move all hooks above all `if (...) return ...` |
| Optimistic update doesn't apply | Action cache key mismatch between query and mutation's optimistic.target | Verify `cache.tag` matches `optimistic.target` |
| Mutation succeeds but list doesn't refresh | Missing invalidation declaration | Add the mutation's id to the query's `cache.invalidatedBy`, or set `invalidates` on the mutation |
| Permission denied unexpectedly | User missing the action's `permission` key | Check `state.auth.user.permissions` and the action's `permission` field |
| Test passes alone, fails in suite | Shared global state not reset | Make sure `_clearActionRegistry()`, `_clearActionCache()`, `resetMockARState()` run between tests |
| Build succeeds but tests fail with `Cannot find module ...dist/index.d.ts` | Project ref out of date | `pnpm -r build` or `pnpm exec tsc -b --force` |
| MSW handler matches but response is wrong shape | Envelope wrap missing on the mock | Mock-server handlers must return `{ success: true, data: ... }` to match the platform envelope |
| Action call returns `{ ok: false, error: { code: 'TIMEOUT', ... } }` | Default 30s timeout exceeded | Set `timeoutMs` on the action declaration |

---

## Appendix — minimal new-page checklist

1. `mkdir apps/patient/src/pages/your-page`
2. Write `actions.ts`: one `defineAction({...})` per backend call. Export `registerYourActions()`.
3. Write `cells.tsx`: render and edit components for each non-trivial cell. Inline editors call `useActionDispatcher`.
4. Write `YourPage.tsx`: state at the top, queries via `useActionQuery`, mutations via `useActionMutation`, columns memoized, render with `WorklistShell` (or another archetype's shell).
5. Hook `registerYourActions()` into `AppShell.bootstrap()`.
6. Add a route in the AppShell's route union.
7. Add fixtures + handlers to `@tensaw/mock-server` if the page introduces new endpoints.
8. Write at least three integration tests: mount-and-render, one mutation, one navigation/state change.
9. `pnpm -r typecheck` — clean.
10. `pnpm -r test` — green.
