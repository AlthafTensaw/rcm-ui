/**
 * Drawer — slide-in transient overlay panel.
 *
 * Wraps `vaul`. Different from `<Panel>` (a persistent layout region) —
 * Drawer opens and closes. Supports four sides; size controls the
 * perpendicular dimension (width for left/right; height for top/bottom).
 *
 * Animation, gesture-drag-to-dismiss, and focus management are handled by
 * vaul. Title renders inside an accessible `<DrawerTitle>`; footer pinned
 * to the bottom of the body when given.
 */
import { type ReactNode } from 'react';
import { Drawer as Vaul } from 'vaul';

import { cn } from '../../utils/cn';

const SIDE_CLASS = {
  left: 'inset-y-0 left-0 h-full',
  right: 'inset-y-0 right-0 h-full',
  top: 'inset-x-0 top-0 w-full',
  bottom: 'inset-x-0 bottom-0 w-full',
} as const;

const SIZE_CLASS_HORIZONTAL = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[32rem]',
  full: 'w-[95vw]',
} as const;

const SIZE_CLASS_VERTICAL = {
  sm: 'h-1/4',
  md: 'h-1/2',
  lg: 'h-3/4',
  full: 'h-[95vh]',
} as const;

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function vaulDirection(side: DrawerProps['side']): 'left' | 'right' | 'top' | 'bottom' {
  return side ?? 'right';
}

export function Drawer({
  open,
  onOpenChange,
  side = 'right',
  size = 'md',
  title,
  children,
  footer,
  className,
}: DrawerProps): JSX.Element {
  const isHorizontal = side === 'left' || side === 'right';
  const sizeClass = isHorizontal
    ? SIZE_CLASS_HORIZONTAL[size]
    : SIZE_CLASS_VERTICAL[size];

  return (
    <Vaul.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={vaulDirection(side)}
    >
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Vaul.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-50 flex flex-col bg-background shadow-lg outline-none',
            SIDE_CLASS[side],
            sizeClass,
            className,
          )}
        >
          {title !== undefined && (
            <div className="border-b border-border px-4 py-3">
              <Vaul.Title className="text-lg font-semibold">{title}</Vaul.Title>
            </div>
          )}
          <div className="flex-1 overflow-auto p-4">{children}</div>
          {footer && (
            <div className="border-t border-border px-4 py-3">{footer}</div>
          )}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
Drawer.displayName = 'Drawer';
