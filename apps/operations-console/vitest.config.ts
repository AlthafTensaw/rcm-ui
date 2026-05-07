import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    // The integration test imports the full app graph (runtime → composition
    // → wired-components → all 5 pages). First-import compile is slow under
    // jsdom — mirror the patient app's 15s timeout.
    testTimeout: 15000,
  },
});
