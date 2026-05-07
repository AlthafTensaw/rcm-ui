import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Stub the env vars `@tensaw/runtime/config` requires before any test module
// imports the runtime — the runtime's `loadConfig(import.meta.env)` runs
// eagerly at module-load time. This setup file runs before all test files.
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test.tensaw.local');
vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'us-east-1_test');
vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_APP_ID', 'test');
vi.stubEnv('VITE_BUILD_VERSION', '0.0.0-test');
vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy');

afterEach(() => {
  cleanup();
});

// jsdom omits several browser APIs that Radix UI primitives (Popover,
// Combobox, Select content) rely on. Polyfill them once per test run.
class ResizeObserverPolyfill {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
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
  // Radix Select scrolls the active item into view; jsdom doesn't ship this.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  // Radix uses Element.hasPointerCapture for pointer-event tracking.
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn() as never;
  }
}
