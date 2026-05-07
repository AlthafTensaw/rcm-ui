/**
 * Spinner — indeterminate progress indicator.
 *
 * Phase 6 final shape per §10.1.4 of the design-system buildout spec.
 * Extends the Phase 3 placeholder with:
 *   - `xs` size (12 px) for inline indicators inside dense rows
 *   - `variant` prop: `default` inherits the local text color (Tailwind's
 *     `currentColor`), `inverted` forces white for use on dark surfaces
 *     like primary buttons or destructive backgrounds
 *
 * Existing callers (Button, ConfirmDialog) continue to work unchanged —
 * `sm`/`md`/`lg` and the default variant behave identically to Phase 3.
 */
import { type FC } from 'react';
import { cn } from '../../utils/cn';

const SIZE_PX = { xs: 12, sm: 16, md: 20, lg: 24 } as const;

export interface SpinnerProps {
  size?: keyof typeof SIZE_PX;
  /**
   * `default` inherits text color via `currentColor`.
   * `inverted` forces white for use on dark backgrounds.
   */
  variant?: 'default' | 'inverted';
  className?: string;
  /** Override the default "Loading" announcement. */
  'aria-label'?: string;
}

export const Spinner: FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  'aria-label': ariaLabel = 'Loading',
}) => {
  const px = SIZE_PX[size];
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn(
        'inline-block',
        variant === 'inverted' && 'text-white',
        className,
      )}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={px}
        height={px}
        aria-hidden="true"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};
Spinner.displayName = 'Spinner';
