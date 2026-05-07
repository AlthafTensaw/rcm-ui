import { describe, expect, it } from 'vitest';
import { formatAddress, formatAddressMultiline, parseGooglePlace } from './format';
import { EMPTY_ADDRESS, isCompleteAddress, type AddressValue } from './types';

describe('formatAddress', () => {
  it('formats a complete US address per spec (no country)', () => {
    const v: AddressValue = {
      addressLine1: '123 Main St',
      addressLine2: 'Suite 200',
      city: 'Plano',
      state: 'TX',
      zip: '75024',
      country: 'US',
    };
    expect(formatAddress(v)).toBe('123 Main St, Suite 200, Plano, TX 75024');
  });

  it('omits empty address line 2', () => {
    expect(
      formatAddress({
        addressLine1: '123 Main St',
        addressLine2: '',
        city: 'Plano',
        state: 'TX',
        zip: '75024',
      }),
    ).toBe('123 Main St, Plano, TX 75024');
  });

  it('omits null address line 2', () => {
    expect(
      formatAddress({
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Plano',
        state: 'TX',
        zip: '75024',
      }),
    ).toBe('123 Main St, Plano, TX 75024');
  });

  it('shows country only for non-US addresses', () => {
    const us = formatAddress({
      addressLine1: '1 Park Ave',
      city: 'NYC',
      state: 'NY',
      zip: '10001',
      country: 'US',
    });
    expect(us).toBe('1 Park Ave, NYC, NY 10001');

    const ca = formatAddress({
      addressLine1: '1 Yonge St',
      city: 'Toronto',
      state: 'ON',
      zip: 'M5E 1E5',
      country: 'CA',
    });
    expect(ca).toContain('CA');
  });

  it('handles 5+4 ZIP', () => {
    expect(
      formatAddress({
        addressLine1: '123 Main St',
        city: 'Plano',
        state: 'TX',
        zip: '75024-1234',
      }),
    ).toBe('123 Main St, Plano, TX 75024-1234');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatAddress(null)).toBe('');
    expect(formatAddress(undefined)).toBe('');
  });

  it('handles partial addresses gracefully', () => {
    expect(formatAddress({ addressLine1: '123 Main St', city: '', state: '', zip: '' })).toBe(
      '123 Main St',
    );
    expect(formatAddress(EMPTY_ADDRESS)).toBe('');
  });

  it('trims whitespace', () => {
    expect(
      formatAddress({
        addressLine1: '  123 Main St  ',
        city: '  Plano  ',
        state: 'TX',
        zip: '75024',
      }),
    ).toBe('123 Main St, Plano, TX 75024');
  });
});

describe('formatAddressMultiline', () => {
  it('produces line-broken output', () => {
    const v: AddressValue = {
      addressLine1: '123 Main St',
      addressLine2: 'Suite 200',
      city: 'Plano',
      state: 'TX',
      zip: '75024',
    };
    expect(formatAddressMultiline(v)).toBe('123 Main St\nSuite 200\nPlano, TX 75024');
  });
});

describe('isCompleteAddress', () => {
  it('returns true for a fully populated address', () => {
    expect(
      isCompleteAddress({
        addressLine1: '123 Main St',
        city: 'Plano',
        state: 'TX',
        zip: '75024',
      }),
    ).toBe(true);
  });

  it('returns false for missing required fields', () => {
    expect(isCompleteAddress(null)).toBe(false);
    expect(isCompleteAddress(undefined)).toBe(false);
    expect(isCompleteAddress(EMPTY_ADDRESS)).toBe(false);
    expect(
      isCompleteAddress({
        addressLine1: '',
        city: 'Plano',
        state: 'TX',
        zip: '75024',
      }),
    ).toBe(false);
    expect(
      isCompleteAddress({
        addressLine1: '123 Main St',
        city: 'Plano',
        state: 'TX',
        zip: '7502', // 4 digits
      }),
    ).toBe(false);
  });

  it('accepts ZIP+4', () => {
    expect(
      isCompleteAddress({
        addressLine1: '123 Main St',
        city: 'Plano',
        state: 'TX',
        zip: '75024-1234',
      }),
    ).toBe(true);
  });
});

describe('parseGooglePlace', () => {
  function makePlace(overrides: Partial<{
    place_id: string;
    components: { long_name: string; short_name: string; types: string[] }[];
    lat: number;
    lng: number;
  }>) {
    return {
      place_id: overrides.place_id ?? 'ChIJ_test',
      address_components: overrides.components ?? [],
      geometry:
        overrides.lat !== undefined && overrides.lng !== undefined
          ? {
              location: {
                lat: () => overrides.lat!,
                lng: () => overrides.lng!,
              },
            }
          : undefined,
    };
  }

  it('parses a typical US address', () => {
    const result = parseGooglePlace(
      makePlace({
        components: [
          { long_name: '7713', short_name: '7713', types: ['street_number'] },
          { long_name: 'San Jacinto Place', short_name: 'San Jacinto Pl', types: ['route'] },
          { long_name: 'Plano', short_name: 'Plano', types: ['locality', 'political'] },
          { long_name: 'Collin County', short_name: 'Collin County', types: ['administrative_area_level_2'] },
          { long_name: 'Texas', short_name: 'TX', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
          { long_name: '75024', short_name: '75024', types: ['postal_code'] },
        ],
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.addressLine1).toBe('7713 San Jacinto Place');
    expect(result!.state).toBe('TX');
    expect(result!.city).toBe('Plano');
    expect(result!.zip).toBe('75024');
    expect(result!.country).toBe('US');
    expect(result!.placeId).toBe('ChIJ_test');
  });

  it('parses an address with a subpremise (suite/apt) into addressLine2', () => {
    const result = parseGooglePlace(
      makePlace({
        components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Main Street', short_name: 'Main St', types: ['route'] },
          { long_name: '200', short_name: '200', types: ['subpremise'] },
          { long_name: 'Plano', short_name: 'Plano', types: ['locality'] },
          { long_name: 'Texas', short_name: 'TX', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
          { long_name: '75024', short_name: '75024', types: ['postal_code'] },
        ],
      }),
    );
    expect(result!.addressLine1).toBe('123 Main Street');
    expect(result!.addressLine2).toBe('Suite 200');
  });

  it('appends postal_code_suffix to zip', () => {
    const result = parseGooglePlace(
      makePlace({
        components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Main St', short_name: 'Main St', types: ['route'] },
          { long_name: 'Plano', short_name: 'Plano', types: ['locality'] },
          { long_name: 'Texas', short_name: 'TX', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
          { long_name: '75024', short_name: '75024', types: ['postal_code'] },
          { long_name: '1234', short_name: '1234', types: ['postal_code_suffix'] },
        ],
      }),
    );
    expect(result!.zip).toBe('75024-1234');
  });

  it('falls back from locality to sublocality and postal_town', () => {
    const result = parseGooglePlace(
      makePlace({
        components: [
          { long_name: '5', short_name: '5', types: ['street_number'] },
          { long_name: 'Park Lane', short_name: 'Park Lane', types: ['route'] },
          { long_name: 'Brooklyn', short_name: 'Brooklyn', types: ['sublocality_level_1'] },
          { long_name: 'New York', short_name: 'NY', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
          { long_name: '11215', short_name: '11215', types: ['postal_code'] },
        ],
      }),
    );
    expect(result!.city).toBe('Brooklyn');
  });

  it('captures geocoding when present', () => {
    const result = parseGooglePlace(
      makePlace({
        lat: 33.0198,
        lng: -96.6989,
        components: [
          { long_name: '1', short_name: '1', types: ['street_number'] },
          { long_name: 'Main', short_name: 'Main', types: ['route'] },
          { long_name: 'Plano', short_name: 'Plano', types: ['locality'] },
          { long_name: 'TX', short_name: 'TX', types: ['administrative_area_level_1'] },
          { long_name: 'US', short_name: 'US', types: ['country'] },
          { long_name: '75024', short_name: '75024', types: ['postal_code'] },
        ],
      }),
    );
    expect(result!.lat).toBeCloseTo(33.0198, 4);
    expect(result!.lng).toBeCloseTo(-96.6989, 4);
  });

  it('returns null for a place with no address_components', () => {
    expect(parseGooglePlace({ place_id: 'x' })).toBeNull();
    expect(parseGooglePlace(null)).toBeNull();
    expect(parseGooglePlace('not an object')).toBeNull();
  });
});
