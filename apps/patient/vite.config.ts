import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Fail fast if required env keys are missing in non-test builds.
  // Phase 1.1 requires startup validation; this is the build-time half.
  if (mode !== 'test') {
    const required = [
      'VITE_API_BASE_URL',
      'VITE_COGNITO_REGION',
      'VITE_COGNITO_USER_POOL_ID',
      'VITE_COGNITO_CLIENT_ID',
      'VITE_APP_ID',
      'VITE_BUILD_VERSION',
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];
    const missing = required.filter((k) => !env[k]);
    if (missing.length > 0 && mode === 'production') {
      throw new Error(
        `Missing required env vars for production build: ${missing.join(', ')}. ` +
          `Copy .env.example to .env.local and fill in values.`,
      );
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
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
  };
});
