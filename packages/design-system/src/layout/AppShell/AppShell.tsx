/**
 * AppShell — top-level page layout.
 *
 * Composes:
 *   - TopNav across the top (always)
 *   - SideNav along the left (optional)
 *   - main content (children)
 *   - rightPanel along the right (optional, but always rendered when given)
 *
 * Layout uses CSS grid with named columns. Two-column when only sideNav OR
 * rightPanel is provided; three-column when both. Single-column fallback
 * when neither is provided. The grid columns are sized:
 *
 *   sideNav  → auto      (its <SideNav> chooses its own width)
 *   main     → 1fr       (consumes the remainder)
 *   rightPanel → fixed   (`rightPanelWidth`, default 400 px)
 *
 * Per F11, the right panel is always rendered when `rightPanel` is set —
 * pages that don't need it should omit the prop entirely. The AppShell
 * itself does not implement responsive collapse behavior (rightPanel
 * collapsing into a Drawer at narrow widths); that's a v0.2 enhancement.
 */
import { type CSSProperties, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export interface AppShellProps {
  topNav: ReactNode;
  sideNav?: ReactNode;
  rightPanel?: ReactNode;
  /** Px. Default 400. */
  rightPanelWidth?: number;
  children: ReactNode;
  className?: string;
}

export function AppShell({
  topNav,
  sideNav,
  rightPanel,
  rightPanelWidth = 400,
  children,
  className,
}: AppShellProps): JSX.Element {
  const hasSide = !!sideNav;
  const hasRight = !!rightPanel;

  // Build grid-template-columns dynamically.
  const cols = [
    hasSide ? 'auto' : null,
    'minmax(0, 1fr)',
    hasRight ? `${rightPanelWidth}px` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const gridStyle: CSSProperties = {
    gridTemplateColumns: cols,
    gridTemplateRows: 'auto minmax(0, 1fr)',
  };

  return (
    <div
      className={cn(
        'grid h-screen w-screen overflow-hidden bg-background text-foreground',
        className,
      )}
      style={gridStyle}
    >
      <div
        className="col-span-full row-start-1"
        // top nav spans every column
      >
        {topNav}
      </div>
      {hasSide && (
        <aside
          aria-label="Side navigation region"
          className="row-start-2 overflow-y-auto"
        >
          {sideNav}
        </aside>
      )}
      <main
        role="main"
        className={cn(
          'row-start-2 overflow-auto',
          // start in the second grid column when a sideNav is present
          hasSide ? '' : '',
        )}
      >
        {children}
      </main>
      {hasRight && (
        <aside
          aria-label="Detail panel"
          className="row-start-2 overflow-auto border-l border-border"
        >
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
AppShell.displayName = 'AppShell';
