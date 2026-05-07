import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import {
  useWidgetsStore,
  _resetWidgetsStore,
} from '@tensaw/runtime';

import { Widget } from './Widget';

describe('Widget — presentational', () => {
  it('renders title and subtitle in the header', () => {
    render(
      <Widget title="Open claims" subtitle="By payer">
        <p>Body</p>
      </Widget>,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'Open claims',
    );
    expect(screen.getByText('By payer')).toBeDefined();
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('renders the actions slot', () => {
    render(
      <Widget title="t" actions={<button>Refresh</button>}>
        x
      </Widget>,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDefined();
  });

  it('omits the header when no title/subtitle/actions', () => {
    const { container } = render(<Widget>just body</Widget>);
    expect(container.querySelector('header')).toBeNull();
  });

  it('renders loading shell when loading=true', () => {
    render(
      <Widget loading>
        <p>Body</p>
      </Widget>,
    );
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('renders error alert and skips children/loading when error is set', () => {
    render(
      <Widget loading error={{ message: 'boom' }}>
        <p>Body</p>
      </Widget>,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('boom')).toBeDefined();
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('renders Retry button when error.onRetry given', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Widget error={{ message: 'boom', onRetry }} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when empty is set and no children', () => {
    render(
      <Widget
        empty={{
          title: 'No data',
          description: 'Nothing posted yet.',
        }}
      />,
    );
    expect(screen.getByText('No data')).toBeDefined();
    expect(screen.getByText('Nothing posted yet.')).toBeDefined();
  });

  it('children win over empty when both provided', () => {
    render(
      <Widget empty={{ title: 'No data' }}>
        <p>Body</p>
      </Widget>,
    );
    expect(screen.queryByText('No data')).toBeNull();
    expect(screen.getByText('Body')).toBeDefined();
  });
});

describe('Widget — lifecycle integration', () => {
  beforeEach(() => {
    _resetWidgetsStore();
  });
  afterEach(() => {
    _resetWidgetsStore();
  });

  const ctx = { widgetId: 'w1', containerId: 'c1', pageId: 'p1' };

  it('registers in useWidgetsStore on mount when instanceId + ctx given', () => {
    render(
      <Widget instanceId="inst-1" lifecycleContext={ctx}>
        x
      </Widget>,
    );
    const state = useWidgetsStore.getState();
    expect(state.byInstanceId['inst-1']).toBeDefined();
    expect(state.byInstanceId['inst-1']?.widgetId).toBe('w1');
    expect(state.byInstanceId['inst-1']?.lifecycle).toBe('mounted');
  });

  it('unregisters / marks disposed on unmount', () => {
    const { unmount } = render(
      <Widget instanceId="inst-2" lifecycleContext={ctx}>
        x
      </Widget>,
    );
    expect(useWidgetsStore.getState().byInstanceId['inst-2']).toBeDefined();
    unmount();
    // markWidgetDisposed removes the entry from byInstanceId.
    expect(useWidgetsStore.getState().byInstanceId['inst-2']).toBeUndefined();
  });

  it('mirrors error message into the store', () => {
    const { rerender } = render(
      <Widget instanceId="inst-3" lifecycleContext={ctx}>
        x
      </Widget>,
    );
    expect(useWidgetsStore.getState().byInstanceId['inst-3']?.errorMessage).toBeNull();

    rerender(
      <Widget
        instanceId="inst-3"
        lifecycleContext={ctx}
        error={{ message: 'kaboom' }}
      >
        x
      </Widget>,
    );
    expect(useWidgetsStore.getState().byInstanceId['inst-3']?.errorMessage).toBe(
      'kaboom',
    );

    rerender(
      <Widget instanceId="inst-3" lifecycleContext={ctx}>
        x
      </Widget>,
    );
    expect(useWidgetsStore.getState().byInstanceId['inst-3']?.errorMessage).toBeNull();
  });

  it('warns when instanceId is given without lifecycleContext', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Widget instanceId="inst-4">x</Widget>);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    // Did not register either:
    expect(useWidgetsStore.getState().byInstanceId['inst-4']).toBeUndefined();
  });

  it('skips integration entirely when instanceId is omitted', () => {
    render(<Widget>x</Widget>);
    expect(Object.keys(useWidgetsStore.getState().byInstanceId)).toHaveLength(0);
  });
});
