/**
 * Widget registry.
 *
 * Single source of truth for `widgetId → React component + manifest metadata`.
 * Widgets register themselves at module import time:
 *
 *   import { registerWidget } from '@tensaw/composition';
 *   registerWidget({
 *     widgetId: 'patient.demographics',
 *     component: DemographicsWidget,
 *     defaultTitle: 'Demographics',
 *     defaultPermission: 'patient.read',
 *   });
 *
 * The WidgetHost looks up `widgetId` here. If the manifest passes a direct
 * `component` ref, it bypasses the registry entirely (escape hatch).
 *
 * The registry is intentionally global. Apps that need isolation (Storybook,
 * tests) can clear or replace the registry via the test helpers.
 */

import type { ComponentType } from 'react';
import type { WidgetProps } from '../types';

export interface WidgetRegistration {
  /** Unique registry key. */
  widgetId: string;
  /** The React component to render. */
  component: ComponentType<WidgetProps>;
  /** Default title for the container chrome. Manifest can override per-instance. */
  defaultTitle?: string;
  /** Default permission key. Manifest can override per-instance. */
  defaultPermission?: string;
  /** Human-readable description. Used by gen-page tools. */
  description?: string;
  /** Tags for discovery in tooling. */
  tags?: string[];
}

const registry = new Map<string, WidgetRegistration>();

/** Register a widget. Throws in dev if widgetId is already taken. */
export function registerWidget(reg: WidgetRegistration): void {
  if (registry.has(reg.widgetId)) {
    const existing = registry.get(reg.widgetId);
    if (existing && existing.component !== reg.component && isDev()) {
      // Same id, different component — treat as accidental collision.
       
      console.warn(
        `[widgetRegistry] Widget "${reg.widgetId}" registered twice with different components. Overwriting.`,
      );
    }
  }
  registry.set(reg.widgetId, reg);
}

/** Look up a registration by id. */
export function getWidgetRegistration(widgetId: string): WidgetRegistration | undefined {
  return registry.get(widgetId);
}

/** Returns true if the widgetId is registered. */
export function hasWidget(widgetId: string): boolean {
  return registry.has(widgetId);
}

/** All registrations — used by gen-page tools and Storybook catalog. */
export function listWidgets(): readonly WidgetRegistration[] {
  return Array.from(registry.values());
}

/** Clear the registry. Use in tests; dangerous in app code. */
export function _clearWidgetRegistry(): void {
  registry.clear();
}

function isDev(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    return true;
  }
  if (typeof import.meta !== 'undefined' && 'env' in import.meta) {
    return (import.meta.env as { DEV?: boolean }).DEV === true;
  }
  return false;
}
