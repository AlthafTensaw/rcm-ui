/**
 * ExternalLink — link to a destination outside the app.
 *
 * Always opens in a new tab with `rel="noopener noreferrer"` (security: the
 * new page can't access `window.opener`; referrer header is suppressed).
 * Renders an external-link icon by default to signal the navigation jump.
 *
 * For internal navigation, use `<Link>` (which delegates to react-router-dom).
 */
import {
  forwardRef,
  type AnchorHTMLAttributes,
} from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface ExternalLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'default' | 'subtle';
  /** Render the external-link icon after the children. Defaults to true. */
  showIcon?: boolean;
}

export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  (
    { className, variant = 'default', showIcon = true, children, ...props },
    ref,
  ) => {
    return (
      <a
        ref={ref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center underline-offset-4 hover:underline rounded',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'default' && 'text-primary',
          variant === 'subtle' && 'text-foreground hover:text-primary',
          className,
        )}
        {...props}
      >
        {children}
        {showIcon && (
          <ExternalLinkIcon
            className="ml-1 h-3 w-3 inline"
            aria-hidden="true"
          />
        )}
      </a>
    );
  },
);
ExternalLink.displayName = 'ExternalLink';
