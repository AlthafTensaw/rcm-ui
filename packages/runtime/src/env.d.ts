/**
 * Ambient declaration for `import.meta.env`.
 *
 * Runtime is consumed inside Vite-bundled apps where `import.meta.env` is
 * provided by the bundler at build time, but we don't want a direct
 * `vite/client` dependency in this package (it's bundler-agnostic in spirit).
 *
 * We declare the shape locally instead. Apps using a different bundler can
 * provide their own `env` object as long as it satisfies this contract.
 */

interface ImportMetaEnv {
  readonly MODE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly SSR?: boolean;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AWS_REGION?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID?: string;
  readonly VITE_PRODUCT_NAME?: string;
  readonly VITE_BUILD_ID?: string;
  readonly VITE_MOCK_MODE?: string;
  readonly VITE_COGNITO_REGION?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_BUILD_VERSION?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
