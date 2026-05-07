/**
 * ActionLink — `<Link>` driven by a navigate-kind action.
 *
 * Uses the action's declared `to(args)` to compute the route at render
 * time so the rendered anchor has a real `href` (right-click → "Open in
 * new tab" works, browser history works, screen readers announce the
 * destination). On click, the component still dispatches the action via
 * `dispatchAction` so the platform's permission gate, telemetry, and
 * router-adapter integration all run.
 *
 * If the referenced action is missing or not a navigate action, the link
 * renders a non-interactive text span and logs a development warning.
 */
import {
  type AnchorHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useMemo,
} from 'react';
import { Link } from '@tensaw/design-system';
import { dispatchAction, getAction } from '@tensaw/actions';

export interface ActionLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  /** Action ID — must be of kind 'navigate'. */
  actionId: string;
  /** Args passed to the action's `to(args)` function. */
  request: unknown;
  variant?: 'default' | 'subtle' | 'destructive';
  children: ReactNode;
}

export function ActionLink({
  actionId,
  request,
  variant = 'default',
  children,
  className,
  ...rest
}: ActionLinkProps): JSX.Element {
  const decl = getAction(actionId);
  const href = useMemo(() => {
    if (!decl) return null;
    if (decl.kind !== 'navigate') return null;
    try {
      return decl.to(request);
    } catch {
      return null;
    }
  }, [decl, request]);

  if (href === null) {
    if (typeof console !== 'undefined') {
       
      console.warn(
        `[ActionLink] Action "${actionId}" is not registered or is not of kind 'navigate'.`,
      );
    }
    return (
      <span aria-disabled="true" className={className} {...rest}>
        {children}
      </span>
    );
  }

  function handleClick(e: ReactMouseEvent<HTMLAnchorElement>): void {
    // Allow modifier-clicks (open in new tab/window) to bypass dispatch.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    void dispatchAction(actionId, request);
  }

  return (
    <Link
      to={href}
      variant={variant}
      onClick={handleClick}
      {...(className !== undefined ? { className } : {})}
      {...rest}
    >
      {children}
    </Link>
  );
}
ActionLink.displayName = 'ActionLink';
