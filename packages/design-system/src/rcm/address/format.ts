/**
 * Address single-line formatting and Google Places parsing.
 *
 * `formatAddress(value)` produces the single-line display per spec:
 *   "123 Main St, Suite 200, Plano, TX 75024"
 *
 * No country shown for US addresses (the locked default). For non-US addresses
 * the country code is appended.
 *
 * `parseGooglePlace(place)` converts a Google Places API result into an
 * AddressValue with structured fields.
 */

import type { AddressValue } from './types';

/**
 * Format an address for single-line display.
 * Returns empty string if address is null/undefined or has no components.
 */
export function formatAddress(value: AddressValue | null | undefined): string {
  if (!value) return '';

  const parts: string[] = [];
  const line1 = value.addressLine1.trim();
  if (line1) parts.push(line1);

  const line2 = (value.addressLine2 ?? '').trim();
  if (line2) parts.push(line2);

  const city = value.city.trim();
  if (city) parts.push(city);

  // State + ZIP joined as one token: "TX 75024"
  const stateZip = [value.state.trim(), value.zip.trim()].filter(Boolean).join(' ');
  if (stateZip) parts.push(stateZip);

  // Country only shown when non-US (we're US-only by deployment).
  const country = (value.country ?? 'US').toUpperCase();
  if (country && country !== 'US') parts.push(country);

  return parts.join(', ');
}

/**
 * Format with line breaks instead of commas. Useful for stacked display
 * (e.g. on a label or printed view):
 *   123 Main St
 *   Suite 200
 *   Plano, TX 75024
 */
export function formatAddressMultiline(value: AddressValue | null | undefined): string {
  if (!value) return '';

  const lines: string[] = [];
  if (value.addressLine1.trim()) lines.push(value.addressLine1.trim());
  if ((value.addressLine2 ?? '').trim()) lines.push((value.addressLine2 ?? '').trim());

  const cityStateZip = [
    value.city.trim(),
    [value.state.trim(), value.zip.trim()].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) lines.push(cityStateZip);

  const country = (value.country ?? 'US').toUpperCase();
  if (country && country !== 'US') lines.push(country);

  return lines.join('\n');
}

// -- Google Places parsing ---------------------------------------------------

/**
 * Minimal shape of a Google Places `PlaceResult.address_components` entry.
 * We declare it locally so this module compiles with or without
 * `@types/google.maps` being installed at consume time.
 */
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceResultMinimal {
  place_id?: string;
  address_components?: AddressComponent[];
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
}

function findComponent(
  components: AddressComponent[],
  type: string,
  prefer: 'short' | 'long' = 'long',
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return '';
  return prefer === 'short' ? match.short_name : match.long_name;
}

/**
 * Parse a Google Places PlaceResult into an AddressValue. Only the fields we
 * recognize are populated; missing pieces become empty strings so the caller
 * can detect partial results and prompt the user to fill in the gaps.
 *
 * Returns null if the place has no address_components (rare — e.g. plus codes).
 */
export function parseGooglePlace(place: unknown): AddressValue | null {
  if (!place || typeof place !== 'object') return null;
  const p = place as PlaceResultMinimal;
  const comps = p.address_components ?? [];
  if (comps.length === 0) return null;

  const streetNumber = findComponent(comps, 'street_number');
  const route = findComponent(comps, 'route');
  const subpremise = findComponent(comps, 'subpremise');

  // City: prefer locality, fall back to sublocality / postal_town / neighborhood
  const city =
    findComponent(comps, 'locality') ||
    findComponent(comps, 'postal_town') ||
    findComponent(comps, 'sublocality_level_1') ||
    findComponent(comps, 'sublocality') ||
    findComponent(comps, 'neighborhood');

  const state = findComponent(comps, 'administrative_area_level_1', 'short');

  const postalBase = findComponent(comps, 'postal_code');
  const postalSuffix = findComponent(comps, 'postal_code_suffix');
  const zip = postalBase && postalSuffix ? `${postalBase}-${postalSuffix}` : postalBase;

  const country = findComponent(comps, 'country', 'short') || 'US';

  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim();

  // Geocoding (optional)
  let lat: number | undefined;
  let lng: number | undefined;
  if (p.geometry?.location) {
    try {
      lat = p.geometry.location.lat();
      lng = p.geometry.location.lng();
    } catch {
      // Some PlaceResults expose location as a plain object — handle that too.
      const loc = p.geometry.location as unknown as { lat?: unknown; lng?: unknown };
      if (typeof loc.lat === 'number') lat = loc.lat;
      if (typeof loc.lng === 'number') lng = loc.lng;
    }
  }

  return {
    addressLine1,
    addressLine2: subpremise ? `Suite ${subpremise}` : '',
    city,
    state,
    zip,
    country,
    placeId: p.place_id,
    lat,
    lng,
  };
}
