/**
 * Alert — persistent inline banner.
 *
 * Different from `<Toast>`: Alert lives inline in the page (not an
 * overlay), persists until dismissed (or forever), and is intended for
 * page-level signals like "Data is X days stale" or "Your trial ends in 7
 * days." Use Toast for transient feedback after an action.
 *
 * `icon='auto'` picks an icon from the variant: success → CircleCheck,
 * warning → AlertTriangle, error → CircleX, info → Info, default → Info.
 * Pass an explicit `icon={...}` to override; pass `icon={null}` to omit.
 */
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  Info,
  X,
} from 'lucide-react';

import { cn } from '../../utils/cn';

export type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const VARIANT_CLASS: Record<AlertVariant, string> = {
  default: 'border-input bg-background text-foreground',
  success: 'border-green-300 bg-green-50 text-green-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900',
};

const VARIANT_ICON: Record<AlertVariant, ReactNode> = {
  default: <Info className="h-4 w-4" aria-hidden="true" />,
  success: <CircleCheck className="h-4 w-4" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
  error: <CircleX className="h-4 w-4" aria-hidden="true" />,
  info: <Info className="h-4 w-4" aria-hidden="true" />,
};

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: ReactNode;
  description?: ReactNode;
  /**
   * 'auto' picks an icon from the variant. Pass `null` to omit. The literal
   * `'auto'` is a runtime sentinel — TypeScript collapses it into `ReactNode`
   * via `string`, but we keep it in the type signature for IntelliSense.
   */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  icon?: ReactNode | 'auto';
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Action button slot rendered on the right edge. */
  action?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    className,
    variant = 'default',
    title,
    description,
    icon = 'auto',
    dismissible,
    onDismiss,
    action,
    children,
    ...props
  },
  ref,
) {
  const resolvedIcon = icon === 'auto' ? VARIANT_ICON[variant] : icon;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-md border p-3 text-sm',
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      {resolvedIcon && (
        <span className="mt-0.5 inline-flex shrink-0 items-center">
          {resolvedIcon}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1">
        {title && <div className="font-semibold leading-tight">{title}</div>}
        {description && <div className="leading-snug">{description}</div>}
        {children}
      </div>
      {action && <div className="ml-2 shrink-0">{action}</div>}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded',
            'opacity-70 hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
Alert.displayName = 'Alert';
