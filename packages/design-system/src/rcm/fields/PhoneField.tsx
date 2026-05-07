import { useState } from 'react';
import { TextField, type TextFieldProps } from '../../primitives/TextField';
import { formatPhone, isValidPhone } from '../validators/phone';

export interface PhoneFieldProps
  extends Omit<TextFieldProps, 'onChange' | 'value' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  validateOnBlur?: boolean;
}

export function PhoneField({
  value,
  onChange,
  validateOnBlur = false,
  label = 'Phone',
  hint,
  error,
  onBlur,
  ...rest
}: PhoneFieldProps) {
  const [touched, setTouched] = useState(false);

  const computedError =
    error ??
    (touched && validateOnBlur && value !== '' && !isValidPhone(value)
      ? 'Phone is not valid'
      : null);

  return (
    <TextField
      {...rest}
      label={label}
      hint={hint}
      value={value}
      error={computedError}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={14}
      placeholder="(212) 555-1234"
      onChange={(e) => { onChange(formatPhone(e.target.value)); }}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
    />
  );
}
