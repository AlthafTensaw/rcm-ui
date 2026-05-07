/**
 * Section — semantic content section with optional header.
 *
 * Used inside Panels for sub-grouping (e.g., a "Charges" section, a
 * "Payments" section under a single Panel). Renders as a `<section>` by
 * default; pass `as="div"` for visual-only grouping or `as="article"` for
 * standalone content.
 *
 * Header is optional — when no `title`, `description`, or `actions` are
 * given, no header renders and the section is just a styled container.
 */
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';

export interface SectionProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  as?: 'section' | 'div' | 'article';
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  {
    className,
    title,
    description,
    actions,
    children,
    as = 'section',
    ...props
  },
  ref,
) {
  const headerVisible =
    title !== undefined || description !== undefined || actions !== undefined;

  const Tag = as;

  return (
    <Tag
      // The polymorphic `Tag` accepts a ref typed to its specific element
      // (HTMLDivElement / HTMLElement). We cast through unknown so a single
      // forwardRef<HTMLElement> works for any of the three.
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {headerVisible && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            {title !== undefined && (
              <h3 className="text-sm font-semibold leading-tight">{title}</h3>
            )}
            {description !== undefined && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </Tag>
  );
});
Section.displayName = 'Section';
