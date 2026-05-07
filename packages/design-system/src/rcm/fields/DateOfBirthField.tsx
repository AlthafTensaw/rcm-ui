import { useState } from 'react';
import { TextField } from '../../primitives/TextField';
import { PrivacyField } from '../privacy/PrivacyField';
import { formatAge, isValidDob, maskDob, parseDob } from '../validators/dob';

export interface DateOfBirthFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  validateOnBlur?: boolean;

  /** Show age beside the field once a valid DOB is entered. */
  showAge?: boolean;

  // PHI privacy
  recordType: string;
  recordId: string;
  canReveal?: boolean;
  onReveal?: (info: { fieldKey: string; recordType: string; recordId: string }) => void;
  autoMaskOnBlurMs?: number;
}

/** Format input as user types: digits only, auto-insert slashes after MM and DD. */
function formatDobInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function DateOfBirthField({
  value,
  onChange,
  label = 'Date of Birth',
  hint = 'MM/DD/YYYY',
  error,
  required,
  validateOnBlur = false,
  showAge = true,
  recordType,
  recordId,
  canReveal = false,
  onReveal,
  autoMaskOnBlurMs,
}: DateOfBirthFieldProps) {
  const [touched, setTouched] = useState(false);

  const computedError =
    error ??
    (touched && validateOnBlur && value !== '' && !isValidDob(value)
      ? 'Date of birth is invalid'
      : null);

  const ageDisplay = showAge && parseDob(value) !== null ? formatAge(value) : '';

  // If the value is empty, render a plain editor.
  if (!value) {
    return (
      <TextField
        label={label}
        hint={hint}
        error={computedError}
        required={required}
        value={value}
        onChange={(e) => { onChange(formatDobInput(e.target.value)); }}
        onBlur={() => { setTouched(true); }}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        rightAffix={ageDisplay ? <span>{ageDisplay}</span> : null}
      />
    );
  }

  return (
    <PrivacyField
      value={value}
      maskFn={maskDob}
      fieldKey="dob"
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
          onChange={(e) => { onChange(formatDobInput(e.target.value)); }}
          onBlur={() => { setTouched(true); }}
          inputMode="numeric"
          autoComplete="bday"
          maxLength={10}
          rightAffix={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--tw-spacing-2)' }}>
              {showAge && isRevealed && ageDisplay ? <span>{ageDisplay}</span> : null}
              {cr ? (
                <button
                  type="button"
                  onClick={toggleReveal}
                  aria-label={isRevealed ? 'Hide DOB' : 'Show DOB'}
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
              ) : null}
            </span>
          }
        />
      )}
    />
  );
}
