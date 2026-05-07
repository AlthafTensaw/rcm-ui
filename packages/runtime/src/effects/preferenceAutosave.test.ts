/**
 * Tests for the preference autosave effect.
 *
 * Replaces `middleware/preferenceMiddleware.test.ts` from the Redux era. The
 * autosave effect:
 *   - Subscribes to `useUiStore` and `usePreferencesStore`
 *   - Debounces 500ms across rapid changes
 *   - Mirrors UI store state into preferences store before saving
 *   - Calls the injected saver
 *   - Publishes PREFERENCE_SAVE_REQUESTED / SUCCEEDED / FAILED events
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  startPreferenceAutosave,
  setPreferenceSaver,
  _resetPreferenceAutosave,
  type PreferenceSaver,
} from './preferenceAutosave';
import { useUiStore, _resetUiStore } from '../stores/uiStore';
import {
  usePreferencesStore,
  _resetPreferencesStore,
} from '../stores/preferencesStore';
import { useEventsStore, _resetEventsStore } from '../stores/eventsStore';
import { clearAllEventHandlers } from '../events/publish';

beforeEach(() => {
  vi.useFakeTimers();
  _resetUiStore();
  _resetPreferencesStore();
  _resetEventsStore();
  _resetPreferenceAutosave();
  clearAllEventHandlers();
});

afterEach(() => {
  vi.useRealTimers();
  _resetPreferenceAutosave();
});

describe('startPreferenceAutosave — debounce', () => {
  it('coalesces rapid changes into a single save call (500ms)', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    // 5 rapid panel-width changes within 100ms.
    for (let i = 0; i < 5; i++) {
      useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 240 + i });
      vi.advanceTimersByTime(20);
    }

    // Less than 500ms total elapsed — no save yet.
    expect(saver).not.toHaveBeenCalled();

    // Cross the debounce threshold.
    vi.advanceTimersByTime(500);
    // Drain any microtask queue from the async saver.
    await vi.runAllTimersAsync();

    // Save fires exactly once.
    expect(saver).toHaveBeenCalledTimes(1);
    stop();
  });

  it('resets the debounce timer on each new change', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 200 });
    vi.advanceTimersByTime(400);
    expect(saver).not.toHaveBeenCalled();

    // Another change before the timer fires — should reset to 500ms again.
    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 250 });
    vi.advanceTimersByTime(400);
    expect(saver).not.toHaveBeenCalled();

    // Now cross 500ms from the most recent change.
    vi.advanceTimersByTime(200);
    await vi.runAllTimersAsync();
    expect(saver).toHaveBeenCalledTimes(1);
    stop();
  });
});

describe('startPreferenceAutosave — payload', () => {
  it('passes a snapshot containing UI panels, containers, grids, density, and savedView', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'ar-mgmt', width: 320 });
    useUiStore.getState().setContainerExpanded({
      pageId: 'ar-mgmt',
      containerId: 'top',
      expanded: false,
    });
    usePreferencesStore.getState().setDensity('compact');

    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    expect(saver).toHaveBeenCalledTimes(1);
    const payload = (saver as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as
      | {
          density: string;
          panelsByPage: Record<string, { leftPanelWidth: number | null }>;
          containersByKey: Record<string, { expanded: boolean }>;
        }
      | undefined;
    expect(payload?.density).toBe('compact');
    expect(payload?.panelsByPage['ar-mgmt']?.leftPanelWidth).toBe(320);
    expect(payload?.containersByKey['ar-mgmt:top']?.expanded).toBe(false);
    stop();
  });
});

describe('startPreferenceAutosave — events', () => {
  it('publishes PREFERENCE_SAVE_REQUESTED then PREFERENCE_SAVE_SUCCEEDED on a successful save', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 240 });
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    const recent = useEventsStore.getState().recent;
    const names = recent.map((e) => e.eventName);
    expect(names).toContain('PREFERENCE_SAVE_REQUESTED');
    expect(names).toContain('PREFERENCE_SAVE_SUCCEEDED');
    stop();
  });

  it('publishes PREFERENCE_SAVE_FAILED on saver rejection', async () => {
    const saver: PreferenceSaver = vi
      .fn()
      .mockRejectedValue(new Error('Network unavailable'));
    setPreferenceSaver(saver);

    // Capture the actual event payload via a handler — the ring buffer keeps
    // metadata only, not the payload, so we install a listener.
    const captured: Record<string, unknown>[] = [];
    const { registerEventHandler } = await import('../events/publish');
    const unsub = registerEventHandler('PREFERENCE_SAVE_FAILED', (event) => {
      captured.push(event.payload);
    });

    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 240 });
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      errorCode: 'SAVE_FAILED',
      errorMessage: 'Network unavailable',
    });

    unsub();
    stop();
  });

  it('treats save as success when no saver is wired (test/pre-bootstrap mode)', async () => {
    setPreferenceSaver(null);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 240 });
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    const names = useEventsStore.getState().recent.map((e) => e.eventName);
    expect(names).toContain('PREFERENCE_SAVE_SUCCEEDED');
    stop();
  });
});

describe('startPreferenceAutosave — mirror', () => {
  it('mirrors UI panels into preferences store on save', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 280 });
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    expect(usePreferencesStore.getState().panelsByPage.demo?.leftPanelWidth).toBe(280);
    stop();
  });
});

describe('stop — disposer', () => {
  it('cancels pending debounced save and removes subscriptions', async () => {
    const saver: PreferenceSaver = vi.fn().mockResolvedValue(undefined);
    setPreferenceSaver(saver);
    const stop = startPreferenceAutosave();

    useUiStore.getState().setLeftPanelWidth({ pageId: 'demo', width: 240 });
    // Stop before debounce fires.
    stop();
    vi.advanceTimersByTime(1000);
    await vi.runAllTimersAsync();

    expect(saver).not.toHaveBeenCalled();
  });
});
