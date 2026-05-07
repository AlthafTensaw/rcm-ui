/**
 * Skeleton — placeholder for loading content.
 *
 * Renders a pulse-animated rectangle (default), circle, or text-line.
 * `width` / `height` accept either a number (px) or a CSS string ('80%').
 *
 * For text variant, height defaults to 1em (a single line); use multiple
 * Skeletons stacked to mock paragraphs. Circles inherit width as their
 * height so they stay round regardless of which dimension you set.
 */
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
}

function toCss(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { className, variant = 'rectangular', width, height, style, ...props },
    ref,
  ) {
    const w = toCss(width);
    const h = toCss(height);
    const composedStyle: CSSProperties = {
      width: w,
      height:
        h ??
        (variant === 'text'
          ? '1em'
          : variant === 'circular'
            ? w
            : undefined),
      ...style,
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'animate-pulse bg-muted',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-md',
          variant === 'text' && 'rounded',
          className,
        )}
        style={composedStyle}
        {...props}
      />
    );
  },
);
Skeleton.displayName = 'Skeleton';
