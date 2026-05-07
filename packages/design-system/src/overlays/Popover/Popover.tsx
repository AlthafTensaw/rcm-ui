/**
 * Popover — anchored floating UI.
 *
 * Wraps `@radix-ui/react-popover` with the Tensaw `trigger` + `children`
 * shape. Pass `open` / `onOpenChange` for controlled mode; omit both for
 * uncontrolled (Radix manages open state internally).
 *
 * Used by other components as a positioning base (DropdownMenu, the rich
 * Combobox/MultiSelect popovers, ColorSwatch when wrapped). Most consumers
 * should reach for the higher-level component when one fits.
 */
import { type ReactNode } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '../../utils/cn';

export interface PopoverProps {
  /** Controlled open state. Omit both `open` and `onOpenChange` for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  className,
}: PopoverProps): JSX.Element {
  return (
    <PopoverPrimitive.Root
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
Popover.displayName = 'Popover';
