import { useState, type FocusEvent } from 'react';
import { TextField, type TextFieldProps } from '../../primitives/TextField';
import { formatMoney, parseMoney } from '../validators/money';

export interface MoneyFieldProps
  extends Omit<TextFieldProps, 'onChange' | 'value' | 'type'> {
  /** Numeric value. null = empty. */
  value: number | null;
  /** Receives the parsed numeric value, or null if empty. */
  onChange: (value: number | null) => void;
  /** Whether negative values are allowed (default true — overpayments, refunds). */
  allowNegative?: boolean;
  /** Custom error overriding the auto-derived one. */
  error?: string | null;
}

/**
 * USD money input.
 *
 * UX:
 *   - While typing, the raw string is held in local state and rendered as-is
 *     (so the user can type freely: "1,234.5" → still typing).
 *   - On blur, the value is parsed and re-formatted as `$1,234.56`. If parsing
 *     fails, the error is surfaced inline and the raw string remains visible.
 *   - The numeric value posted to onChange is the parsed number, not the
 *     formatted string — callers store numbers, renderers display.
 */
export function MoneyField({
  value,
  onChange,
  allowNegative = true,
  label = 'Amount',
  hint,
  error,
  placeholder = '$0.00',
  onBlur,
  onFocus,
  ...rest
}: MoneyFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const displayValue = draft ?? formatMoney(value);

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    if (draft === null) {
      onBlur?.(e);
      return;
    }

    const trimmed = draft.trim();
    if (trimmed === '') {
      setDraft(null);
      setParseError(null);
      onChange(null);
      onBlur?.(e);
      return;
    }

    const parsed = parseMoney(trimmed);
    if (parsed === null) {
      setParseError('Enter a valid USD amount');
      onBlur?.(e);
      return;
    }
    if (!allowNegative && parsed < 0) {
      setParseError('Amount cannot be negative');
      onBlur?.(e);
      return;
    }
    setParseError(null);
    setDraft(null);
    onChange(parsed);
    onBlur?.(e);
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    // On focus, switch to a less-formatted draft for editing comfort.
    if (value !== null) {
      // Show the bare number with optional decimals, no $.
      setDraft(formatMoney(value, { showSymbol: false }));
    }
    onFocus?.(e);
  }

  return (
    <TextField
      {...rest}
      label={label}
      hint={hint}
      error={error ?? parseError}
      value={displayValue}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      onChange={(e) => { setDraft(e.target.value); }}
      onBlur={handleBlur}
      onFocus={handleFocus}
      style={{
        textAlign: 'right',
        fontFeatureSettings: '"tnum"',
        // Negative values render in the danger color
        color:
          value !== null && value < 0
            ? 'var(--tw-color-text-danger)'
            : undefined,
      }}
    />
  );
}
