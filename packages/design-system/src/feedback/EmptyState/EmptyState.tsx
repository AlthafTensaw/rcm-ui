/**
 * EmptyState — placeholder for empty data lists/grids/screens.
 *
 * Use to communicate "no data here yet" with optional context and a
 * primary action. Three sizes (sm/md/lg) scale padding and the icon area.
 *
 * Note: a separate `EmptyState` lives in `@tensaw/composition` for the
 * composition-layer "missing zone" fallback. They serve different layers
 * and are intentionally distinct; v0.2 may unify.
 */
import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const SIZE_CLASS = {
  sm: 'px-4 py-6 text-sm',
  md: 'px-6 py-10 text-sm',
  lg: 'px-8 py-16 text-base',
} as const;

const ICON_SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const;

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** CTA button or button group. */
  action?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  size = 'md',
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md text-center',
        SIZE_CLASS[size],
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'inline-flex items-center justify-center text-muted-foreground',
            ICON_SIZE[size],
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="font-semibold leading-tight text-foreground">{title}</div>
      {description && (
        <p className="max-w-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
EmptyState.displayName = 'EmptyState';
