/**
 * DropdownMenu — action menu attached to a trigger button.
 *
 * Wraps `@radix-ui/react-dropdown-menu`. Use it for context-style action
 * menus ("more actions" buttons, row-level overflow menus). For navigation
 * panels, prefer `<TopNav>` or `<SideNav>` (Phase 7).
 *
 * Sub-components: `DropdownMenuItem`, `DropdownMenuSeparator`,
 * `DropdownMenuLabel` — each renders a Radix item with the matching
 * Tensaw class set. `DropdownMenuItem.shortcut` shows a right-aligned
 * keyboard-shortcut hint (visual only; doesn't bind the shortcut).
 */
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '../../utils/cn';

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  className,
}: DropdownMenuProps): JSX.Element {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            className,
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
DropdownMenu.displayName = 'DropdownMenu';

export interface DropdownMenuItemProps {
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  children: ReactNode;
  /** Visual-only keyboard shortcut hint. */
  shortcut?: string;
  className?: string;
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem(
  { icon, onSelect, disabled, variant = 'default', children, shortcut, className },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      onSelect={(e) => {
        // Spec: onSelect fires on activation. Prevent Radix's default scroll-anchor
        // behavior so the menu closes after selection (matches the spec contract).
        e.preventDefault();
        onSelect();
      }}
      disabled={disabled}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        variant === 'destructive' && 'text-destructive focus:bg-destructive focus:text-destructive-foreground',
        className,
      )}
    >
      {icon && <span className="inline-flex h-4 w-4 items-center">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto text-xs tracking-widest text-muted-foreground">
          {shortcut}
        </span>
      )}
    </DropdownMenuPrimitive.Item>
  );
});

export interface DropdownMenuSeparatorProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> {}

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});

export interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(function DropdownMenuLabel({ children, className }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground',
        className,
      )}
    >
      {children}
    </DropdownMenuPrimitive.Label>
  );
});
