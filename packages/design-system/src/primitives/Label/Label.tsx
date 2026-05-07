/**
 * Label — wraps Radix's `<Label>` primitive.
 *
 * Auto-associates with the field whose `id` matches its `htmlFor` (Radix
 * also supports nesting the field inside the Label). When `required` is
 * true, renders a destructive-colored asterisk after the label content.
 */
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '../../utils/cn';

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  >
    {children}
    {required && (
      <span className="text-destructive ml-0.5" aria-hidden="true">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';
