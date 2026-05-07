/**
 * IcdCodeField.
 *
 * ICD-10-CM diagnosis code with live combobox lookup against `@tensaw/codes`.
 * Default behavior: `billableOnly: true` — header codes are excluded from the
 * dropdown because they cannot appear on a claim line.
 *
 * Validation behavior:
 *   - Format check inline (1 letter + 2 digits, optional `.X` suffix).
 *   - On selection, the description is captured and made available via
 *     onSelect for parents that want to display it in a tooltip / next column.
 *   - On manual entry of a code that's in the bundled sample, the dropdown
 *     surfaces it. Codes not in the sample bundle pass format check but no
 *     description is shown.
 */

import { useMemo, useState } from 'react';
import { icd, type IcdEntry } from '@tensaw/codes/icd';
import { CodeSearchCombobox, type CodeSearchEntry } from './CodeSearchCombobox';

export interface IcdCodeFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Called with the full entry when a row is picked from the dropdown. */
  onSelect?: (entry: IcdEntry) => void;
  /**
   * If true (default), the dropdown excludes non-billable header codes. Header
   * codes still pass format validation if typed manually.
   */
  billableOnly?: boolean;
  placeholder?: string;
}

const ICD10_FORMAT = /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/i;

export function IcdCodeField({
  label = 'ICD-10',
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  onSelect,
  billableOnly = true,
  placeholder = 'I10, E11.21, M54.5...',
}: IcdCodeFieldProps) {
  // Description of the current value, surfaced as hint when no error.
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

  // Sync description from current value (handles initial value + manual entries).
  useMemo(() => {
    if (!value) {
      setSelectedDescription(null);
      return;
    }
    const entry = icd.get(value);
    setSelectedDescription(entry?.description ?? null);
  }, [value]);

  function searchFn(query: string): CodeSearchEntry[] {
    const upper = query.trim().toUpperCase();
    if (!upper) return [];
    return icd
      .search(upper, { billableOnly, limit: 25 })
      .map((entry) => ({
        code: entry.code,
        description: entry.description,
        secondary: `Chapter ${entry.chapter}${entry.billable ? '' : ' · header (not billable)'}`,
        disabled: !entry.billable && billableOnly,
      }));
  }

  function handleChange(next: string) {
    onChange(next.toUpperCase());
  }

  function handleSelect(picked: CodeSearchEntry) {
    const entry = icd.get(picked.code);
    if (entry) {
      setSelectedDescription(entry.description);
      onSelect?.(entry);
    }
  }

  const computedError = useMemo(() => {
    if (error) return error;
    if (!value) return null;
    if (!ICD10_FORMAT.test(value)) {
      return 'Invalid ICD-10 format (e.g. I10, E11.21)';
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
