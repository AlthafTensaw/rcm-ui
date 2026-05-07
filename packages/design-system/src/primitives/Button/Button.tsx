/**
 * Button — the canonical actionable primitive.
 *
 * Variants follow the shadcn/ui standard set: primary / secondary / outline /
 * ghost / destructive / link. Sizes are sm / md / lg / icon (icon is square,
 * used by `IconButton`). The `loading` prop replaces the leading icon with a
 * spinner and disables clicks; `asChild` lets consumers wrap the button
 * around another element (most commonly a `<Link>`) while keeping the visual
 * styling.
 *
 * Variant class strings are exported as `buttonVariants` so other components
 * (notably `IconButton` and `Link` when rendered as a button) can opt into
 * the same surface treatment via `cva`'s composition.
 *
 * `asChild` note: Radix `Slot` requires exactly one React element child. We
 * use Radix's `Slottable` to mark the consumer's element as the slottable
 * one while still allowing the leading/trailing icons (or spinner) to
 * render around it via Slot.
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { Spinner } from '../../feedback/Spinner';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 py-2',
        lg: 'h-10 px-8 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child element (e.g., a Link) instead of a button. */
  asChild?: boolean;
  /** Show spinner; disables click. */
  loading?: boolean;
  /** Optional leading icon (rendered before children). */
  leadingIcon?: ReactNode;
  /** Optional trailing icon (rendered after children). */
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      leadingIcon,
      trailingIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : leadingIcon}
        <Slottable>{children}</Slottable>
        {!loading && trailingIcon}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
