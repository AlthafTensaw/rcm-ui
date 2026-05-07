/**
 * TabbedPanel — a Panel with built-in Tabs.
 *
 * The most-common operations console pattern: a single right-side panel
 * with tabs across the top (Files / Notes / Audit / Messages …). Easier
 * than composing `<Panel>` + `<Tabs>` separately; for cases where you
 * need that flexibility, the lower-level components are still available.
 *
 * Tab content can be a `ReactNode` (rendered eagerly) or a function
 * `() => ReactNode` (called only when the tab is first activated;
 * subsequently re-rendered as needed). This is a lightweight lazy mode
 * that matches the spec's `content: ReactNode | (() => ReactNode)`.
 *
 * State: pass `controlledTab` + `onTabChange` for controlled mode;
 * `defaultTab` for uncontrolled.
 */
import { useState, type ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../navigation/Tabs';
import { Panel } from '../Panel';
import { cn } from '../../utils/cn';

export interface TabDefinition {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  /** ReactNode for eager render, or `() => ReactNode` for lazy. */
  content: ReactNode | (() => ReactNode);
  disabled?: boolean;
}

export interface TabbedPanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  tabs: TabDefinition[];
  defaultTab?: string;
  controlledTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'elevated';
  className?: string;
}

export function TabbedPanel({
  title,
  actions,
  tabs,
  defaultTab,
  controlledTab,
  onTabChange,
  variant = 'default',
  className,
}: TabbedPanelProps): JSX.Element {
  const initial = controlledTab ?? defaultTab ?? tabs[0]?.id ?? '';
  const [internal, setInternal] = useState<string>(initial);
  const isControlled = controlledTab !== undefined;
  const active = isControlled ? controlledTab : internal;

  function handleChange(next: string): void {
    if (!isControlled) setInternal(next);
    onTabChange?.(next);
  }

  return (
    <Panel
      {...(title !== undefined ? { title } : {})}
      {...(actions !== undefined ? { actions } : {})}
      variant={variant}
      className={cn(className)}
    >
      <Tabs value={active} onValueChange={handleChange} variant="underline">
        <TabsList className="px-4 pt-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              {...(tab.badge !== undefined ? { badge: tab.badge } : {})}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => {
          const isLazy = typeof tab.content === 'function';
          return (
            <TabsContent
              key={tab.id}
              value={tab.id}
              lazy={isLazy}
              className="px-4 pb-4 pt-3"
            >
              {isLazy ? (
                <LazyContent render={tab.content as () => ReactNode} />
              ) : (
                (tab.content as ReactNode)
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </Panel>
  );
}
TabbedPanel.displayName = 'TabbedPanel';

/**
 * Defers calling the consumer's render function until the surrounding
 * TabsContent gate first mounts this component. Once mounted, the function
 * is invoked on every render in this subtree (which lets the consumer's
 * function read live React state from a closure).
 */
function LazyContent({
  render,
}: {
  render: () => ReactNode;
}): JSX.Element {
  return <>{render()}</>;
}
