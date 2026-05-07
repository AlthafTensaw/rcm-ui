/**
 * Input — bare text input primitive.
 *
 * Distinct from `TextField` (the existing RCM compound that adds label, hint,
 * and error message in a single slab). This primitive renders just the
 * input plus optional start/end icon slots and an error-visual flag.
 * Higher-level form compounds (FormField, etc., in §8) wrap Input with the
 * label/error/helperText layout.
 */
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual error state (red border + aria-invalid). */
  error?: boolean;
  /** Icon node rendered inside the left edge of the input. */
  startIcon?: ReactNode;
  /** Icon node rendered inside the right edge of the input. */
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', error, startIcon, endIcon, ...props },
    ref,
  ) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </span>
        )}
        <input
          type={type}
          aria-invalid={error || undefined}
          className={cn(
            'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            startIcon && 'pl-10',
            endIcon && 'pr-10',
            error ? 'border-destructive' : 'border-input',
            className,
          )}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
