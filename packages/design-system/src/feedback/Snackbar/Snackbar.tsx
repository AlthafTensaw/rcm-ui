/**
 * Snackbar — auto-dismissing message at the bottom of the screen.
 *
 * Distinct from Toast: less visually prominent, auto-dismisses (no manual
 * close button), positioned at bottom (host's responsibility), and meant
 * for low-stakes confirmations like "Saved" or "Copied to clipboard."
 *
 * This is the **presentational** Snackbar — a self-contained visual that
 * fires `onTimeout` when its `duration` elapses. The host component (in
 * `@tensaw/wired-components`) wires it to `useNotificationsStore` and
 * positions a fixed-bottom container.
 */
import { useEffect, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type SnackbarVariant = 'default' | 'success' | 'warning' | 'error';

const VARIANT_CLASS: Record<SnackbarVariant, string> = {
  default: 'bg-foreground text-background',
  success: 'bg-green-700 text-white',
  warning: 'bg-amber-700 text-white',
  error: 'bg-red-700 text-white',
};

export interface SnackbarProps {
  variant?: SnackbarVariant;
  message: ReactNode;
  action?: ReactNode;
  /** ms; default 3000. Set to 0 / null to disable auto-dismiss. */
  duration?: number | null;
  /** Fired when the duration elapses (host typically removes the snackbar). */
  onTimeout?: () => void;
  className?: string;
  id?: string;
}

export function Snackbar({
  variant = 'default',
  message,
  action,
  duration = 3000,
  onTimeout,
  className,
  id,
}: SnackbarProps): JSX.Element {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => {
      onTimeout?.();
    }, duration);
    return () => { clearTimeout(t); };
  }, [duration, onTimeout]);

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex max-w-md items-center gap-3 rounded-md px-3 py-2 text-sm shadow-lg',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <span className="flex-1">{message}</span>
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}
Snackbar.displayName = 'Snackbar';
