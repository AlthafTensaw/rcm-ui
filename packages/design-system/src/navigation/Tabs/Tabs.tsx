/**
 * Tabs — panel-level tabs.
 *
 * Wraps `@radix-ui/react-tabs`. For pages, use routing instead — Tabs are
 * for in-panel switching (e.g., the operations console's tabbed-detail
 * pattern: Files / Notes / Audit on a single right panel).
 *
 * Three visual variants:
 *   - default: bordered pill-tab look on a muted strip
 *   - underline: minimal, animated underline indicator
 *   - pills: rounded contained pills (good for filter-style tab groups)
 *
 * `<TabsContent lazy>` defers mounting children until this tab is first
 * activated, then keeps them mounted (so state survives tab switches).
 * Without `lazy`, all panels render up-front.
 *
 * Variant + size are applied at the Root via data attributes; descendant
 * triggers/list pick them up via Tailwind arbitrary selectors. This avoids
 * a Context provider and keeps the variants pure-CSS.
 */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../../utils/cn';

// -- Root -------------------------------------------------------------------

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'default' | 'underline' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  variant = 'default',
  size = 'md',
  children,
  className,
}: TabsProps): JSX.Element {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      data-tabs-variant={variant}
      data-tabs-size={size}
      className={cn('flex flex-col gap-2', className)}
    >
      {children}
    </TabsPrimitive.Root>
  );
}
Tabs.displayName = 'Tabs';

// -- TabsList ---------------------------------------------------------------

export interface TabsListProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(function TabsList({ className, children, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center',
        '[[data-tabs-variant=default]_&]:rounded-md',
        '[[data-tabs-variant=default]_&]:bg-muted',
        '[[data-tabs-variant=default]_&]:p-1',
        '[[data-tabs-variant=default]_&]:text-muted-foreground',
        '[[data-tabs-variant=default]_&]:gap-1',
        '[[data-tabs-variant=underline]_&]:border-b',
        '[[data-tabs-variant=underline]_&]:border-border',
        '[[data-tabs-variant=underline]_&]:gap-4',
        '[[data-tabs-variant=pills]_&]:gap-1',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
});

// -- TabsTrigger ------------------------------------------------------------

export interface TabsTriggerProps
  extends Omit<
    ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    'children'
  > {
  value: string;
  badge?: ReactNode;
  children: ReactNode;
}

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(function TabsTrigger({ className, badge, children, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'text-sm h-8',
        '[[data-tabs-size=sm]_&]:text-xs',
        '[[data-tabs-size=sm]_&]:h-7',
        '[[data-tabs-size=lg]_&]:text-base',
        '[[data-tabs-size=lg]_&]:h-9',
        '[[data-tabs-variant=default]_&]:rounded-sm',
        '[[data-tabs-variant=default]_&]:px-3',
        '[[data-tabs-variant=default]_&]:py-1',
        '[[data-tabs-variant=default]_&]:data-[state=active]:bg-background',
        '[[data-tabs-variant=default]_&]:data-[state=active]:text-foreground',
        '[[data-tabs-variant=default]_&]:data-[state=active]:shadow-sm',
        '[[data-tabs-variant=underline]_&]:relative',
        '[[data-tabs-variant=underline]_&]:rounded-none',
        '[[data-tabs-variant=underline]_&]:px-1',
        '[[data-tabs-variant=underline]_&]:py-2',
        '[[data-tabs-variant=underline]_&]:text-muted-foreground',
        '[[data-tabs-variant=underline]_&]:data-[state=active]:text-foreground',
        '[[data-tabs-variant=underline]_&]:after:pointer-events-none',
        '[[data-tabs-variant=underline]_&]:after:absolute',
        '[[data-tabs-variant=underline]_&]:after:inset-x-0',
        '[[data-tabs-variant=underline]_&]:after:-bottom-px',
        '[[data-tabs-variant=underline]_&]:after:h-0.5',
        '[[data-tabs-variant=underline]_&]:after:bg-primary',
        '[[data-tabs-variant=underline]_&]:after:scale-x-0',
        '[[data-tabs-variant=underline]_&]:data-[state=active]:after:scale-x-100',
        '[[data-tabs-variant=underline]_&]:after:transition-transform',
        '[[data-tabs-variant=pills]_&]:rounded-full',
        '[[data-tabs-variant=pills]_&]:px-3',
        '[[data-tabs-variant=pills]_&]:py-1',
        '[[data-tabs-variant=pills]_&]:text-muted-foreground',
        '[[data-tabs-variant=pills]_&]:hover:bg-accent',
        '[[data-tabs-variant=pills]_&]:data-[state=active]:bg-primary',
        '[[data-tabs-variant=pills]_&]:data-[state=active]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {badge && <span className="inline-flex">{badge}</span>}
    </TabsPrimitive.Trigger>
  );
});

// -- TabsContent ------------------------------------------------------------

export interface TabsContentProps
  extends ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  value: string;
  /** Defer rendering children until this tab is first activated. */
  lazy?: boolean;
}

/**
 * Inner gate for `lazy`. Reads the surrounding panel's `data-state` via a
 * ref to detect first activation; once seen, children stay mounted so
 * subsequent tab switches preserve their state.
 */
function LazyMountGate({
  contentRef,
  children,
}: {
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  children: ReactNode;
}): JSX.Element | null {
  const [seen, setSeen] = useState(false);
  // Intentionally no deps array: the effect runs on every render to poll
  // the underlying Radix `data-state` attribute until the panel becomes
  // active. The `if (seen) return` guard makes subsequent runs free.
  // ESLint's exhaustive-deps rule flags this; suppress for the intentional
  // pattern.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (seen) return;
    const node = contentRef.current;
    if (node?.getAttribute('data-state') === 'active') {
      setSeen(true);
    }
  });
  return seen ? <>{children}</> : null;
}

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(function TabsContent({ className, lazy, value, children, ...props }, ref) {
  // Local ref for lazy detection. We forward the consumer's ref alongside.
  const localRef = useRef<HTMLDivElement | null>(null);

  return (
    <TabsPrimitive.Content
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref).current = node;
      }}
      value={value}
      forceMount={lazy ? true : undefined}
      className={cn(
        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // When lazy + forceMount, hide inactive panels.
        lazy && 'data-[state=inactive]:hidden',
        className,
      )}
      {...props}
    >
      {lazy ? (
        <LazyMountGate contentRef={localRef}>{children}</LazyMountGate>
      ) : (
        children
      )}
    </TabsPrimitive.Content>
  );
});
