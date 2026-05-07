import { vi } from 'vitest';

// Stub all env keys the runtime config requires. This runs before any test
// module is imported, so the eager `loadConfig(import.meta.env)` at the
// bottom of config/index.ts succeeds.
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.tensaw.local');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_test');
vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_APP_ID', 'test');
vi.stubEnv('VITE_BUILD_VERSION', '0.0.0-test');
vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy');
