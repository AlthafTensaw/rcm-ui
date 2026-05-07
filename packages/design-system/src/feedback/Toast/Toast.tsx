/**
 * Toast — presentational visual.
 *
 * The transient, dismissible cousin of Alert (and the more visually
 * prominent cousin of Snackbar). Five variants cover the standard
 * operational states; each gets a default icon and color treatment.
 *
 * This is the **presentational** Toast — a self-contained visual that
 * fires `onDismiss` when its duration elapses or when the user clicks the
 * close button. The host component (`<ToastHost>` in
 * `@tensaw/wired-components`) wires a queue of these into a fixed-position
 * viewport and subscribes to `useNotificationsStore`.
 *
 * Note: while the spec says "wraps @radix-ui/react-toast", we render a
 * standalone visual here so consumers can drop a single `<Toast>` without
 * setting up a Radix `<ToastProvider>` + `<ToastViewport>`. The host owns
 * those concerns. Auto-dismiss / manual dismiss / variant icons / a11y
 * (`role="status"`, `aria-live`) all work the same.
 */
import { useEffect, type ReactNode } from 'react';
import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  Info,
  X,
} from 'lucide-react';

import { cn } from '../../utils/cn';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: 'border-input bg-background text-foreground',
  success: 'border-green-300 bg-green-50 text-green-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900',
};

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  default: <Info className="h-4 w-4" aria-hidden="true" />,
  success: <CircleCheck className="h-4 w-4" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
  error: <CircleX className="h-4 w-4" aria-hidden="true" />,
  info: <Info className="h-4 w-4" aria-hidden="true" />,
};

export interface ToastProps {
  variant?: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
  /** Action button slot. */
  action?: ReactNode;
  /** Fired by the close button or when `duration` elapses. */
  onDismiss?: () => void;
  /** ms; default 5000. Set to `null` to disable auto-dismiss. */
  duration?: number | null;
  className?: string;
  id?: string;
}

export function Toast({
  variant = 'default',
  title,
  description,
  action,
  onDismiss,
  duration = 5000,
  className,
  id,
}: ToastProps): JSX.Element {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => { clearTimeout(t); };
  }, [duration, onDismiss]);

  return (
    <div
      id={id}
      role="status"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 rounded-md border p-3 text-sm shadow-md',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <span className="mt-0.5 inline-flex shrink-0 items-center">
        {VARIANT_ICON[variant]}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="font-semibold leading-tight">{title}</div>
        {description && <div className="leading-snug">{description}</div>}
      </div>
      {action && <div className="ml-2 shrink-0">{action}</div>}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded',
          'opacity-70 hover:opacity-100',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        )}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
Toast.displayName = 'Toast';
