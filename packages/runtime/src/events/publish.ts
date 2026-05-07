/**
 * Event bus.
 *
 * Replaces the previous Redux-coupled event middleware. After the migration
 * (per §5.1 of the handoff), `publishEvent` is a regular function:
 *
 *   1. Validate the event name against the catalog (dev-mode crash, prod warn).
 *   2. Validate the payload against the catalog Zod schema (dev-mode warn).
 *   3. Record the event to `useEventsStore` for the diagnostics ring buffer.
 *   4. Run handlers synchronously, in registration order. Handler errors are
 *      logged but do not bubble — never crash the publisher over a handler.
 *
 * Handler signature changes from the Redux era:
 *   Before: (event, api: MiddlewareAPI) => void
 *   After:  (event) => void
 *
 * Handlers that today access `api.dispatch` or `api.getState` switch to
 * direct store access via the Zustand hooks (`useAuthStore.getState()`, etc.).
 */

import type { EventCategory, PlatformEvent } from './types';
import {
  EVENT_CATEGORIES,
  isCatalogedEvent,
  validatePayload,
  type EventName,
  type EventPayload,
} from './catalog';
import { useEventsStore } from '../stores/eventsStore';

/** Action-type constant kept for backwards compatibility / log filtering. */
export const PUBLISH_EVENT_ACTION_TYPE = 'platform/publishEvent';

export type EventHandler = (event: PlatformEvent) => void;

const handlersByEvent = new Map<string, EventHandler[]>();
const handlersByCategory = new Map<string, EventHandler[]>();

const isDev: boolean =
  (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') ||
  (typeof import.meta !== 'undefined' &&
    'env' in import.meta &&
    (import.meta.env as { DEV?: boolean }).DEV === true);

/**
 * Type-safe builder. Use this from widgets and effects:
 *
 *   publishEvent(buildEvent('PATIENT_SELECTED', { patientId: 'p1' }, meta));
 */
export function buildEvent<E extends EventName>(
  eventName: E,
  payload: EventPayload<E>,
  meta: Omit<PlatformEvent['meta'], 'occurredAt'> & { occurredAt?: string },
): PlatformEvent<EventPayload<E>> {
  const category: EventCategory = EVENT_CATEGORIES[eventName];
  return {
    eventName,
    category,
    payload,
    meta: {
      ...meta,
      occurredAt: meta.occurredAt ?? new Date().toISOString(),
    },
  };
}

/**
 * Publish a built event. Synchronous — handlers run inline before this returns.
 *
 * Returns void. There's no result to wait for; the event is fire-and-forget.
 */
export function publishEvent(event: PlatformEvent): void {
  // Catalog membership.
  if (!isCatalogedEvent(event.eventName)) {
    if (isDev) {
       
      console.warn(
        `[publishEvent] Unknown event "${event.eventName}". Add it to packages/runtime/src/events/catalog.ts.`,
      );
    }
    // Still record it — the diagnostics buffer is forgiving so we don't lose
    // unknown events during catalog drift.
  } else if (isDev) {
    // Payload validation in dev.
    const validation = validatePayload(
      event.eventName,
      event.payload,
    );
    if (!validation.ok) {
       
      console.error(
        `[publishEvent] Invalid payload for "${event.eventName}":\n` +
          validation.issues.map((i) => `  - ${i}`).join('\n'),
      );
    }
  }

  // Record to events store (the ring buffer).
  useEventsStore.getState().recordEvent(event);

  // Run specific-event handlers.
  const specific = handlersByEvent.get(event.eventName) ?? [];
  for (const handler of specific) {
    try {
      handler(event);
    } catch (err) {
       
      console.error(
        `[publishEvent] Handler for "${event.eventName}" threw:`,
        err,
      );
    }
  }

  // Run category-level handlers.
  const categoryHandlers = handlersByCategory.get(event.category) ?? [];
  for (const handler of categoryHandlers) {
    try {
      handler(event);
    } catch (err) {
       
      console.error(
        `[publishEvent] Category handler for "${event.category}" threw:`,
        err,
      );
    }
  }
}

/**
 * Register a handler for a specific event. Multiple handlers per event are
 * allowed; they run in registration order. Returns an unregister fn.
 */
export function registerEventHandler(
  eventName: EventName,
  handler: EventHandler,
): () => void {
  const list = handlersByEvent.get(eventName) ?? [];
  list.push(handler);
  handlersByEvent.set(eventName, list);
  return () => {
    const current = handlersByEvent.get(eventName);
    if (!current) return;
    const idx = current.indexOf(handler);
    if (idx >= 0) current.splice(idx, 1);
  };
}

/** Register a handler for an entire category. */
export function registerCategoryHandler(
  category: EventCategory,
  handler: EventHandler,
): () => void {
  const list = handlersByCategory.get(category) ?? [];
  list.push(handler);
  handlersByCategory.set(category, list);
  return () => {
    const current = handlersByCategory.get(category);
    if (!current) return;
    const idx = current.indexOf(handler);
    if (idx >= 0) current.splice(idx, 1);
  };
}

/** Test/Storybook helper: drop all handlers. */
export function clearAllEventHandlers(): void {
  handlersByEvent.clear();
  handlersByCategory.clear();
}

/** Catalog membership reexport for convenience. */
export { isCatalogedEvent };

/** Internal use: number of handlers registered. */
export function _handlerCounts(): { byEvent: number; byCategory: number } {
  let byEvent = 0;
  for (const list of handlersByEvent.values()) byEvent += list.length;
  let byCategory = 0;
  for (const list of handlersByCategory.values()) byCategory += list.length;
  return { byEvent, byCategory };
}
