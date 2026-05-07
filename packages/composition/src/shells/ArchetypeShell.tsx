/**
 * ArchetypeShell.
 *
 * The top-level wrapper consumers render at the page level. Looks up the
 * archetype shell component by `composition.layoutArchetypeId`, pre-computes
 * the zonesByKey map for fast lookup inside the shell, and renders.
 *
 * If the archetype is not registered, falls back to a generic single-zone
 * vertical stack of all containers across all zones — so a partially-wired
 * app still renders something coherent.
 */

import { useMemo } from 'react';
import { getArchetype } from '../registry/archetypeRegistry';
import { ContainerRenderer } from '../containers/ContainerRenderer';
import { ErrorState } from '../states';
import type { ArchetypeShellProps, ContainerEntry, PageComposition, ZoneEntry } from '../types';

export interface ArchetypeShellHostProps {
  composition: PageComposition;
}

export function ArchetypeShell({ composition }: ArchetypeShellHostProps) {
  const Shell = getArchetype(composition.layoutArchetypeId);

  const zonesByKey: Record<string, ZoneEntry> = useMemo(() => {
    const map: Record<string, ZoneEntry> = {};
    for (const zone of composition.zones) {
      map[zone.zoneId] = zone;
    }
    return map;
  }, [composition.zones]);

  if (!Shell) {
    // Graceful fallback: render every container in document order in a single column.
    return (
      <FallbackShell composition={composition} />
    );
  }

  const shellProps: ArchetypeShellProps = {
    composition,
    zonesByKey,
  };

  return <Shell {...shellProps} />;
}

/**
 * Generic fallback shell. Used when an unknown layoutArchetypeId is referenced.
 * Renders a small banner so this is obvious in dev, then dumps every container
 * in document order so the page is at least debuggable.
 */
function FallbackShell({ composition }: { composition: PageComposition }) {
  const allContainers = useMemo(() => {
    const out: { zoneId: string; container: ContainerEntry }[] = [];
    for (const zone of composition.zones) {
      if (zone.mode === 'bespoke') continue;
      for (const c of zone.containers) {
        out.push({ zoneId: zone.zoneId, container: c });
      }
    }
    return out;
  }, [composition.zones]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ErrorState
        title={`Unknown archetype: "${composition.layoutArchetypeId}"`}
        body="The page composition references an archetype shell that has not been registered. Containers below are stacked vertically as a fallback."
        errorCode="ARCHETYPE_NOT_REGISTERED"
        compact
      />
      {allContainers.map(({ container }) => (
        <ContainerRenderer
          key={container.containerId}
          container={container}
          pageId={composition.pageId}
        />
      ))}
    </div>
  );
}
