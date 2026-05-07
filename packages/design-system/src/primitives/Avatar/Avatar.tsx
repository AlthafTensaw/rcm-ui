/**
 * Avatar — user avatar with initials fallback.
 *
 * Wraps `@radix-ui/react-avatar`. If `src` fails to load (or is missing),
 * falls back to `fallbackText` if provided, else auto-derives initials from
 * `alt` (first letter of the first two words, uppercased).
 *
 * Sizes match the avatar grid in the operations console mockups: 24/32/40 px
 * for sm/md/lg respectively.
 */
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '../../utils/cn';

const SIZE_CLASS = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
} as const;

export interface AvatarProps
  extends Omit<
    ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    'children'
  > {
  src?: string;
  alt: string;
  /** Falls back to derived initials from `alt` when omitted. */
  fallbackText?: string;
  size?: keyof typeof SIZE_CLASS;
}

function deriveInitials(alt: string): string {
  const parts = alt.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ src, alt, fallbackText, size = 'md', className, ...props }, ref) => {
  const initials = fallbackText ?? deriveInitials(alt);
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium"
        aria-label={alt}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = 'Avatar';
