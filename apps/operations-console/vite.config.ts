import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Operations Console Vite config.
 *
 * Mocked sign-in is the v1 default (per design system buildout deferred
 * item #1 + Phase A kickoff). Real Cognito integration is a Phase B/v0.2
 * concern; this config intentionally does not require Cognito env vars
 * the way the patient app does. When real Cognito lands, mirror the
 * patient app's `loadEnv` + required-keys check.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: ['../..'],
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
  },
});
