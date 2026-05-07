import { useState } from 'react';
import { TextField } from '../../primitives/TextField';
import { PrivacyField } from '../privacy/PrivacyField';
import { formatSsn, isValidSsn, maskSsn } from '../validators/ssn';

export interface SsnFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  validateOnBlur?: boolean;

  // PHI privacy
  recordType: string;
  recordId: string;
  canReveal?: boolean;
  onReveal?: (info: { fieldKey: string; recordType: string; recordId: string }) => void;
  autoMaskOnBlurMs?: number;

  /** Render the value masked even while typing (default false — typing is plaintext, display is mask). */
  alwaysMaskInput?: boolean;
}

/**
 * SSN input with auto-formatting (XXX-XX-XXXX) and HIPAA PrivacyField wrapper.
 *
 * UX model:
 *   - When the field is empty or actively being typed, plaintext is shown.
 *   - When the field has a stored value (e.g. on a detail page), it renders
 *     masked with a reveal toggle.
 *   - Reveal requires `canReveal` and fires `onReveal` for audit logging.
 *
 * The reveal mode is controlled by whether the field is currently the
 * "active editor" — for simplicity, the wrapped TextField is read-only when
 * masked, and editable when revealed or while focused-with-typing.
 */
export function SsnField({
  value,
  onChange,
  label = 'SSN',
  hint,
  error,
  required,
  validateOnBlur = false,
  recordType,
  recordId,
  canReveal = false,
  onReveal,
  autoMaskOnBlurMs,
  alwaysMaskInput = false,
}: SsnFieldProps) {
  const [touched, setTouched] = useState(false);

  const computedError =
    error ??
    (touched && validateOnBlur && value !== '' && !isValidSsn(value)
      ? 'SSN is not valid'
      : null);

  // If the value is empty, just show a plain editor — there's no PHI yet to mask.
  if (!value && !alwaysMaskInput) {
    return (
      <TextField
        label={label}
        hint={hint}
        error={computedError}
        required={required}
        value={value}
        onChange={(e) => { onChange(formatSsn(e.target.value)); }}
        onBlur={() => { setTouched(true); }}
        inputMode="numeric"
        autoComplete="off"
        placeholder="123-45-6789"
        maxLength={11}
      />
    );
  }

  return (
    <PrivacyField
      value={value}
      maskFn={maskSsn}
      fieldKey="ssn"
      recordType={recordType}
      recordId={recordId}
      canReveal={canReveal}
      onReveal={onReveal}
      autoMaskOnBlurMs={autoMaskOnBlurMs}
      render={({ displayValue, isRevealed, toggleReveal, canReveal: cr }) => (
        <TextField
          label={label}
          hint={hint}
          error={computedError}
          required={required}
          value={displayValue}
          readOnly={!isRevealed}
          onChange={(e) => { onChange(formatSsn(e.target.value)); }}
          onBlur={() => { setTouched(true); }}
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          rightAffix={
            cr ? (
              <button
                type="button"
                onClick={toggleReveal}
                aria-label={isRevealed ? 'Hide SSN' : 'Show SSN'}
                style={{
                  pointerEvents: 'auto',
                  fontSize: 'var(--tw-fs-sm)',
                  color: 'var(--tw-color-text-link)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isRevealed ? 'Hide' : 'Show'}
              </button>
            ) : null
          }
        />
      )}
    />
  );
}
