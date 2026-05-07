/**
 * Tooltip — hover/focus tooltip.
 *
 * Wraps `@radix-ui/react-tooltip`. Embeds its own `<Provider>` so consumers
 * can drop a `<Tooltip>` anywhere without first wiring the global provider
 * — the cost is one extra context boundary per tooltip. Apps that render
 * many tooltips can wrap their root in a single `<TooltipProvider>` from
 * Radix to share the timer; that provider is forward-compatible with this
 * component.
 *
 * `delayDuration` defaults to 700 ms (Radix default).
 */
import { type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  /** Disable rendering altogether (tooltip text is empty / not applicable). */
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 700,
  disabled,
  className,
}: TooltipProps): JSX.Element {
  if (disabled) {
    return <>{children}</>;
  }
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={4}
            className={cn(
              'z-50 overflow-hidden rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md',
              'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
Tooltip.displayName = 'Tooltip';
