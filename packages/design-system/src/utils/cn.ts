/**
 * Conditional className composition with Tailwind class deduplication.
 *
 * Composes class strings using `clsx`, then resolves Tailwind utility
 * conflicts using `tailwind-merge`. The latter ensures that, for example,
 * `cn('px-2', 'px-4')` resolves to just `'px-4'` rather than emitting both.
 *
 * Standard shadcn/ui pattern. Every visual component in the design system
 * uses this for prop-driven className composition.
 *
 *   <button className={cn('px-2 text-sm', error && 'text-red-500', className)} />
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
