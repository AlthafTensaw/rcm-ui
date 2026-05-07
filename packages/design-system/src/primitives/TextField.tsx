/**
 * TextField — the base text input primitive every form field wraps.
 *
 * Provides:
 *   - Floating-style label, value, error message, hint
 *   - Controlled value with `format` callback fired on blur
 *   - Right-side affix slot (used by RCM fields for age display, mask toggle)
 *   - Standard accessibility wiring (aria-invalid, aria-describedby)
 *
 * Visual treatment uses CSS variables from the design tokens so the field
 * theme automatically follows the active mode and density.
 */

import { forwardRef, useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Right-side content (icons, age display, reveal toggle). */
  rightAffix?: ReactNode;
  /** Wrapper className for laying out beside affixes. */
  containerClassName?: string;
  containerStyle?: CSSProperties;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    required,
    rightAffix,
    containerClassName,
    containerStyle,
    id,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={containerClassName}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tw-spacing-1)',
        ...containerStyle,
      }}
    >
      {label ? (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--tw-fs-base)',
            fontWeight: 'var(--tw-fw-medium)',
            color: 'var(--tw-color-text-secondary)',
          }}
        >
          {label}
          {required ? (
            <span style={{ color: 'var(--tw-color-text-danger)' }} aria-hidden>
              {' *'}
            </span>
          ) : null}
        </label>
      ) : null}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          {...rest}
          style={{
            flex: 1,
            height: 'var(--tw-density-input-height)',
            padding: '0 var(--tw-spacing-3)',
            paddingRight: rightAffix ? 'var(--tw-spacing-12)' : 'var(--tw-spacing-3)',
            background: 'var(--tw-color-input-bg)',
            border: '1px solid',
            borderColor: error
              ? 'var(--tw-color-text-danger)'
              : 'var(--tw-color-input-border)',
            borderRadius: 'var(--tw-radius-md)',
            color: 'var(--tw-color-input-text)',
            fontSize: 'var(--tw-fs-base)',
            outline: 'none',
            transition: 'border-color var(--tw-motion-duration-fast) var(--tw-motion-easing-standard)',
            ...((rest.style) ?? {}),
          }}
        />
        {rightAffix ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 'var(--tw-spacing-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--tw-spacing-1)',
              color: 'var(--tw-color-text-muted)',
              fontSize: 'var(--tw-fs-sm)',
              pointerEvents: 'none',
            }}
          >
            {rightAffix}
          </div>
        ) : null}
      </div>

      {error ? (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: 'var(--tw-fs-sm)',
            color: 'var(--tw-color-text-danger)',
          }}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={hintId}
          style={{
            fontSize: 'var(--tw-fs-sm)',
            color: 'var(--tw-color-text-muted)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
});
