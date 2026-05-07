/**
 * Operations Console — app bootstrap.
 *
 * Mirrors `apps/patient/src/bootstrap.ts`. Runs once at app start to:
 *   1. Register the operations-console action set with the dispatcher
 *   2. Start the MSW worker in development so action endpoints resolve
 *
 * `setRouterAdapter` is wired inside `<AppLayout>` (we need React
 * Router's `useNavigate` to drive it), matching the patient app.
 *
 * `bootstrap()` is idempotent — multiple calls share a cached promise.
 */

import { registerOperationsConsoleActions } from './actions';

let bootstrapPromise: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = doBootstrap();
  return bootstrapPromise;
}

async function doBootstrap(): Promise<void> {
  // Register actions first so anything that depends on a registered
  // action ID (e.g. MSW handler request schemas) is consistent.
  registerOperationsConsoleActions();

  // Start MSW only in development. In test, msw/node is wired by
  // vitest.setup.ts. In production, the real backend handles requests.
  if (import.meta.env.DEV) {
    try {
      const { setupWorker } = await import('msw/browser');
      const { buildAdminHandlers } = await import('./mocks/handlers');
      const { config } = await import('@tensaw/runtime');
      const worker = setupWorker(...buildAdminHandlers(config.api.baseUrl));
      await worker.start({
        quiet: true,
        onUnhandledRequest: 'bypass',
      });
    } catch (e) {
      console.warn('[bootstrap] MSW failed to start:', e);
    }
  }
}
