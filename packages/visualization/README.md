# @tensaw/visualization

Charts, KPI tiles, status badges, cell renderers, and document viewers — the layer between primitives and composition.

Implements **Phase 5** of the v3 plan.

## What's in (this batch)

| Module | Components |
|---|---|
| `charts/` | `BarChart`, `LineChart`, `ComboChart`, `DonutChart`, `Sparkline`, `EmptyChart` |
| `kpi/` | `KpiCard` (directional color), `VarianceIndicator`, `DataRefreshIndicator` |
| `status/` | `StatusBadge` + 9-taxonomy registry, `PriorityDot`, `registerTaxonomy()` |
| `cells/` | `MoneyCell`, `PercentCell`, `DateCell`, `DateTimeCell`, `AgeCell`, `CodeCell`, `StatusCell`, `AssigneeCell` |
| `documents/` | `DocumentViewer` (native iframe-based per locked decision) |
| `display/` | `AlertCard`, `InsightCard`, `AssumptionsList`, `ReadOnlyFieldGrid`, `DefinitionPanel`, `TimelineEntry`, `WorklistItemCard`, `AppointmentSlot`, `PrintWatermark` + `usePrintAudit` + `auditExport` |
| `utils/` | `formatMoneyUsd`, `formatMoneyCompact`, `formatPercent`, `formatDeltaPercent`, `formatDeltaMoney`, `formatInteger`, `formatIntegerCompact`, `chartPalette`, `seriesColor` |

## Status taxonomy registry

Single component shape (`<StatusBadge>`) drives every status pill in the platform. Built-in taxonomies:

| Taxonomy | Status keys |
|---|---|
| `claim` | open, filed, pending, partially_paid, paid, closed, denied, rejected, voided, appealed, secondary, tertiary |
| `eob` | failed_parsing, parsed_needs_review, assigned, in_progress, completed |
| `appointment` | scheduled, confirmed, checked_in, in_room, checked_out, completed, cancelled, no_show |
| `payment` | posted, pending, failed, refunded, partially_refunded |
| `auth` | pending, approved, denied, expired |
| `eligibility` | active, inactive, pending, unknown |
| `workflow` | pending, in_review, completed, escalated, on_hold |
| `priority` | high, medium, low, sla_breached |
| `aging-bucket` | 0-30, 31-60, 61-90, 91-120, 120+ |

Custom taxonomies via `registerTaxonomy('domain-name', { ... })`.

## KPI directional color (locked v3 decision)

KPIs encode trend direction via the **value color**, not the delta:

```tsx
<KpiCard label="Total Denials" value={392136} priorValue={343255} direction="inverse" />
// Denials went UP → value renders RED (bad trend for denials)

<KpiCard label="Collections" value={392136} priorValue={343255} direction="direct" />
// Collections went UP → value renders GREEN (good trend for collections)

<KpiCard label="Volume" value={500} priorValue={400} direction="neutral" />
// Direction-agnostic → value stays primary text color
```

`direction="inverse"` for: denials, AR aging, days-in-AR, denial rate.
`direction="direct"` for: collections, paid, net collection rate.
`direction="neutral"` for: volume, count, throughput.

## Charts

All charts:
- Built on Recharts 2.x (per v3 plan §2.3).
- Read colors from `chartPalette`; no raw hex literals in chart code.
- Format axis labels via `ValueFormat` enum: `'money'` / `'money-compact'` / `'percent'` / `'integer'` / `'integer-compact'`.
- Render `<EmptyChart>` placeholder when data is empty (preserves layout).
- Series colors rotate through 8 palette colors, color-blind safe (no red/green pairing).

## DocumentViewer

Native browser PDF/image rendering via `<iframe>` — zero JS deps. Browser-native zoom/page controls. For advanced needs (programmatic page nav, annotations) a future `mode="advanced"` will opt into react-pdf.

## What's NOT in (deferred to a future batch)

- File browsers: `FileThumbnailGrid`, `FileListView`
- Composers: `FaxComposer`, `EmailComposer`

These are richer UI surfaces that benefit from being designed alongside Phase 6 composition components — straightforward to add when first needed.

## Status

Phase 5 — first batch + follow-up shipped. ~34 components, ~85 tests.
