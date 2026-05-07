import { describe, expect, it } from 'vitest';
import { loadConfig } from './index';

const validEnv = {
  VITE_API_BASE_URL: 'https://api.dev.tensaw.health',
  VITE_COGNITO_REGION: 'us-east-1',
  VITE_COGNITO_USER_POOL_ID: 'us-east-1_abc123',
  VITE_COGNITO_CLIENT_ID: 'clientid123',
  VITE_APP_ID: 'patient',
  VITE_BUILD_VERSION: '1.0.0',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc123',
};

describe('loadConfig', () => {
  it('returns a typed config object when all required env keys are present', () => {
    const config = loadConfig(validEnv);
    expect(config.api.baseUrl).toBe('https://api.dev.tensaw.health');
    expect(config.app.id).toBe('patient');
    expect(config.app.buildVersion).toBe('1.0.0');
    expect(config.auth.cognito.region).toBe('us-east-1');
    expect(config.payments.stripePublishableKey).toBe('pk_test_abc123');
    expect(config.isLiveStripe).toBe(false);
    expect(config.security.idleTimeoutSeconds).toBe(900);
  });

  it('strips trailing slash from API base URL', () => {
    const config = loadConfig({ ...validEnv, VITE_API_BASE_URL: 'https://api.tensaw.health/' });
    expect(config.api.baseUrl).toBe('https://api.tensaw.health');
  });

  it('flags live Stripe keys', () => {
    const config = loadConfig({
      ...validEnv,
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc123',
    });
    expect(config.isLiveStripe).toBe(true);
  });

  it('coerces idle timeout from string env to number', () => {
    const config = loadConfig({ ...validEnv, VITE_IDLE_TIMEOUT_SECONDS: '600' });
    expect(config.security.idleTimeoutSeconds).toBe(600);
  });

  it('treats empty optional URLs as null', () => {
    const config = loadConfig({
      ...validEnv,
      VITE_SENTRY_DSN: '',
      VITE_FEATURE_FLAGS_URL: '',
    });
    expect(config.observability.sentryDsn).toBeNull();
    expect(config.features.flagsUrl).toBeNull();
  });

  it('exposes Google Maps key as null when missing', () => {
    const config = loadConfig(validEnv);
    expect(config.maps.googleApiKey).toBeNull();
  });

  it('exposes Google Maps key when present', () => {
    const config = loadConfig({
      ...validEnv,
      VITE_GOOGLE_MAPS_API_KEY: 'AIza_test_key',
    });
    expect(config.maps.googleApiKey).toBe('AIza_test_key');
  });

  it('throws with a clear message when a required key is missing', () => {
    const { VITE_API_BASE_URL: _omit, ...rest } = validEnv;
    expect(() => loadConfig(rest)).toThrow(/VITE_API_BASE_URL/);
  });

  it('throws when API base URL is not https in non-localhost', () => {
    expect(() =>
      loadConfig({ ...validEnv, VITE_API_BASE_URL: 'http://api.tensaw.health' }),
    ).toThrow(/https/);
  });

  it('allows http for localhost', () => {
    const config = loadConfig({
      ...validEnv,
      VITE_API_BASE_URL: 'http://localhost:8000',
    });
    expect(config.api.baseUrl).toBe('http://localhost:8000');
  });

  it('throws when Stripe key has wrong prefix', () => {
    expect(() =>
      loadConfig({ ...validEnv, VITE_STRIPE_PUBLISHABLE_KEY: 'sk_live_secret' }),
    ).toThrow(/Stripe/);
  });

  it('aggregates multiple errors in a single thrown message', () => {
    expect(() =>
      loadConfig({
        ...validEnv,
        VITE_API_BASE_URL: 'not-a-url',
        VITE_STRIPE_PUBLISHABLE_KEY: 'wrong_prefix',
      }),
    ).toThrow(/VITE_API_BASE_URL[\s\S]*VITE_STRIPE_PUBLISHABLE_KEY/);
  });
});
