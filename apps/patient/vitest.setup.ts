import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Stub env vars BEFORE any module loads. The runtime config is imported
// transitively when we import the AR Mgmt page, and it eagerly reads env.
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.tensaw.local');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_test');
vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_APP_ID', 'patient-test');
vi.stubEnv('VITE_BUILD_VERSION', '0.0.0-test');
vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy');

// Wire MSW server (node) for AR endpoints. Using dynamic import so the
// env stubs above are in place by the time mock-server's modules load.
const { setupServer } = await import('msw/node');
const { buildARHandlers, resetMockARState } = await import('@tensaw/mock-server');

// Use the same baseUrl the runtime config will resolve to.
const server = setupServer(...buildARHandlers('https://api.test.tensaw.local'));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockARState();
});

afterAll(() => {
  server.close();
});
