/**
 * @tensaw/runtime
 *
 * Platform runtime: Zustand stores, TanStack Query client, event bus,
 * authenticated fetch, HIPAA primitives, and bootstrap.
 *
 * Migrated from Redux Toolkit + RTK Query per ADR-001-redux-to-zustand.md.
 */

export const PACKAGE_VERSION = '0.1.0';

// ---- Config ----------------------------------------------------------------
export { config, loadConfig, type PlatformConfig } from './config';

// ---- Auth ------------------------------------------------------------------
export {
  type TokenProvider,
  getTokenProvider,
  setTokenProvider,
} from './auth';

// ---- API + TanStack Query --------------------------------------------------
export * from './api';

// ---- Shared state types ----------------------------------------------------
export type * from './types';

// ---- Stores (Zustand) ------------------------------------------------------
export * from './stores';

// ---- Events (no longer Redux-coupled) --------------------------------------
export * from './events';

// ---- Effects (subscription-based; replace Redux middleware) ----------------
export * from './effects';

// ---- HIPAA / Privacy primitives --------------------------------------------
export { scrubString, scrubObject, auditPHI } from './privacy';

// ---- Bootstrap -------------------------------------------------------------
export {
  bootstrapApp,
  type BootstrapAppDeps,
  type BootstrapDisposers,
  type PreferenceLoader,
  type AuthUserLoader,
} from './bootstrap';
