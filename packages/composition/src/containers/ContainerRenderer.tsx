/**
 * ContainerRenderer.
 *
 * Renders a ContainerEntry: chrome (title, actions, collapse) wrapping one or
 * more WidgetHosts. Two layouts:
 *
 *   - 'stacked' (default): widgets render vertically, separated by a gap
 *   - 'tabbed': one tab per widget, only the active tab's widget mounts
 *
 * Persisted state pulled from the ui store via useUiStore:
 *   - collapsed: ui.containersByKey[`${pageId}:${containerId}`].expanded
 *   - activeTabId: ui.containersByKey[`${pageId}:${containerId}`].activeTabId
 *
 * Toggles dispatch through ui slice actions, which the preference middleware
 * picks up and persists.
 */

import { useMemo, type CSSProperties } from 'react';
import { useUiStore } from '@tensaw/runtime';
import { CollapsibleSection, SectionCard } from '../containers/SectionCard';
import { WidgetHost } from '../widgets/WidgetHost';
import type { ContainerEntry } from '../types';

export interface ContainerRendererProps {
  container: ContainerEntry;
  pageId: string;
}

export function ContainerRenderer({ container, pageId }: ContainerRendererProps) {
  const layout = container.layout ?? 'stacked';
  const collapsible = container.collapsible !== false; // default true

  const containerKey = `${pageId}:${container.containerId}`;

  // Read ui state for this container.
  const persistedExpanded = useUiStore(
    (state) => state.containersByKey[containerKey]?.expanded,
  );
  const persistedActiveTabId = useUiStore(
    (state) => state.containersByKey[containerKey]?.activeTabId,
  );

  // Resolve effective collapsed state.
  // ui store stores `expanded` (true=open). collapse = !expanded.
  const effectiveCollapsed = useMemo(() => {
    if (persistedExpanded === undefined) {
      // No persisted state — fall back to manifest default.
      return container.defaultCollapsed === true;
    }
    return !persistedExpanded;
  }, [persistedExpanded, container.defaultCollapsed]);

  // Resolve active tab id.
  const activeTabId = useMemo(() => {
    if (layout !== 'tabbed') return null;
    if (persistedActiveTabId !== undefined && persistedActiveTabId !== null) {
      const exists = container.widgets.some((w) => w.instanceId === persistedActiveTabId);
      if (exists) return persistedActiveTabId;
    }
    return container.widgets[0]?.instanceId ?? null;
  }, [layout, persistedActiveTabId, container.widgets]);

  function handleCollapseToggle(nextCollapsed: boolean) {
    useUiStore.getState().setContainerExpanded({
      pageId,
      containerId: container.containerId,
      expanded: !nextCollapsed,
    });
  }

  function handleTabChange(tabId: string) {
    useUiStore.getState().setContainerActiveTab({
      pageId,
      containerId: container.containerId,
      tabId,
    });
  }

  // Tabbed layout -----------------------------------------------------------

  if (layout === 'tabbed') {
    const activeWidget = container.widgets.find((w) => w.instanceId === activeTabId);

    const tabBar = (
      <div style={tabBarStyle}>
        {container.widgets.map((w) => {
          const isActive = w.instanceId === activeTabId;
          return (
            <button
              key={w.instanceId}
              type="button"
              onClick={() => { handleTabChange(w.instanceId); }}
              style={tabButtonStyle(isActive)}
              role="tab"
              aria-selected={isActive}
            >
              {w.title ?? w.widgetId}
            </button>
          );
        })}
      </div>
    );

    const body = (
      <>
        {tabBar}
        <div style={{ paddingTop: 12 }}>
          {activeWidget ? (
            <WidgetHost
              entry={activeWidget}
              containerId={container.containerId}
              pageId={pageId}
            />
          ) : null}
        </div>
      </>
    );

    if (collapsible && container.title) {
      return (
        <CollapsibleSection
          title={container.title}
          actions={container.actions?.()}
          collapsed={effectiveCollapsed}
          onCollapsedChange={handleCollapseToggle}
        >
          {body}
        </CollapsibleSection>
      );
    }
    return (
      <SectionCard title={container.title} actions={container.actions?.()}>
        {body}
      </SectionCard>
    );
  }

  // Stacked layout ----------------------------------------------------------

  const stackedBody = (
    <div style={stackedBodyStyle}>
      {container.widgets.map((w) => (
        <WidgetHost
          key={w.instanceId}
          entry={w}
          containerId={container.containerId}
          pageId={pageId}
        />
      ))}
    </div>
  );

  if (collapsible && container.title) {
    return (
      <CollapsibleSection
        title={container.title}
        actions={container.actions?.()}
        collapsed={effectiveCollapsed}
        onCollapsedChange={handleCollapseToggle}
      >
        {stackedBody}
      </CollapsibleSection>
    );
  }
  return (
    <SectionCard title={container.title} actions={container.actions?.()}>
      {stackedBody}
    </SectionCard>
  );
}

// -- Styles -------------------------------------------------------------------

const tabBarStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
  gap: 4,
};

const tabButtonStyle = (active: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  color: active
    ? 'var(--tw-color-brand-accent, #218D8D)'
    : 'var(--tw-color-text-muted, #6B7280)',
  borderBottom: active
    ? '2px solid var(--tw-color-brand-accent, #218D8D)'
    : '2px solid transparent',
  marginBottom: -1,
  cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
});

const stackedBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
