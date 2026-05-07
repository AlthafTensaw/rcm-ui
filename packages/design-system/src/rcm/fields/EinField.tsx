import { useState } from 'react';
import { TextField, type TextFieldProps } from '../../primitives/TextField';
import { formatEin, isValidEin } from '../validators/ein';

export interface EinFieldProps
  extends Omit<TextFieldProps, 'onChange' | 'value' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  validateOnBlur?: boolean;
}

export function EinField({
  value,
  onChange,
  validateOnBlur = false,
  label = 'Tax ID (EIN)',
  hint = 'Format: XX-XXXXXXX',
  error,
  onBlur,
  ...rest
}: EinFieldProps) {
  const [touched, setTouched] = useState(false);

  const computedError =
    error ??
    (touched && validateOnBlur && value !== '' && !isValidEin(value)
      ? 'EIN prefix is not a valid IRS prefix'
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
      placeholder="87-3263971"
      onChange={(e) => { onChange(formatEin(e.target.value)); }}
      onBlur={(e) => {
        setTouched(true);
        onBlur?.(e);
      }}
    />
  );
}
