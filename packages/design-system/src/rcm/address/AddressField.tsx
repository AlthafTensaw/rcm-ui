/**
 * AddressField — single component for every address in Tensaw apps.
 *
 * Modes (auto-managed; can be overridden):
 *   - 'view'         — single-line display ("123 Main St, Plano, TX 75024").
 *                      Click pencil/text → 'autocomplete'. Used when value is
 *                      complete and not forced into edit mode.
 *   - 'autocomplete' — single text input with Google Places dropdown.
 *                      User types, picks a suggestion, value populates from
 *                      the place. "Enter manually" link → 'manual'.
 *   - 'manual'       — five-field form (line1, line2, city, state, zip).
 *                      Used when API unavailable, place not found, or user
 *                      explicitly chose this. "Use search" link → 'autocomplete'.
 *
 * The value type is always the structured AddressValue. View mode uses
 * formatAddress() to collapse to single line. Country defaults to 'US' and is
 * shown only on non-US addresses.
 */

import { useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent } from 'react';
import { config } from '@tensaw/runtime';
import { states } from '@tensaw/codes/states';
import { TextField } from '../../primitives/TextField';
import { formatAddress } from './format';
import { parseGooglePlace } from './format';
import { loadPlacesLibrary, type PlacePrediction } from './loader';
import { EMPTY_ADDRESS, isCompleteAddress, type AddressValue } from './types';

export interface AddressFieldProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  /** Force the field to start in edit mode regardless of value. */
  forceEditMode?: boolean;
  /** Skip Google Places entirely and start in manual mode. */
  manualOnly?: boolean;
}

type Mode = 'view' | 'autocomplete' | 'manual';

interface PlacesService {
  autocomplete: InstanceType<NonNullable<Awaited<ReturnType<typeof loadPlacesLibrary>>>['AutocompleteService']>;
  details: InstanceType<NonNullable<Awaited<ReturnType<typeof loadPlacesLibrary>>>['PlacesService']>;
  sessionToken: unknown;
  statusOk: string;
}

export function AddressField({
  value,
  onChange,
  label = 'Address',
  hint,
  error,
  required,
  disabled,
  forceEditMode,
  manualOnly,
}: AddressFieldProps) {
  const initialMode: Mode = (() => {
    if (manualOnly) return 'manual';
    if (forceEditMode) return 'autocomplete';
    return isCompleteAddress(value) ? 'view' : 'autocomplete';
  })();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState<string>(() =>
    isCompleteAddress(value) ? formatAddress(value) : '',
  );
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const placesRef = useRef<PlacesService | null>(null);
  const detailsHostRef = useRef<HTMLDivElement | null>(null);
  const containerId = useId();

  // Lazy-load Google Maps on first focus of the autocomplete input.
  async function ensurePlacesLoaded(): Promise<PlacesService | null> {
    if (placesRef.current) return placesRef.current;
    if (!detailsHostRef.current) return null;
    try {
      setIsLoading(true);
      const lib = await loadPlacesLibrary(config.maps.googleApiKey);
      placesRef.current = {
        autocomplete: new lib.AutocompleteService(),
        details: new lib.PlacesService(detailsHostRef.current),
        sessionToken: new lib.AutocompleteSessionToken(),
        statusOk: lib.PlacesServiceStatus.OK,
      };
      setLoadError(null);
      return placesRef.current;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Address search unavailable';
      setLoadError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // Debounce predictions: 200ms after the user stops typing.
  useEffect(() => {
    if (mode !== 'autocomplete') return;
    if (!query || query.trim().length < 3) {
      setPredictions([]);
      return;
    }
    const handle = setTimeout(() => {
      void fetchPredictions(query);
    }, 200);
    return () => { clearTimeout(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode]);

  async function fetchPredictions(input: string) {
    const svc = await ensurePlacesLoaded();
    if (!svc) return;
    svc.autocomplete.getPlacePredictions(
      {
        input,
        sessionToken: svc.sessionToken,
        componentRestrictions: { country: 'us' },
        types: ['address'],
      },
      (preds, status) => {
        if (status === svc.statusOk && preds) {
          setPredictions(preds);
          setHighlightedIndex(-1);
        } else {
          setPredictions([]);
        }
      },
    );
  }

  function selectPrediction(prediction: PlacePrediction) {
    void resolvePrediction(prediction);
  }

  async function resolvePrediction(prediction: PlacePrediction) {
    const svc = await ensurePlacesLoaded();
    if (!svc) return;
    svc.details.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'place_id', 'geometry'],
        sessionToken: svc.sessionToken,
      },
      (result, status) => {
        if (status !== svc.statusOk || !result) return;
        const parsed = parseGooglePlace(result);
        if (!parsed) return;
        onChange(parsed);
        setQuery(formatAddress(parsed));
        setPredictions([]);
        setHighlightedIndex(-1);
        setMode('view');
      },
    );
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleInputFocus(_e: FocusEvent<HTMLInputElement>) {
    void ensurePlacesLoaded();
  }

  function handleInputBlur() {
    // Delay so click on prediction can register.
    setTimeout(() => {
      // If the user typed something but didn't pick — leave them in edit mode
      // unless they had a complete value to begin with.
      if (predictions.length === 0 && isCompleteAddress(value)) {
        setMode('view');
        setQuery(formatAddress(value));
      }
      setHighlightedIndex(-1);
    }, 150);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (predictions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const pred = predictions[highlightedIndex];
      if (pred) selectPrediction(pred);
    } else if (e.key === 'Escape') {
      setPredictions([]);
      setHighlightedIndex(-1);
    }
  }

  function startEditing() {
    if (disabled) return;
    setMode('autocomplete');
    setQuery(isCompleteAddress(value) ? formatAddress(value) : '');
  }

  function switchToManual() {
    setMode('manual');
  }

  function switchToAutocomplete() {
    setMode('autocomplete');
    setQuery(isCompleteAddress(value) ? formatAddress(value) : '');
  }

  function onManualFieldChange(field: keyof AddressValue, fieldValue: string) {
    const base: AddressValue = value ?? { ...EMPTY_ADDRESS };
    onChange({ ...base, [field]: fieldValue });
  }

  function finishManualEditing() {
    if (isCompleteAddress(value)) {
      setMode('view');
      setQuery(formatAddress(value));
    }
  }

  // -- Render: view mode -----------------------------------------------------

  if (mode === 'view') {
    return (
      <div style={containerStyle}>
        {label ? (
          <label htmlFor={`${containerId}-view`} style={labelStyle}>
            {label}
            {required ? (
              <span style={{ color: 'var(--tw-color-text-danger)' }} aria-hidden>
                {' *'}
              </span>
            ) : null}
          </label>
        ) : null}
        <button
          type="button"
          id={`${containerId}-view`}
          onClick={startEditing}
          disabled={disabled}
          aria-label={`Edit ${label.toLowerCase()}`}
          style={viewButtonStyle(disabled)}
        >
          <span style={{ flex: 1 }}>{formatAddress(value)}</span>
          <span aria-hidden style={pencilStyle}>
            ✎
          </span>
        </button>
        {error ? <span style={errorTextStyle}>{error}</span> : hint ? <span style={hintTextStyle}>{hint}</span> : null}
        <div ref={detailsHostRef} aria-hidden style={{ display: 'none' }} />
      </div>
    );
  }

  // -- Render: manual mode ---------------------------------------------------

  if (mode === 'manual') {
    return (
      <div style={containerStyle}>
        {label ? (
          <label style={labelStyle}>
            {label}
            {required ? (
              <span style={{ color: 'var(--tw-color-text-danger)' }} aria-hidden>
                {' *'}
              </span>
            ) : null}
          </label>
        ) : null}

        <div style={{ display: 'grid', gap: 'var(--tw-spacing-2)' }}>
          <TextField
            placeholder="Address line 1"
            value={value?.addressLine1 ?? ''}
            onChange={(e) => { onManualFieldChange('addressLine1', e.target.value); }}
            disabled={disabled}
          />
          <TextField
            placeholder="Address line 2 (optional)"
            value={value?.addressLine2 ?? ''}
            onChange={(e) => { onManualFieldChange('addressLine2', e.target.value); }}
            disabled={disabled}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--tw-spacing-2)' }}>
            <TextField
              placeholder="City"
              value={value?.city ?? ''}
              onChange={(e) => { onManualFieldChange('city', e.target.value); }}
              disabled={disabled}
            />
            <select
              value={value?.state ?? ''}
              onChange={(e) => { onManualFieldChange('state', e.target.value); }}
              disabled={disabled}
              style={selectStyle}
              aria-label="State"
            >
              <option value="">State</option>
              {states.list().map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
            <TextField
              placeholder="ZIP"
              value={value?.zip ?? ''}
              onChange={(e) => { onManualFieldChange('zip', e.target.value); }}
              disabled={disabled}
              style={{ width: 110 }}
            />
          </div>
        </div>

        <div style={modeSwitchRowStyle}>
          {!manualOnly && !loadError ? (
            <button type="button" onClick={switchToAutocomplete} style={linkButtonStyle}>
              Use address search
            </button>
          ) : null}
          <button type="button" onClick={finishManualEditing} style={linkButtonStyle}>
            Done
          </button>
        </div>
        {error ? <span style={errorTextStyle}>{error}</span> : hint ? <span style={hintTextStyle}>{hint}</span> : null}
        <div ref={detailsHostRef} aria-hidden style={{ display: 'none' }} />
      </div>
    );
  }

  // -- Render: autocomplete mode ---------------------------------------------

  return (
    <div style={containerStyle}>
      {label ? (
        <label htmlFor={`${containerId}-input`} style={labelStyle}>
          {label}
          {required ? (
            <span style={{ color: 'var(--tw-color-text-danger)' }} aria-hidden>
              {' *'}
            </span>
          ) : null}
        </label>
      ) : null}

      <div style={{ position: 'relative' }}>
        <TextField
          id={`${containerId}-input`}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Start typing address…"
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`${containerId}-listbox`}
          aria-expanded={predictions.length > 0}
          role="combobox"
        />

        {predictions.length > 0 ? (
          <ul
            id={`${containerId}-listbox`}
            role="listbox"
            style={dropdownStyle}
          >
            {predictions.map((p, i) => (
              <li
                key={p.place_id}
                role="option"
                aria-selected={i === highlightedIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectPrediction(p);
                }}
                onMouseEnter={() => { setHighlightedIndex(i); }}
                style={dropdownItemStyle(i === highlightedIndex)}
              >
                <div style={{ fontWeight: 'var(--tw-fw-medium)' }}>
                  {p.structured_formatting?.main_text ?? p.description}
                </div>
                {p.structured_formatting?.secondary_text ? (
                  <div style={{ fontSize: 'var(--tw-fs-sm)', color: 'var(--tw-color-text-muted)' }}>
                    {p.structured_formatting.secondary_text}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div style={modeSwitchRowStyle}>
        <button type="button" onClick={switchToManual} style={linkButtonStyle}>
          Enter manually
        </button>
        {isLoading ? <span style={hintTextStyle}>Loading address search…</span> : null}
        {loadError ? <span style={errorTextStyle}>{loadError}</span> : null}
      </div>

      {error ? <span style={errorTextStyle}>{error}</span> : hint ? <span style={hintTextStyle}>{hint}</span> : null}
      <div ref={detailsHostRef} aria-hidden style={{ display: 'none' }} />
    </div>
  );
}

// -- Styles ------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tw-spacing-1)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--tw-fs-base)',
  fontWeight: 'var(--tw-fw-medium)',
  color: 'var(--tw-color-text-secondary)',
};

const viewButtonStyle = (disabled?: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tw-spacing-2)',
  width: '100%',
  textAlign: 'left',
  height: 'var(--tw-density-input-height)',
  padding: '0 var(--tw-spacing-3)',
  background: 'var(--tw-color-input-bg)',
  border: '1px solid var(--tw-color-input-border)',
  borderRadius: 'var(--tw-radius-md)',
  color: 'var(--tw-color-input-text)',
  fontSize: 'var(--tw-fs-base)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

const pencilStyle: React.CSSProperties = {
  color: 'var(--tw-color-text-muted)',
  fontSize: 'var(--tw-fs-base)',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  background: 'var(--tw-color-surface-raised)',
  border: '1px solid var(--tw-color-border-default)',
  borderRadius: 'var(--tw-radius-md)',
  boxShadow: 'var(--tw-shadow-md)',
  zIndex: 'var(--tw-z-popover)',
  maxHeight: 300,
  overflowY: 'auto',
};

const dropdownItemStyle = (highlighted: boolean): React.CSSProperties => ({
  padding: 'var(--tw-spacing-2) var(--tw-spacing-3)',
  cursor: 'pointer',
  background: highlighted ? 'var(--tw-color-table-row-hover-bg)' : 'transparent',
  borderBottom: '1px solid var(--tw-color-border-muted)',
});

const modeSwitchRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tw-spacing-3)',
  marginTop: 'var(--tw-spacing-1)',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--tw-color-text-link)',
  fontSize: 'var(--tw-fs-sm)',
  cursor: 'pointer',
  textDecoration: 'underline',
};

const selectStyle: React.CSSProperties = {
  height: 'var(--tw-density-input-height)',
  padding: '0 var(--tw-spacing-2)',
  background: 'var(--tw-color-input-bg)',
  border: '1px solid var(--tw-color-input-border)',
  borderRadius: 'var(--tw-radius-md)',
  fontSize: 'var(--tw-fs-base)',
  width: 80,
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 'var(--tw-fs-sm)',
  color: 'var(--tw-color-text-danger)',
};

const hintTextStyle: React.CSSProperties = {
  fontSize: 'var(--tw-fs-sm)',
  color: 'var(--tw-color-text-muted)',
};
