import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Operations console test setup.
 *
 * The runtime config in `@tensaw/runtime` reads env vars at module-load
 * time. The patient app stubs all ~7 of them (API base URL, Cognito,
 * Stripe). Operations console uses mocked sign-in and has no Stripe; we
 * only need the API base URL and a couple of identity stubs to satisfy
 * `loadConfig()`.
 *
 * MSW handlers are wired via setupServer below. The handler builder
 * lives in `src/mocks/handlers.ts` (operations-console-local — we do
 * NOT depend on `@tensaw/mock-server` which is patient-app-specific).
 */

// Stub minimal env BEFORE module loads. We use process.env-style stubs
// because the runtime config reads from import.meta.env which Vite
// translates from these.
import { vi } from 'vitest';
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.tensaw.local');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_test');
vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_APP_ID', 'operations-console-test');
vi.stubEnv('VITE_BUILD_VERSION', '0.0.0-test');
vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy');

// jsdom doesn't implement ResizeObserver or Element.scrollIntoView —
// cmdk (Combobox's underlying primitive) and Radix popovers both rely
// on them. Slice 1's tests didn't exercise these primitives; slice 2's
// Combobox-driven ReassignOwnerModal does. Define minimal no-op stubs.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
// Radix Popover internals occasionally call hasPointerCapture which jsdom
// doesn't ship; cmdk's Command list also calls it on focus management.
if (
  typeof Element !== 'undefined' &&
  typeof Element.prototype.hasPointerCapture !== 'function'
) {
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
  Element.prototype.releasePointerCapture =
    function releasePointerCapture() {};
}

const { setupServer } = await import('msw/node');
const { buildAdminHandlers, resetMockAdminState } = await import(
  './src/mocks/handlers'
);

const server = setupServer(...buildAdminHandlers('https://api.test.tensaw.local'));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockAdminState();
});

afterAll(() => {
  server.close();
});
