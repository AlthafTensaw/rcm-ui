/**
 * CptCodeField.
 *
 * CPT (Current Procedural Terminology) code field. Special handling because
 * AMA licensing prevents bundling the CPT table — the source of truth is a
 * server adapter wired via `cpt.useServerLookup(adapter)`.
 *
 * Behavior (per locked decisions):
 *   1. Format check inline — 5 digits required.
 *   2. Async description lookup on blur if the server adapter is wired.
 *      - On focus: combobox dropdown is populated from `cpt.search()` async.
 *      - On blur with a 5-digit value: `cpt.getAsync()` is called to fetch
 *        the description, which is then surfaced as the hint.
 *      - If no adapter is wired, no error — value passes format check and
 *        description simply isn't shown.
 *   3. If the adapter returns undefined for a well-formed code (i.e. the
 *      backend doesn't recognize it), an info-level hint says "Code not
 *      found in CPT catalog" — but no error.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { cpt, type CptEntry } from '@tensaw/codes/cpt';
import { CodeSearchCombobox, type CodeSearchEntry } from './CodeSearchCombobox';

export interface CptCodeFieldProps {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (entry: CptEntry) => void;
  placeholder?: string;
}

const CPT_FORMAT = /^\d{5}$/;

export function CptCodeField({
  label = 'CPT',
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  onSelect,
  placeholder = '99213, 93000, 99214...',
}: CptCodeFieldProps) {
  const [serverDescription, setServerDescription] = useState<string | null>(null);
  const [serverLookupAttempted, setServerLookupAttempted] = useState(false);

  // Tracks the latest async lookup so we can ignore stale resolutions.
  const lookupGenRef = useRef(0);

  // On value change to a well-formed code, kick off async lookup.
  useEffect(() => {
    if (!value || !CPT_FORMAT.test(value)) {
      setServerDescription(null);
      setServerLookupAttempted(false);
      return;
    }

    // Already cached?
    const cached = cpt.get(value);
    if (cached) {
      setServerDescription(cached.description);
      setServerLookupAttempted(true);
      return;
    }

    // Async lookup. Bumps a generation counter so old responses are ignored.
    const myGen = ++lookupGenRef.current;
    setServerLookupAttempted(false);
    void cpt
      .getAsync(value)
      .then((entry) => {
        if (myGen !== lookupGenRef.current) return;
        setServerDescription(entry?.description ?? null);
        setServerLookupAttempted(true);
      })
      .catch(() => {
        if (myGen !== lookupGenRef.current) return;
        setServerLookupAttempted(true);
      });
  }, [value]);

  function searchFn(query: string): Promise<CodeSearchEntry[]> {
    const trimmed = query.trim();
    if (!trimmed) return Promise.resolve([]);
    return cpt
      .search(trimmed, { limit: 25 })
      .then((entries) =>
        entries.map((entry) => ({
          code: entry.code,
          description: entry.description,
          secondary: entry.section ? `Section ${entry.section}` : undefined,
        })),
      )
      .catch(() => []);
  }

  function handleChange(next: string) {
    const digits = next.replace(/\D/g, '').slice(0, 5);
    onChange(digits);
  }

  function handleSelect(picked: CodeSearchEntry) {
    setServerDescription(picked.description);
    setServerLookupAttempted(true);
    // Pull the cached entry — onSelect should receive the typed CptEntry.
    const entry = cpt.get(picked.code);
    if (entry) onSelect?.(entry);
  }

  const computedError = useMemo(() => {
    if (error) return error;
    if (!value) return null;
    if (!CPT_FORMAT.test(value)) {
      return 'CPT must be 5 digits';
    }
    return null;
  }, [value, error]);

  const computedHint = useMemo(() => {
    if (computedError) return null;
    if (serverDescription) return serverDescription;
    if (
      serverLookupAttempted &&
      value &&
      CPT_FORMAT.test(value) &&
      serverDescription === null
    ) {
      return 'Code not found in CPT catalog';
    }
    return hint ?? null;
  }, [computedError, serverDescription, serverLookupAttempted, value, hint]);

  return (
    <CodeSearchCombobox
      label={label}
      placeholder={placeholder}
      hint={computedHint ?? undefined}
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
