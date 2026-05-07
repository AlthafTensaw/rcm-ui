/**
 * HcpcsCodeField.
 *
 * HCPCS Level II combobox. Format: letter prefix + 4 digits (`A0428`, `J1100`,
 * `G0438`). The bundled `@tensaw/codes/hcpcs` table is a sample (~25 of
 * thousands), so codes that pass format check but are not in the bundle
 * simply have no description shown.
 */

import { useMemo, useState } from 'react';
import { hcpcs, type HcpcsEntry } from '@tensaw/codes/hcpcs';
import { CodeSearchCombobox, type CodeSearchEntry } from './CodeSearchCombobox';

export interface HcpcsCodeFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (entry: HcpcsEntry) => void;
  placeholder?: string;
}

const HCPCS_FORMAT = /^[A-V]\d{4}$/i;

export function HcpcsCodeField({
  label = 'HCPCS',
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  onSelect,
  placeholder = 'J1100, G0438, A0428...',
}: HcpcsCodeFieldProps) {
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

  useMemo(() => {
    if (!value) {
      setSelectedDescription(null);
      return;
    }
    const entry = hcpcs.get(value);
    setSelectedDescription(entry?.description ?? null);
  }, [value]);

  function searchFn(query: string): CodeSearchEntry[] {
    const upper = query.trim().toUpperCase();
    if (!upper) return [];
    return hcpcs
      .search(upper, { limit: 25 })
      .map((entry) => ({
        code: entry.code,
        description: entry.description,
        secondary: `Category ${entry.category}`,
      }));
  }

  function handleChange(next: string) {
    onChange(next.toUpperCase());
  }

  function handleSelect(picked: CodeSearchEntry) {
    const entry = hcpcs.get(picked.code);
    if (entry) {
      setSelectedDescription(entry.description);
      onSelect?.(entry);
    }
  }

  const computedError = useMemo(() => {
    if (error) return error;
    if (!value) return null;
    if (!HCPCS_FORMAT.test(value)) {
      return 'HCPCS format: 1 letter + 4 digits (e.g. J1100)';
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
