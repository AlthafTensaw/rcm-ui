import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetAllStoresForTesting,
  useAuthStore,
  useWidgetsStore,
} from '@tensaw/runtime';
import {
  _clearWidgetRegistry,
  registerWidget,
  WidgetHost,
} from '../index';

beforeEach(() => {
  _clearWidgetRegistry();
  resetAllStoresForTesting();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function signIn(permissions: string[]) {
  useAuthStore.getState().signIn({
    user: {
      userId: 'u',
      username: 'u',
      email: 'u@example.com',
      fullName: 'U',
      roles: [],
      permissions,
      clinicIds: [],
    },
    clinicId: '1',
  });
}

describe('WidgetHost — resolution', () => {
  it('renders a registered widget', () => {
    function Hello() {
      return <span data-testid="hello">Hello</span>;
    }
    registerWidget({ widgetId: 'hello.widget', component: Hello });

    render(
      <WidgetHost
        entry={{ instanceId: 'i-1', widgetId: 'hello.widget' }}
        containerId="c-1"
        pageId="p-1"
      />,
    );
    expect(screen.getByTestId('hello')).toBeDefined();
  });

  it('escape hatch: direct component ref bypasses the registry', () => {
    function Inline() {
      return <span data-testid="inline">Inline</span>;
    }
    // Note: not registered.
    render(
      <WidgetHost
        entry={{ instanceId: 'i-2', widgetId: 'inline.only', component: Inline }}
        containerId="c-1"
        pageId="p-1"
      />,
    );
    expect(screen.getByTestId('inline')).toBeDefined();
  });

  it('renders ErrorState when widget is not registered and no component is provided', () => {
    render(
      <WidgetHost
        entry={{ instanceId: 'i-3', widgetId: 'missing.widget' }}
        containerId="c-1"
        pageId="p-1"
      />,
    );
    expect(screen.getByText(/Widget not available/)).toBeDefined();
    expect(screen.getByText(/WIDGET_NOT_REGISTERED/)).toBeDefined();
  });
});

describe('WidgetHost — permissions', () => {
  it('renders PermissionDeniedState when required permission missing', () => {
    function Secret() {
      return <span data-testid="secret">Secret</span>;
    }
    registerWidget({ widgetId: 'secret.widget', component: Secret });

    signIn([]); // no permissions

    render(
      <WidgetHost
        entry={{ instanceId: 'i', widgetId: 'secret.widget', permission: 'phi.read' }}
        containerId="c"
        pageId="p"
      />,
    );
    expect(screen.queryByTestId('secret')).toBeNull();
    expect(screen.getByText(/Access denied/)).toBeDefined();
    expect(screen.getByText(/phi.read/)).toBeDefined();
  });

  it('renders the widget when user has the required permission', () => {
    function Secret() {
      return <span data-testid="secret">Secret</span>;
    }
    registerWidget({ widgetId: 'secret.widget', component: Secret });

    signIn(['phi.read']);

    render(
      <WidgetHost
        entry={{ instanceId: 'i', widgetId: 'secret.widget', permission: 'phi.read' }}
        containerId="c"
        pageId="p"
      />,
    );
    expect(screen.getByTestId('secret')).toBeDefined();
  });

  it('uses registration.defaultPermission when entry.permission is absent', () => {
    function Secret() {
      return <span data-testid="secret">Secret</span>;
    }
    registerWidget({
      widgetId: 'secret.widget',
      component: Secret,
      defaultPermission: 'admin.write',
    });

    render(
      <WidgetHost
        entry={{ instanceId: 'i', widgetId: 'secret.widget' }}
        containerId="c"
        pageId="p"
      />,
    );
    expect(screen.queryByTestId('secret')).toBeNull();
    expect(screen.getByText(/admin.write/)).toBeDefined();
  });
});

describe('WidgetHost — error boundary', () => {
  it('renders ErrorState when the widget throws on render', () => {
    function Boom() {
      throw new Error('Render exploded');
    }
    registerWidget({ widgetId: 'boom.widget', component: Boom });

    // Suppress React's noisy error logging in test output.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <WidgetHost
        entry={{ instanceId: 'i', widgetId: 'boom.widget' }}
        containerId="c"
        pageId="p"
      />,
    );

    expect(screen.getByText(/This widget failed to render/)).toBeDefined();
    expect(screen.getByText(/Render exploded/)).toBeDefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('WidgetHost — lifecycle', () => {
  it('registers the widget on mount and disposes on unmount', () => {
    function Hello() {
      return <span>hi</span>;
    }
    registerWidget({ widgetId: 'lifecycle.widget', component: Hello });

    const { unmount } = render(
      <WidgetHost
        entry={{ instanceId: 'i-life', widgetId: 'lifecycle.widget' }}
        containerId="c-life"
        pageId="p-life"
      />,
    );

    // After mount, widgets store should hold the entry.
    expect(useWidgetsStore.getState().byInstanceId['i-life']).toBeDefined();

    unmount();
    // After unmount, the entry should be gone.
    expect(useWidgetsStore.getState().byInstanceId['i-life']).toBeUndefined();
  });

  it('does not register lifecycle when permission is denied', () => {
    function Secret() {
      return <span>secret</span>;
    }
    registerWidget({
      widgetId: 'permission-gated.widget',
      component: Secret,
      defaultPermission: 'phi.read',
    });

    render(
      <WidgetHost
        entry={{ instanceId: 'i-no-perm', widgetId: 'permission-gated.widget' }}
        containerId="c"
        pageId="p"
      />,
    );

    // Widget never mounted, so no entry in widgets store.
    expect(useWidgetsStore.getState().byInstanceId['i-no-perm']).toBeUndefined();
  });
});
