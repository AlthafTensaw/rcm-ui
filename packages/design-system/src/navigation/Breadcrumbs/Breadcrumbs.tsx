/**
 * Breadcrumbs — page hierarchy trail.
 *
 * Renders an aria-labelled `<nav>` with an ordered list of crumbs. Crumbs
 * with `to` are clickable navigation links (uses `<Link>`); crumbs without
 * `to` are read-only — typically the last item, representing the current
 * page.
 *
 * `maxItems` collapses the middle to a "…" placeholder when the trail
 * exceeds it, keeping the first item, the ellipsis, and the last two items
 * (a common breadcrumb collapse pattern).
 */
import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { Link } from '../../primitives/Link';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Internal route. Omit for the current-page crumb. */
  to?: string;
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  /** Max visible items before middle collapse. Default: no collapse. */
  maxItems?: number;
  className?: string;
  'aria-label'?: string;
}

/** Collapse the middle to first + ellipsis + last two when exceeding cap. */
function collapse(
  items: BreadcrumbItem[],
  max: number | undefined,
): (BreadcrumbItem | 'ellipsis')[] {
  if (!max || items.length <= max) return items;
  // Keep first crumb, ellipsis, then the trailing (max - 2) crumbs.
  const tailCount = Math.max(max - 2, 1);
  const tail = items.slice(items.length - tailCount);
  const head = items[0];
  return head ? [head, 'ellipsis', ...tail] : tail;
}

export function Breadcrumbs({
  items,
  separator,
  maxItems,
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
}: BreadcrumbsProps): JSX.Element {
  const visible = collapse(items, maxItems);
  const sep = separator ?? (
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
  );

  return (
    <nav aria-label={ariaLabel} className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {visible.map((item, idx) => {
          const isLast = idx === visible.length - 1;
          if (item === 'ellipsis') {
            return (
              <li
                key={`ellipsis-${idx}`}
                className="flex items-center gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className="px-1 text-muted-foreground"
                >
                  …
                </span>
                {!isLast && (
                  <span aria-hidden="true" className="inline-flex">
                    {sep}
                  </span>
                )}
              </li>
            );
          }
          const content = (
            <span className="inline-flex items-center gap-1">
              {item.icon && (
                <span className="inline-flex h-3.5 w-3.5 items-center" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </span>
          );
          return (
            <li
              key={idx}
              className="flex items-center gap-1.5"
            >
              {item.to && !isLast ? (
                <Link to={item.to} variant="subtle">
                  {content}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {content}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="inline-flex">
                  {sep}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
Breadcrumbs.displayName = 'Breadcrumbs';
