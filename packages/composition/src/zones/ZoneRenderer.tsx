/**
 * ZoneRenderer.
 *
 * Renders a single zone of a page composition. Two modes:
 *
 *   - 'declarative' (default): iterates the zone's containers and renders
 *     each via ContainerRenderer.
 *   - 'bespoke': calls the zone's `render()` function and trusts the result.
 *     The shell still provides the panel chrome and resize behavior — bespoke
 *     mode only escapes the container/widget abstraction inside the zone.
 *
 * If a zone is missing entirely (the manifest didn't populate it but the shell
 * expected it), an EmptyState is rendered. ArchetypeShell pre-resolves zones
 * via `zonesByKey` to make missing zones explicit.
 */

import { ContainerRenderer } from '../containers/ContainerRenderer';
import { EmptyState } from '../states';
import type { ZoneEntry } from '../types';

export interface ZoneRendererProps {
  zone: ZoneEntry | undefined;
  pageId: string;
  /** Optional empty-state title shown when the zone is undefined. */
  emptyTitle?: string;
  emptyBody?: string;
}

export function ZoneRenderer({
  zone,
  pageId,
  emptyTitle = 'Nothing to show here',
  emptyBody,
}: ZoneRendererProps) {
  if (!zone) {
    return <EmptyState title={emptyTitle} body={emptyBody} compact />;
  }

  if (zone.mode === 'bespoke') {
    return <>{zone.render()}</>;
  }

  // Declarative mode (default).
  const containers = zone.containers;
  if (containers.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} compact />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {containers.map((container) => (
        <ContainerRenderer
          key={container.containerId}
          container={container}
          pageId={pageId}
        />
      ))}
    </div>
  );
}
