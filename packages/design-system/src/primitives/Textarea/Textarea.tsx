/**
 * Textarea — multi-line input primitive.
 *
 * Mirrors `Input`'s prop surface: error visual, optional autoResize via
 * `react-textarea-autosize`. When `autoResize` is true, the textarea grows
 * with content (bounded by `minRows` and `maxRows`); otherwise it's a plain
 * `<textarea>` honoring the `rows` attribute.
 */
import {
  forwardRef,
  type TextareaHTMLAttributes,
} from 'react';
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize';

import { cn } from '../../utils/cn';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual error state (red border + aria-invalid). */
  error?: boolean;
  /** Auto-grow with content. Bounded by `minRows` and `maxRows`. */
  autoResize?: boolean;
  /** Minimum visible rows when autoResize is on. */
  minRows?: number;
  /** Maximum rows before scrolling kicks in (autoResize only). */
  maxRows?: number;
}

const baseClass =
  'flex min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      autoResize,
      minRows,
      maxRows,
      ...props
    },
    ref,
  ) => {
    const composed = cn(
      baseClass,
      error ? 'border-destructive' : 'border-input',
      className,
    );

    if (autoResize) {
      // react-textarea-autosize delegates to a <textarea>; ref + props pass
      // through unchanged.
      return (
        <TextareaAutosize
          ref={ref}
          aria-invalid={error || undefined}
          className={composed}
          minRows={minRows}
          maxRows={maxRows}
          {...(props as TextareaAutosizeProps)}
        />
      );
    }

    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={composed}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
