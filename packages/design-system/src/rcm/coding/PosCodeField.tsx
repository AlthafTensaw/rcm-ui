/**
 * PosCodeField.
 *
 * Place of Service (CMS POS code set). Full bundled data — every CMS POS
 * code is in `@tensaw/codes/pos`. The dropdown shows code, short label, and
 * full description.
 *
 * Validation: 2-digit numeric. Single-digit input is auto-padded ('1' → '01').
 */

import { useMemo, useState } from 'react';
import { pos, type PosEntry } from '@tensaw/codes/pos';
import { CodeSearchCombobox, type CodeSearchEntry } from './CodeSearchCombobox';

export interface PosCodeFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (entry: PosEntry) => void;
  placeholder?: string;
}

const POS_FORMAT = /^\d{1,2}$/;

export function PosCodeField({
  label = 'Place of Service',
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  onSelect,
  placeholder = '11 (Office), 21 (Inpatient)...',
}: PosCodeFieldProps) {
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

  useMemo(() => {
    if (!value) {
      setSelectedDescription(null);
      return;
    }
    const entry = pos.get(value);
    setSelectedDescription(entry ? `${entry.shortLabel} — ${entry.description}` : null);
  }, [value]);

  function searchFn(query: string): CodeSearchEntry[] {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return pos
      .search(trimmed, { limit: 25 })
      .map((entry) => ({
        code: entry.code,
        description: entry.shortLabel,
        secondary: entry.description,
      }));
  }

  function handleChange(next: string) {
    // Strip non-digits, cap at 2.
    const digits = next.replace(/\D/g, '').slice(0, 2);
    onChange(digits);
  }

  function handleSelect(picked: CodeSearchEntry) {
    const entry = pos.get(picked.code);
    if (entry) {
      setSelectedDescription(`${entry.shortLabel} — ${entry.description}`);
      onSelect?.(entry);
    }
  }

  const computedError = useMemo(() => {
    if (error) return error;
    if (!value) return null;
    if (!POS_FORMAT.test(value)) {
      return 'POS code must be 1–2 digits';
    }
    if (value.length === 2 && !pos.isValid(value)) {
      return `${value} is not a recognized POS code`;
    }
    return null;
  }, [value, error]);

  const hintText = computedError ? null : selectedDescription ?? hint;

  return (
    <CodeSearchCombobox
      label={label}
      placeholder={placeholder}
      hint={hintText ?? undefined}
      error={computedError}
      required={required}
      disabled={disabled}
      value={value}
      onChange={handleChange}
      onSelect={handleSelect}
      search={searchFn}
    />
  );
}
