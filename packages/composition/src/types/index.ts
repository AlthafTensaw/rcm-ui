/**
 * Phase 6 — Composition manifest types.
 *
 * Two design decisions baked into these types:
 *
 *   1. Registry-first with escape hatch. A widget entry normally has just a
 *      `widgetId` string and the WidgetHost looks it up in the registry. But
 *      a manifest can also pass `component: SomeReactComponent` directly,
 *      bypassing the registry. Useful for one-off widgets and tests.
 *
 *   2. Pragmatic strictness. A zone is normally declarative — list of
 *      containers + widgets — but it can declare `mode: 'bespoke'` and pass
 *      a `render` function that returns arbitrary JSX. The shell still
 *      provides the panel chrome, splitter, and resize behavior.
 *
 * Manifests are JSON-serializable when no `component` or `render` escape
 * hatch is used. The `serializeManifest()` helper in `./utils/serialize` strips
 * non-serializable fields for backend storage; the loaded manifest re-resolves
 * via the registry.
 */

import type { ComponentType, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

/**
 * One widget instance inside a container.
 *
 * `widgetId` is the registry key. If the consumer wants to bypass the registry
 * (one-off widget, test, prototype), pass `component` directly. The host
 * prefers `component` when both are present.
 */
export interface WidgetEntry {
  /** Unique instance id within the page. Used for state keying and events. */
  instanceId: string;
  /** Registry key. Required even when `component` is passed (used for events). */
  widgetId: string;
  /** Direct component reference — escape hatch. Wins over registry lookup. */
  component?: ComponentType<WidgetProps>;
  /** Static props passed to the widget. Subject to JSON-serializability. */
  props?: Record<string, unknown>;
  /** Optional permission key — if absent, widget renders for all signed-in users. */
  permission?: string;
  /** Optional title override. Falls back to the widget's manifest title. */
  title?: string;
  /** Optional render priority hint (low = lazy-load). Default 'high'. */
  priority?: 'high' | 'normal' | 'low';
}

/** Props every widget receives from the host. */
export interface WidgetProps {
  /** Stable instance id. */
  instanceId: string;
  /** Registry id. */
  widgetId: string;
  /** Container that owns this widget. */
  containerId: string;
  /** Page that owns this widget. */
  pageId: string;
  /** Static props from the manifest. */
  staticProps: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

/**
 * A container groups widgets visually. Renders chrome (title, actions,
 * collapse) and hosts one-or-more widgets, optionally tabbed.
 */
export interface ContainerEntry {
  /** Unique id within the page. */
  containerId: string;
  /** Display title in the container chrome. Optional — bare grouping is fine. */
  title?: string;
  /**
   * 'stacked' (default) renders all widgets vertically.
   * 'tabbed' renders one tab per widget; widgets are addressed by instanceId.
   */
  layout?: 'stacked' | 'tabbed';
  /** Initial collapsed state. Persisted in ui slice once user toggles. */
  defaultCollapsed?: boolean;
  /** Whether the user can collapse. Default true. */
  collapsible?: boolean;
  /** Right-side header actions (Edit, Save, etc). Render-prop style. */
  actions?: () => ReactNode;
  /** Widgets in this container. Order matters for stacked; first is default tab. */
  widgets: WidgetEntry[];
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

/**
 * A zone is a named region of an archetype shell — leftPanel, mainPanel,
 * rightPanel, header, etc. Two modes:
 *
 *   - 'declarative' (default): zone holds an array of containers; the
 *     ZoneRenderer iterates and stamps them out.
 *   - 'bespoke': zone declares a `render` function returning arbitrary JSX.
 *     The shell still provides the panel chrome and resize behavior.
 */
export type ZoneMode = 'declarative' | 'bespoke';

export interface DeclarativeZoneEntry {
  zoneId: string;
  mode?: 'declarative';
  containers: ContainerEntry[];
}

export interface BespokeZoneEntry {
  zoneId: string;
  mode: 'bespoke';
  render: () => ReactNode;
}

export type ZoneEntry = DeclarativeZoneEntry | BespokeZoneEntry;

// ---------------------------------------------------------------------------
// Page composition
// ---------------------------------------------------------------------------

/**
 * Top-level composition for one page. Identifies which archetype shell to use
 * and the zones the shell expects to populate.
 */
export interface PageComposition {
  /** Stable page id. */
  pageId: string;
  /** Optional version string for cache invalidation when manifests are server-served. */
  pageVersion?: string;
  /**
   * Archetype shell key — 'three-panel', 'search-list', 'dashboard',
   * 'analytics-workspace', 'comparison', 'admin-master-detail', 'calendar',
   * 'messaging'. The shell registry maps this to the React component.
   */
  layoutArchetypeId: string;
  /** Zones populated for this page. The shell decides which keys it expects. */
  zones: ZoneEntry[];
  /** Optional page-level metadata for breadcrumbs, telemetry, etc. */
  meta?: {
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
    domain?: string;
  };
}

// ---------------------------------------------------------------------------
// Archetype shell types
// ---------------------------------------------------------------------------

/**
 * What an archetype shell receives. The shell is responsible for laying out
 * the zones — splitters, panel widths, collapsibility — and delegates the
 * content of each zone to ZoneRenderer.
 */
export interface ArchetypeShellProps {
  composition: PageComposition;
  /** Resolved zones map: zoneId → ZoneEntry. Pre-computed for fast lookup. */
  zonesByKey: Record<string, ZoneEntry>;
}
