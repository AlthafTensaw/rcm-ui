/**
 * Accordion — collapsible sections.
 *
 * Wraps `@radix-ui/react-accordion`. Two modes:
 *   - `single`: only one item open at a time (radio-like)
 *   - `multiple`: any number of items can be open
 *
 * Each `<AccordionItem>` carries a unique `value`. `<AccordionTrigger>`
 * renders the clickable header; `<AccordionContent>` is the body shown
 * when expanded. Headers include a chevron icon on the right that rotates
 * when expanded.
 */
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

// -- Root -------------------------------------------------------------------

// Radix's Root has overload types for single vs multiple; reuse them as-is.
export type AccordionProps = ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Root
>;

export const Accordion = AccordionPrimitive.Root;

// -- Item -------------------------------------------------------------------

export interface AccordionItemProps
  extends ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}

export const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn('border-b border-border', className)}
      {...props}
    />
  );
});

// -- Trigger ----------------------------------------------------------------

export interface AccordionTriggerProps
  extends Omit<
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    'children'
  > {
  children: ReactNode;
  /** Override the default chevron icon. Pass `null` to omit. */
  icon?: ReactNode;
}

export const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger({ className, children, icon, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex flex-1 items-center justify-between py-3 text-sm font-medium transition-all',
          'hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          '[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        <span className="flex-1 text-left">{children}</span>
        {icon === undefined ? (
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
            aria-hidden="true"
          />
        ) : (
          icon
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

// -- Content ----------------------------------------------------------------

export interface AccordionContentProps
  extends ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  children: ReactNode;
}

export const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        'overflow-hidden text-sm',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    >
      <div className="pb-3 pt-0">{children}</div>
    </AccordionPrimitive.Content>
  );
});
