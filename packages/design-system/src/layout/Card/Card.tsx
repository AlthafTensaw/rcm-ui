/**
 * Card — a card-shaped container for grouping primitives.
 *
 * The smallest layout shell. Three visual variants:
 *   - default: white surface with subtle border + shadow
 *   - subtle:  muted background, no shadow (good for contained groupings)
 *   - outline: borderless transparent background (no shadow)
 *
 * Sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
 * `CardFooter`) wrap content in the standard slab layout. Use them
 * compositionally — none are required, but pairings of header + content +
 * footer are the common case.
 *
 * For widget-shaped containers with title/actions/loading/error/empty
 * states baked in, use `<Widget>` (§12.1.2) instead. For larger layout
 * regions, use `<Panel>` (§12.1.3).
 */
import {
  forwardRef,
  type HTMLAttributes,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../utils/cn';

const cardVariants = cva('rounded-lg', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground border border-border shadow-sm',
      subtle: 'bg-muted text-foreground',
      outline: 'border border-border text-foreground',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'default', padding: 'none' },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, padding, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1.5 p-4 pb-2', className)}
        {...props}
      />
    );
  },
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-base font-semibold leading-tight tracking-tight',
          className,
        )}
        {...props}
      />
    );
  },
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('p-4 pt-2', className)} {...props} />;
  },
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 border-t border-border p-4 pt-3',
          className,
        )}
        {...props}
      />
    );
  },
);
CardFooter.displayName = 'CardFooter';

export { cardVariants };
