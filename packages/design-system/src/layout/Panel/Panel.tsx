/**
 * Panel — a page region for grouping widgets.
 *
 * Bigger than `<Card>` or `<Widget>`. A Panel is a logical region of the
 * page (e.g., the right detail panel in the operations console; a
 * "Charges" region inside an account view). Multiple widgets and sections
 * compose inside.
 *
 * `collapsible` adds a chevron button in the header; the panel collapses
 * to header-only when toggled. Without a title, no chevron renders even
 * when `collapsible` is true (no place to put it).
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

const VARIANT_CLASS = {
  default: 'border border-border bg-background',
  elevated: 'border border-border bg-background shadow-md',
  minimal: 'bg-transparent',
} as const;

export interface PanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  variant?: keyof typeof VARIANT_CLASS;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Controlled collapse state. */
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function Panel({
  title,
  actions,
  variant = 'default',
  collapsible,
  defaultCollapsed,
  collapsed: collapsedProp,
  onCollapseChange,
  children,
  className,
  'aria-label': ariaLabel,
}: PanelProps): JSX.Element {
  const [internalCollapsed, setInternalCollapsed] = useState(
    defaultCollapsed ?? false,
  );
  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  const headerVisible = title !== undefined || actions !== undefined;
  const showChevron = collapsible && title !== undefined;

  function toggle() {
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    onCollapseChange?.(next);
  }

  return (
    <section
      aria-label={typeof ariaLabel === 'string' ? ariaLabel : undefined}
      className={cn('flex flex-col rounded-lg', VARIANT_CLASS[variant], className)}
    >
      {headerVisible && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            {showChevron && (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={!collapsed}
                aria-label={collapsed ? 'Expand' : 'Collapse'}
                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    collapsed && '-rotate-90',
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
            {title !== undefined && (
              <h2 className="text-sm font-semibold leading-tight">{title}</h2>
            )}
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      {!collapsed && <div className="flex flex-1 flex-col">{children}</div>}
    </section>
  );
}
Panel.displayName = 'Panel';
