/**
 * Badge — small status indicator.
 *
 * Compact label used for status, count, or category. Six visual variants
 * cover the common operational states (default/secondary/success/warning/
 * error/outline). Two sizes (sm/md). `icon` slot renders before the text.
 *
 * For removable chips inside a MultiSelect-style display, prefer `<Pill>`.
 * Badge is for read-only status; Pill carries a remove affordance.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-amber-100 text-amber-800',
        error: 'border-transparent bg-red-100 text-red-800',
        outline: 'border-input text-foreground',
      },
      size: {
        sm: 'h-5 px-2 text-xs',
        md: 'h-6 px-2.5 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
  children: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, size, icon, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {icon && (
        <span className="inline-flex h-3 w-3 items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';

export { badgeVariants };
