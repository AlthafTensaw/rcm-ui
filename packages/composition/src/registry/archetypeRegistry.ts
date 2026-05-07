/**
 * Archetype shell registry.
 *
 * Maps `layoutArchetypeId` strings ('three-panel', 'search-list', etc.) to
 * the React shell components that render them. Decoupled from the widget
 * registry so apps can register custom archetypes without touching widgets.
 *
 * `@tensaw/archetypes` (Phase 7) registers the seven standard shells. Apps
 * can register their own shells too.
 */

import type { ComponentType } from 'react';
import type { ArchetypeShellProps } from '../types';

const shells = new Map<string, ComponentType<ArchetypeShellProps>>();

export function registerArchetype(
  layoutArchetypeId: string,
  component: ComponentType<ArchetypeShellProps>,
): void {
  shells.set(layoutArchetypeId, component);
}

export function getArchetype(
  layoutArchetypeId: string,
): ComponentType<ArchetypeShellProps> | undefined {
  return shells.get(layoutArchetypeId);
}

export function listArchetypes(): readonly string[] {
  return Array.from(shells.keys());
}

export function _clearArchetypeRegistry(): void {
  shells.clear();
}
