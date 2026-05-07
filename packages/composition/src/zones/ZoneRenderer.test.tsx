import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetAllStoresForTesting } from '@tensaw/runtime';
import {
  _clearWidgetRegistry,
  registerWidget,
  ZoneRenderer,
} from '../index';
import type { ZoneEntry } from '../types';

beforeEach(() => {
  _clearWidgetRegistry();
  resetAllStoresForTesting();
});

afterEach(() => {
  _clearWidgetRegistry();
});

describe('ZoneRenderer', () => {
  it('renders containers for a declarative zone', () => {
    function Hello() {
      return <span data-testid="hello">hi</span>;
    }
    registerWidget({ widgetId: 'h', component: Hello });

    const zone: ZoneEntry = {
      zoneId: 'main',
      mode: 'declarative',
      containers: [
        {
          containerId: 'c1',
          title: 'Demographics',
          widgets: [{ instanceId: 'i1', widgetId: 'h' }],
        },
      ],
    };
    render(<ZoneRenderer zone={zone} pageId="p" />);
    expect(screen.getByTestId('hello')).toBeDefined();
    expect(screen.getByText('Demographics')).toBeDefined();
  });

  it('renders bespoke zone via render function', () => {
    const zone: ZoneEntry = {
      zoneId: 'main',
      mode: 'bespoke',
      render: () => <span data-testid="custom">Custom JSX</span>,
    };
    render(<ZoneRenderer zone={zone} pageId="p" />);
    expect(screen.getByTestId('custom')).toBeDefined();
  });

  it('renders empty state when zone is undefined', () => {
    render(<ZoneRenderer zone={undefined} pageId="p" emptyTitle="Custom empty" />);
    expect(screen.getByText('Custom empty')).toBeDefined();
  });

  it('renders empty state when declarative zone has no containers', () => {
    const zone: ZoneEntry = {
      zoneId: 'main',
      mode: 'declarative',
      containers: [],
    };
    render(<ZoneRenderer zone={zone} pageId="p" emptyTitle="No containers here" />);
    expect(screen.getByText('No containers here')).toBeDefined();
  });
});
