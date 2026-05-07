/**
 * App bootstrap — runs once at app start.
 *
 * Responsibilities:
 *   - Register the AR action set with the dispatcher
 *   - Start the MSW worker in development so the action endpoints resolve
 *
 * The `setRouterAdapter` step is no longer here; it's wired inside
 * `<AppLayout>` because we need React Router's `useNavigate` to drive it.
 *
 * `bootstrap()` is idempotent — multiple calls are no-ops after the first.
 * Resolved promise is cached so concurrent callers share the result.
 */

import { registerARActions } from './pages/ar-mgmt/actions';

let bootstrapPromise: Promise<void> | null = null;

export function bootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = doBootstrap();
  return bootstrapPromise;
}

async function doBootstrap(): Promise<void> {
  // Register action set first so anything that depends on a registered
  // action ID (e.g. MSW handler request schemas) is consistent.
  registerARActions();

  // Start MSW only in development. In test, `msw/node` is wired by the
  // vitest setup file. In production, real APIs back the actions.
  if (import.meta.env.DEV) {
    try {
      const { setupWorker } = await import('msw/browser');
      const { buildARHandlers } = await import('@tensaw/mock-server');
      const { config } = await import('@tensaw/runtime');
      const worker = setupWorker(...buildARHandlers(config.api.baseUrl));
      await worker.start({
        quiet: true,
        onUnhandledRequest: 'bypass',
      });
    } catch (e) {
       
      console.warn('[bootstrap] MSW failed to start:', e);
    }
  }
}
