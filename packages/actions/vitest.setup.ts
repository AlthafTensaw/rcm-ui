/**
 * Vitest setup for @tensaw/actions.
 *
 * @tensaw/runtime/config validates required env vars at module load time.
 * Tests don't need real values; they just need the schema to pass.
 *
 * This setup file runs before any test file is imported, so the env vars are
 * in place by the time `import('@tensaw/runtime')` resolves.
 */

const TEST_ENV: Record<string, string> = {
  VITE_API_BASE_URL: 'https://api.test.tensaw.health',
  VITE_COGNITO_REGION: 'us-east-1',
  VITE_COGNITO_USER_POOL_ID: 'us-east-1_test',
  VITE_COGNITO_CLIENT_ID: 'test-client-id',
  VITE_APP_ID: 'actions-test',
  VITE_BUILD_VERSION: '0.0.0',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_actions',
};

for (const [key, value] of Object.entries(TEST_ENV)) {
  if (process.env[key] === undefined || process.env[key] === '') {
    process.env[key] = value;
  }
}
