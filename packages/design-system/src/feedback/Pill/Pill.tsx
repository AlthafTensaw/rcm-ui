/**
 * Pill — pill-shaped inline label.
 *
 * Distinct from `Badge`: Pill is fully rounded ("pill"-shaped), softer
 * coloring, and supports a remove affordance for chip-style displays
 * (selected items in a MultiSelect, applied filters, tags). Use Badge for
 * read-only status; use Pill when the label can be dismissed.
 *
 * The X button uses the Pill's accessible label "Remove <children>" so
 * screen readers announce what's being removed.
 */
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface PillProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: 'default' | 'subtle';
  removable?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { className, variant = 'default', removable, onRemove, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-secondary text-secondary-foreground',
        variant === 'subtle' && 'bg-muted text-muted-foreground',
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={
            typeof children === 'string' ? `Remove ${children}` : 'Remove'
          }
          className={cn(
            'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full',
            'hover:bg-foreground/10',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
});
Pill.displayName = 'Pill';
