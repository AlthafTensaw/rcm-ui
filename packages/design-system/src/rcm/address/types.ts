/**
 * Address types and validation.
 *
 * Used everywhere there's an address field in Tensaw apps. The data model is
 * structured (5 fields + optional country/geo) but the UX collapses to a
 * single line in view mode and a single autocomplete input in edit mode.
 *
 * US-only deployment — country defaults to 'US' and is stored but only
 * displayed if non-US.
 */

import { z } from 'zod';
import { states } from '@tensaw/codes/states';

export interface AddressValue {
  /** Street number + route. e.g. "123 Main St". */
  addressLine1: string;
  /** Suite, apt, unit. e.g. "Suite 200". Empty/null if not applicable. */
  addressLine2?: string | null;
  city: string;
  /** Two-letter state code (or DC / territory). */
  state: string;
  /** 5-digit or 5+4. */
  zip: string;
  /** ISO 3166-1 alpha-2. Default 'US'. Stored but not displayed for US addresses. */
  country?: string;
  /** Google Places place_id, if the value came from autocomplete. */
  placeId?: string;
  /** Optional geocoding from Google Places. */
  lat?: number;
  lng?: number;
}

/**
 * Strict schema. addressLine1, city, state, zip required; addressLine2 optional.
 */
export const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Street address is required').max(100),
  addressLine2: z.string().max(50).nullable().optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z
    .string()
    .min(2, 'State is required')
    .max(2)
    .refine((v) => states.isValid(v), 'State must be a US state, DC, or territory'),
  zip: z
    .string()
    .min(5, 'ZIP is required')
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP must be 5 digits or 5+4'),
  country: z.string().length(2).optional().default('US'),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const addressSchemaOptional = addressSchema.optional().nullable();

/** True if every required field is present and non-empty. */
export function isCompleteAddress(value: AddressValue | null | undefined): value is AddressValue {
  if (!value) return false;
  return (
    value.addressLine1.trim().length > 0 &&
    value.city.trim().length > 0 &&
    value.state.length === 2 &&
    /^\d{5}(-\d{4})?$/.test(value.zip)
  );
}

/** Empty value used as the controlled-component "no value yet" state. */
export const EMPTY_ADDRESS: AddressValue = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
};
