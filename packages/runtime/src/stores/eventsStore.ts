/**
 * Events store.
 *
 * Replaces Redux eventsSlice. Holds the recent-events ring buffer for
 * diagnostics. Today the slice listened for the `publishEvent` action via the
 * Redux event middleware. After migration, `publishEvent()` (a regular
 * function) calls `useEventsStore.getState().recordEvent(event)` directly.
 */
import { create } from 'zustand';
import type { EventsState, RecordedEvent } from '../types';
import type { PlatformEvent } from '../events/types';

const RING_BUFFER_SIZE = 100;
const TRIM_TARGET = 25;

export interface EventsStore extends EventsState {
  recordEvent: (event: PlatformEvent) => void;
  clearOldEvents: () => void;
  clearAll: () => void;
}

const INITIAL: EventsState = {
  recent: [],
};

export const useEventsStore = create<EventsStore>((set) => ({
  ...INITIAL,
  recordEvent: (event) =>
    { set((state) => {
      const recorded: RecordedEvent = {
        eventName: event.eventName,
        category: event.category,
        correlationId: event.meta.correlationId,
        occurredAt: event.meta.occurredAt,
      };
      const next = [recorded, ...state.recent];
      if (next.length > RING_BUFFER_SIZE) next.length = RING_BUFFER_SIZE;
      return { recent: next };
    }); },
  clearOldEvents: () =>
    { set((state) => ({ recent: state.recent.slice(0, TRIM_TARGET) })); },
  clearAll: () => { set({ recent: [] }); },
}));

export function _resetEventsStore(): void {
  useEventsStore.setState({ ...INITIAL });
}
