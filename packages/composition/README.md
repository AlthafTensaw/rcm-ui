# @tensaw/composition

Layout and orchestration components — the layer that turns page composition manifests into rendered UIs.

Implements **Phase 6** of the v3 plan.

## Architecture (locked)

1. **Registry-first with escape hatch.** Widgets register a `widgetId` string at module init; the host looks them up by id at render time. A manifest entry can also pass `component: SomeWidget` directly to bypass the registry — used for one-off widgets, prototypes, and tests.

2. **Manifests-as-data.** Page compositions are JSON-serializable shapes (modulo the bespoke `render` and direct `component` escape hatches). Currently lived in code; backend-served later — the type contract is identical either way.

3. **Pragmatic strictness.** ArchetypeShell drives the page layout, but a zone can declare `mode: 'bespoke'` and emit arbitrary JSX. The shell still owns the splitters and panel chrome.

## What's in

| Subsystem | Components |
|---|---|
| Types | `WidgetEntry`, `WidgetProps`, `ContainerEntry`, `ZoneEntry`, `PageComposition`, `ArchetypeShellProps` |
| Registry | `registerWidget`, `getWidgetRegistration`, `hasWidget`, `listWidgets` + archetype variants |
| States | `LoadingState`, `EmptyState`, `ErrorState`, `PermissionDeniedState` |
| Containers | `SectionCard`, `CollapsibleSection`, `ContainerRenderer` |
| Widgets | `WidgetHost` — the keystone (resolution + permission gate + lifecycle + error boundary) |
| Zones | `ZoneRenderer` (declarative + bespoke modes) |
| Shells | `ArchetypeShell` (looks up by `layoutArchetypeId`, generic fallback) |
| Surfaces | `SurfaceHost` (modal/drawer/popup), `DirtyStateGuard` |
| Grids | `SchemaDataGrid` (TanStack Table wrapper) |
| Page chrome | `PageHeader`, `AppLauncher`, `NotificationBell`, `UserMenu`, `HelpButton`, `GlobalAlertBanner`, `SavedViewSelector`, `TabsWithCount` |

## How a page renders

```tsx
// 1. Register the widgets at module init.
registerWidget({ widgetId: 'patient.demographics', component: DemographicsWidget });
registerWidget({ widgetId: 'patient.balance', component: BalanceWidget });
registerArchetype('three-panel', ThreePanelShell);

// 2. Declare the manifest.
const composition: PageComposition = {
  pageId: 'patient.detail',
  layoutArchetypeId: 'three-panel',
  zones: [
    { zoneId: 'leftPanel', mode: 'declarative', containers: [/* ... */] },
    { zoneId: 'mainPanel', mode: 'declarative', containers: [/* ... */] },
    {
      zoneId: 'rightPanel',
      mode: 'bespoke',
      render: () => <ActivityLog />, // escape hatch
    },
  ],
};

// 3. Render.
<ArchetypeShell composition={composition} />
```

## Mount once at the app root

```tsx
<Provider store={store}>
  <ThemeProvider>
    <App />
    <SurfaceHost />      {/* renders the modal/drawer stack */}
    <DirtyStateGuard />  {/* "you have unsaved changes" guard */}
  </ThemeProvider>
</Provider>
```

## Status

Phase 6 — shipped. ~14 components + 4 standard states + 2 registries.
