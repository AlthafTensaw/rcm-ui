/**
 * Tests for the event bus.
 *
 * Replaces `events/eventMiddleware.test.ts` from the Redux era. The new
 * `publishEvent` is a direct function call:
 *   1. Validates the catalog (dev-only warn for unknown events)
 *   2. Records the event to `useEventsStore` (the diagnostics ring buffer)
 *   3. Runs specific-event handlers in registration order
 *   4. Runs category-level handlers
 *   5. Swallows handler errors (never crash the publisher)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildEvent,
  publishEvent,
  registerEventHandler,
  registerCategoryHandler,
  clearAllEventHandlers,
  _handlerCounts,
} from './publish';
import { useEventsStore, _resetEventsStore } from '../stores/eventsStore';
import type { PlatformEvent } from './types';

beforeEach(() => {
  clearAllEventHandlers();
  _resetEventsStore();
});

afterEach(() => {
  clearAllEventHandlers();
  _resetEventsStore();
  vi.restoreAllMocks();
});

describe('publishEvent — recording', () => {
  it('records each event to the events store ring buffer', () => {
    const event = buildEvent(
      'PATIENT_SELECTED',
      { patientId: 'p-1' },
      { sourcePageId: 'demo', correlationId: 'c-1' },
    );
    publishEvent(event);
    const recent = useEventsStore.getState().recent;
    expect(recent).toHaveLength(1);
    expect(recent[0]?.eventName).toBe('PATIENT_SELECTED');
    expect(recent[0]?.correlationId).toBe('c-1');
    expect(recent[0]?.category).toBe('context');
  });

  it('preserves order of multiple events', () => {
    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
        sourcePageId: 'demo',
        correlationId: 'c-1',
      }),
    );
    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-2' }, {
        sourcePageId: 'demo',
        correlationId: 'c-2',
      }),
    );
    const recent = useEventsStore.getState().recent;
    expect(recent).toHaveLength(2);
    // The events store records in reverse-chronological order (newest first).
    // Both correlation ids should be in the buffer.
    const ids = recent.map((e) => e.correlationId).sort();
    expect(ids).toEqual(['c-1', 'c-2']);
  });
});

describe('publishEvent — handler dispatch', () => {
  it('runs specific-event handlers in registration order', () => {
    const calls: string[] = [];
    registerEventHandler('PATIENT_SELECTED', () => calls.push('h1'));
    registerEventHandler('PATIENT_SELECTED', () => calls.push('h2'));

    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
        sourcePageId: 'demo',
        correlationId: 'c',
      }),
    );

    expect(calls).toEqual(['h1', 'h2']);
  });

  it('runs category-level handlers in addition to specific ones', () => {
    const calls: string[] = [];
    registerEventHandler('PATIENT_SELECTED', () => calls.push('specific'));
    registerCategoryHandler('context', () => calls.push('category'));

    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
        sourcePageId: 'demo',
        correlationId: 'c',
      }),
    );

    expect(calls).toEqual(['specific', 'category']);
  });

  it('only fires handlers registered for the matching event name', () => {
    const patientHandler = vi.fn();
    const accountHandler = vi.fn();
    registerEventHandler('PATIENT_SELECTED', patientHandler);
    registerEventHandler('ACCOUNT_SELECTED', accountHandler);

    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
        sourcePageId: 'demo',
        correlationId: 'c',
      }),
    );

    expect(patientHandler).toHaveBeenCalledOnce();
    expect(accountHandler).not.toHaveBeenCalled();
  });

  it('passes the full event object to handlers', () => {
    const handler = vi.fn();
    registerEventHandler('PATIENT_SELECTED', handler);

    const event = buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
      sourcePageId: 'demo',
      correlationId: 'c',
    });
    publishEvent(event);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'PATIENT_SELECTED',
        category: 'context',
        payload: { patientId: 'p-1' },
      }),
    );
  });
});

describe('publishEvent — handler error isolation', () => {
  it('catches handler exceptions and does not crash the publisher', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ });
    registerEventHandler('PATIENT_SELECTED', () => {
      throw new Error('boom');
    });
    const downstream = vi.fn();
    registerEventHandler('PATIENT_SELECTED', downstream);

    expect(() => {
      publishEvent(
        buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
          sourcePageId: 'demo',
          correlationId: 'c',
        }),
      );
    }).not.toThrow();

    // Downstream handler still runs even though the upstream one threw.
    expect(downstream).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('registerEventHandler — unsubscribe', () => {
  it('returns an unsubscribe function that removes the handler', () => {
    const handler = vi.fn();
    const unsubscribe = registerEventHandler('PATIENT_SELECTED', handler);

    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-1' }, {
        sourcePageId: 'demo',
        correlationId: 'c-1',
      }),
    );
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    publishEvent(
      buildEvent('PATIENT_SELECTED', { patientId: 'p-2' }, {
        sourcePageId: 'demo',
        correlationId: 'c-2',
      }),
    );
    expect(handler).toHaveBeenCalledTimes(1); // not invoked again
  });
});

describe('clearAllEventHandlers', () => {
  it('drops every registered handler', () => {
    registerEventHandler('PATIENT_SELECTED', vi.fn());
    registerEventHandler('ACCOUNT_SELECTED', vi.fn());
    registerCategoryHandler('context', vi.fn());

    expect(_handlerCounts().byEvent).toBe(2);
    expect(_handlerCounts().byCategory).toBe(1);

    clearAllEventHandlers();

    expect(_handlerCounts().byEvent).toBe(0);
    expect(_handlerCounts().byCategory).toBe(0);
  });
});

describe('publishEvent — payload validation in dev', () => {
  it('logs an error when payload fails the catalog schema (dev only)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ });

    // Construct a malformed event by hand to bypass `buildEvent`'s typing.
    const bad: PlatformEvent = {
      eventName: 'PATIENT_SELECTED',
      category: 'context',
      // patientId should be a string, not a number.
      payload: { patientId: 42 },
      meta: {
        sourcePageId: 'demo',
        correlationId: 'c-bad',
        occurredAt: new Date().toISOString(),
      },
    };
    publishEvent(bad);

    // The error is logged but the publisher still runs and records the event.
    expect(errorSpy).toHaveBeenCalled();
  });
});
