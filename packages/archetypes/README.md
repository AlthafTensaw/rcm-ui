# @tensaw/archetypes

The 7 page archetypes every Tensaw app shares, plus composition factories that turn a domain spec into a full page composition manifest.

Implements **Phase 7** of the v3 plan.

## Archetypes

1. **SearchListArchetype** — entry page for any domain. `searchListPageComposition({ domain })`.
2. **ThreePanelDetailArchetype** — left worklist + main work tabs + right supplemental tabs. `threePanelDetailPageComposition({ domain, leftPanelWidgets, mainTabs, rightPanelTabs })`.
3. **DashboardArchetype** — multi-tile chart/KPI grid with left rail.
4. **AnalyticsWorkspaceArchetype** — left context, center conversation feed, right details (PromptQL Workspace pattern).
5. **ComparisonArchetype** — side-by-side base vs comparison.
6. **AdminMasterDetailArchetype** — admin entity nav + tabbed detail.
7. **CalendarArchetype** — day/week grid + right detail pane.
8. **MessagingArchetype** — thread list + conversation + context.

## Status

Phase 7 — pending all earlier phases.
