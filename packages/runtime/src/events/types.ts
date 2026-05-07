/**
 * Platform event types.
 *
 * Phase 1.4 of the v3 plan. Events are how widgets communicate without
 * importing each other. Every event has:
 *   - a string name (e.g. "PATIENT_SELECTED")
 *   - a category (so handlers can subscribe broadly)
 *   - a typed Zod-validated payload
 *   - meta with correlation, timestamps, source widget/page
 *
 * The full catalog is defined in `./catalog.ts`. This file holds the envelope
 * shape and the category enum.
 */

export type EventCategory =
  | 'context'
  | 'ui'
  | 'workflow'
  | 'data'
  | 'surface'
  | 'assistant'
  | 'system'
  | 'audit';

export interface EventMeta {
  /** Source widget instance id, if dispatched from a widget. */
  sourceInstanceId?: string;
  /** Source widget id (the manifest id, not the instance). */
  sourceWidgetId?: string;
  /** Source container id. */
  sourceContainerId?: string;
  /** Source page id. */
  sourcePageId: string;
  /** Correlation id; tied to the user-visible action that started this chain. */
  correlationId: string;
  /** ISO-8601 timestamp. */
  occurredAt: string;
  /** Authenticated user id (HIPAA audit trail). */
  userId?: string;
  /** Active clinic id at time of event. */
  clinicId?: string | number;
}

export interface PlatformEvent<TPayload = Record<string, unknown>> {
  eventName: string;
  category: EventCategory;
  payload: TPayload;
  meta: EventMeta;
}
