/**
 * Platform configuration module.
 *
 * Implements Phase 1.1 of the v3 plan: reads from Vite env (`import.meta.env`),
 * validates required keys with Zod at startup, and fails fast with a clear error
 * if anything is missing or malformed.
 *
 * Usage:
 *   import { config } from '@tensaw/runtime/config';
 *   fetch(`${config.api.baseUrl}/patients`);
 *
 * Required env keys are documented in /.env.example at the repo root.
 *
 * IMPORTANT: do not read `import.meta.env` directly anywhere else in the codebase.
 * Always go through this module so the validation gate is the single source of truth.
 */

import { z } from 'zod';

const httpsUrl = z
  .string()
  .min(1, 'is required')
  .url('must be a valid URL')
  .refine(
    (v) => v.startsWith('https://') || v.startsWith('http://localhost'),
    'must be https:// (or http://localhost for local dev)',
  );

/**
 * Schema for the raw env values Vite exposes on `import.meta.env`.
 * All keys must be prefixed with `VITE_` to be forwarded to the client bundle.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: httpsUrl,
  VITE_COGNITO_REGION: z.string().min(1),
  VITE_COGNITO_USER_POOL_ID: z.string().min(1),
  VITE_COGNITO_CLIENT_ID: z.string().min(1),
  VITE_APP_ID: z.string().min(1),
  VITE_BUILD_VERSION: z.string().min(1),
  VITE_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .refine(
      (v) => v.startsWith('pk_test_') || v.startsWith('pk_live_'),
      'Stripe publishable key must start with pk_test_ or pk_live_',
    ),

  // Optional
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_FEATURE_FLAGS_URL: httpsUrl.optional().or(z.literal('')),
  VITE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(900),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional().or(z.literal('')),
});

export type RawEnv = z.infer<typeof envSchema>;

/**
 * The validated, typed config object the rest of the platform consumes.
 * Shape is intentionally grouped by concern, not flat env keys.
 */
export interface PlatformConfig {
  app: {
    id: string;
    buildVersion: string;
  };
  api: {
    baseUrl: string;
  };
  auth: {
    cognito: {
      region: string;
      userPoolId: string;
      clientId: string;
    };
  };
  payments: {
    stripePublishableKey: string;
  };
  observability: {
    sentryDsn: string | null;
  };
  features: {
    flagsUrl: string | null;
  };
  maps: {
    /** Google Maps JavaScript API key. Null = AddressField falls back to manual entry. */
    googleApiKey: string | null;
  };
  security: {
    /** Inactivity timeout in seconds before auto-logout. HIPAA. */
    idleTimeoutSeconds: number;
  };
  /** True if the Stripe key is a live key. Production guard. */
  isLiveStripe: boolean;
}

/**
 * Read and validate config. Throws on first failure with a list of every
 * problem found across the env, so the operator gets one report and not a
 * trickle.
 */
export function loadConfig(env: Record<string, unknown>): PlatformConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid platform configuration. Fix the following env vars and try again:\n${issues}\n\n` +
        `See .env.example at the repo root for the full list of required keys.`,
    );
  }

  const e = result.data;
  const sentryDsn = e.VITE_SENTRY_DSN && e.VITE_SENTRY_DSN.length > 0 ? e.VITE_SENTRY_DSN : null;
  const flagsUrl =
    e.VITE_FEATURE_FLAGS_URL && e.VITE_FEATURE_FLAGS_URL.length > 0
      ? e.VITE_FEATURE_FLAGS_URL
      : null;

  return {
    app: {
      id: e.VITE_APP_ID,
      buildVersion: e.VITE_BUILD_VERSION,
    },
    api: {
      baseUrl: e.VITE_API_BASE_URL.replace(/\/$/, ''),
    },
    auth: {
      cognito: {
        region: e.VITE_COGNITO_REGION,
        userPoolId: e.VITE_COGNITO_USER_POOL_ID,
        clientId: e.VITE_COGNITO_CLIENT_ID,
      },
    },
    payments: {
      stripePublishableKey: e.VITE_STRIPE_PUBLISHABLE_KEY,
    },
    observability: {
      sentryDsn,
    },
    features: {
      flagsUrl,
    },
    maps: {
      googleApiKey:
        e.VITE_GOOGLE_MAPS_API_KEY && e.VITE_GOOGLE_MAPS_API_KEY.length > 0
          ? e.VITE_GOOGLE_MAPS_API_KEY
          : null,
    },
    security: {
      idleTimeoutSeconds: e.VITE_IDLE_TIMEOUT_SECONDS,
    },
    isLiveStripe: e.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_'),
  };
}

/**
 * Singleton config, loaded eagerly from `import.meta.env` at module init.
 *
 * If you need to test loadConfig with custom env, call `loadConfig(yourEnv)`
 * directly — do not import `config`.
 */
export const config: PlatformConfig = loadConfig(
  // Vite injects `import.meta.env`. In test contexts this falls back to process.env.
  typeof import.meta !== 'undefined' && 'env' in import.meta
    ? (import.meta.env)
    : (process.env),
);
