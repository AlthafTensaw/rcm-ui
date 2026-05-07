/**
 * Img — image with loading state and error fallback.
 *
 * On load, the placeholder (if provided) is shown; once the image
 * successfully loads, the placeholder is removed and the image becomes
 * visible. On error, the fallback (if provided) replaces the image entirely.
 *
 * `alt` is required at the type level — every image must have meaningful
 * alt text for screen readers (use `alt=""` only for purely decorative
 * images, intentionally).
 */
import {
  forwardRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';

export interface ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Replaces the image when load errors. */
  fallback?: ReactNode;
  /** Shown until the image has loaded. */
  loadingPlaceholder?: ReactNode;
}

type Status = 'loading' | 'loaded' | 'error';

export const Img = forwardRef<HTMLImageElement, ImgProps>(
  (
    { src, alt, fallback, loadingPlaceholder, className, ...props },
    ref,
  ) => {
    const [status, setStatus] = useState<Status>('loading');

    if (status === 'error' && fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        {status === 'loading' && loadingPlaceholder}
        <img
          ref={ref}
          src={src}
          alt={alt}
          onLoad={() => { setStatus('loaded'); }}
          onError={() => { setStatus('error'); }}
          className={cn(status === 'loading' && 'invisible', className)}
          {...props}
        />
      </>
    );
  },
);
Img.displayName = 'Img';
