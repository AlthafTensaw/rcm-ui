import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  _clearWidgetRegistry,
  getWidgetRegistration,
  hasWidget,
  listWidgets,
  registerWidget,
} from './widgetRegistry';
import {
  _clearArchetypeRegistry,
  getArchetype,
  listArchetypes,
  registerArchetype,
} from './archetypeRegistry';

afterEach(() => {
  _clearWidgetRegistry();
  _clearArchetypeRegistry();
  vi.restoreAllMocks();
});

describe('widgetRegistry', () => {
  it('registers and retrieves a widget', () => {
    const Comp = () => null;
    registerWidget({ widgetId: 'a', component: Comp });
    expect(getWidgetRegistration('a')?.component).toBe(Comp);
    expect(hasWidget('a')).toBe(true);
  });

  it('returns undefined for unregistered ids', () => {
    expect(getWidgetRegistration('nope')).toBeUndefined();
    expect(hasWidget('nope')).toBe(false);
  });

  it('warns on collision with a different component', () => {
    const A = () => null;
    const B = () => null;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    registerWidget({ widgetId: 'x', component: A });
    registerWidget({ widgetId: 'x', component: B });
    expect(warn).toHaveBeenCalled();
    expect(getWidgetRegistration('x')?.component).toBe(B);
  });

  it('does not warn on idempotent re-registration', () => {
    const A = () => null;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    registerWidget({ widgetId: 'y', component: A });
    registerWidget({ widgetId: 'y', component: A });
    expect(warn).not.toHaveBeenCalled();
  });

  it('listWidgets returns all registrations', () => {
    const A = () => null;
    const B = () => null;
    registerWidget({ widgetId: 'a', component: A });
    registerWidget({ widgetId: 'b', component: B });
    expect(listWidgets().map((r) => r.widgetId).sort()).toEqual(['a', 'b']);
  });
});

describe('archetypeRegistry', () => {
  it('registers and retrieves a shell', () => {
    const Shell = () => null;
    registerArchetype('three-panel', Shell);
    expect(getArchetype('three-panel')).toBe(Shell);
  });

  it('returns undefined for unregistered archetypes', () => {
    expect(getArchetype('nope')).toBeUndefined();
  });

  it('listArchetypes returns all keys', () => {
    const A = () => null;
    const B = () => null;
    registerArchetype('a', A);
    registerArchetype('b', B);
    expect(listArchetypes().sort()).toEqual(['a', 'b']);
  });
});
