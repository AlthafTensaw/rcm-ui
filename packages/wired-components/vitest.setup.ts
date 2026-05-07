/**
 * Vitest setup for @tensaw/wired-components.
 *
 *   1. Env stubs for `@tensaw/runtime`'s eager `loadConfig`
 *   2. Browser-API polyfills jsdom omits (Radix UI primitives need them)
 *   3. RTL `cleanup()` after each test
 */
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// --- 1. Env stubs --------------------------------------------------------
const TEST_ENV: Record<string, string> = {
  VITE_API_BASE_URL: 'https://api.test.tensaw.local',
  VITE_COGNITO_REGION: 'us-east-1',
  VITE_COGNITO_USER_POOL_ID: 'us-east-1_test',
  VITE_COGNITO_CLIENT_ID: 'test-client-id',
  VITE_APP_ID: 'wired-components-test',
  VITE_BUILD_VERSION: '0.0.0-test',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy',
};
for (const [key, value] of Object.entries(TEST_ENV)) {
  if (process.env[key] === undefined || process.env[key] === '') {
    process.env[key] = value;
  }
  vi.stubEnv(key, value);
}

// --- 2. jsdom polyfills --------------------------------------------------
class ResizeObserverPolyfill {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn() as never;
  }
}

// --- 3. RTL cleanup ------------------------------------------------------
afterEach(() => {
  cleanup();
});
