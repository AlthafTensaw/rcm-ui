/**
 * Link — internal navigation link.
 *
 * Wraps `react-router-dom`'s `<Link>` so client-side routing is handled
 * automatically. Three visual variants:
 *   - default: primary-colored, the typical inline link
 *   - subtle:  inherits foreground color, picks up primary on hover
 *   - destructive: destructive-colored (e.g., "Delete account")
 *
 * For external destinations, use `<ExternalLink>` instead — it adds the
 * appropriate `target` and `rel` attributes plus an icon.
 */
import { forwardRef } from 'react';
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from 'react-router-dom';

import { cn } from '../../utils/cn';

export interface LinkProps extends RouterLinkProps {
  variant?: 'default' | 'subtle' | 'destructive';
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <RouterLink
        ref={ref}
        className={cn(
          'underline-offset-4 hover:underline rounded',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'default' && 'text-primary',
          variant === 'subtle' && 'text-foreground hover:text-primary',
          variant === 'destructive' && 'text-destructive',
          className,
        )}
        {...props}
      />
    );
  },
);
Link.displayName = 'Link';
