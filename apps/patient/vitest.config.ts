import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    // The integration test imports the full app graph (runtime → composition
    // → worklist → AR page). First-import compile is slow under jsdom.
    testTimeout: 15000,
  },
});
