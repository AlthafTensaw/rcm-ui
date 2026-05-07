import { useState } from 'react';
import { TextField, type TextFieldProps } from '../../primitives/TextField';
import { formatNpi, isValidNpi } from '../validators/npi';

export interface NpiFieldProps
  extends Omit<TextFieldProps, 'onChange' | 'value' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  /** Show inline validation error on blur even before form submit. */
  validateOnBlur?: boolean;
}

/**
 * NPI input. Strips non-digits as you type; runs Luhn validation on blur if
 * `validateOnBlur` is true. The displayed value is the canonical 10-digit
 * form (no separators).
 */
export function NpiField({
  value,
  onChange,
  validateOnBlur = false,
  label = 'NPI',
  hint = '10-digit National Provider Identifier',
  error,
  onBlur,
  ...rest
}: NpiFieldProps) {
  const [touched, setTouched] = useState(false);

  const computedError =
    error ??
    (touched && validateOnBlur && value !== '' && !isValidNpi(value)
      ? 'NPI is not valid'
      : null);

  return (
    <TextField
      {...rest}
      label={label}
      hint={hint}
      value={value}
      error={computedError}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      placeholder="1234567893"
      onChange={(e) => { onChange(formatNpi(e.target.value)); }}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
    />
  );
}
