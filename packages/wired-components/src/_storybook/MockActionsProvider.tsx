/**
 * MockActionsProvider — story-scoped harness for `@tensaw/wired-components`.
 *
 * Each story file imports `withMockActions(...)` and uses it as a decorator.
 * On mount, the wrapper:
 *   - clears the actions registry + cache
 *   - signs in a synthetic user (with the requested permissions, default: all
 *     permissions referenced by passed-in actions)
 *   - calls `defineAction(...)` for every action the story declares
 *   - stubs `globalThis.fetch` to return the response associated with the
 *     called action ID. If a story doesn't explicitly map a response, the
 *     stub returns a generic success envelope.
 *
 * Cleanup runs on unmount so subsequent stories start from a clean slate.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  _clearActionCache,
  _clearActionRegistry,
  defineAction,
  type ActionDeclaration,
} from '@tensaw/actions';
import {
  resetAllStoresForTesting,
  useAuthStore,
} from '@tensaw/runtime';

export type MockActionResponseMap = Record<string, unknown>;

export interface MockActionsConfig {
  /** Action declarations to register. */
  actions: ActionDeclaration[];
  /** Map actionId → response data (returned inside a success envelope). */
  responses?: MockActionResponseMap;
  /** Permissions for the synthetic signed-in user. Default: '*' (all granted). */
  permissions?: string[];
}

function envelope(data: unknown): unknown {
  return {
    success: true,
    data,
    meta: {
      correlationId: `cor-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    },
  };
}

function MockActionsBoundary({
  config,
  children,
}: {
  config: MockActionsConfig;
  children: ReactNode;
}): JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reset state cleanly between story instances.
    resetAllStoresForTesting();
    _clearActionRegistry();
    _clearActionCache();

    // Stub fetch so the dispatcher's network calls resolve deterministically.
    const responses: MockActionResponseMap = config.responses ?? {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      // Best-effort: find an action whose endpoint path matches the URL.
      const match = config.actions.find((decl) => {
        const path = decl.endpoint?.split(' ')[1] ?? '';
        const stripped = path.replace(/\{[^}]+\}/g, '[^/?]+');
        return new RegExp(stripped).test(url);
      });
      const data = match ? responses[match.actionId] ?? { ok: true } : { ok: true };
      return new Response(JSON.stringify(envelope(data)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Sign in the synthetic user.
    useAuthStore.getState().signIn({
      user: {
        userId: 'storybook',
        username: 'storybook',
        email: 'storybook@tensaw.example',
        fullName: 'Storybook User',
        roles: ['admin'],
        permissions: config.permissions ?? ['*'],
        clinicIds: ['c1'],
      },
      clinicId: 'c1',
    });

    // Register the actions the story requires.
    for (const decl of config.actions) {
      defineAction(decl);
    }

    setReady(true);

    return () => {
      _clearActionRegistry();
      _clearActionCache();
      resetAllStoresForTesting();
      globalThis.fetch = originalFetch;
    };
  }, [config]);

  if (!ready) return <></>;
  return <>{children}</>;
}

/**
 * Decorator factory. Use as:
 *
 *   const meta = {
 *     decorators: [withMockActions({ actions: [...], responses: {...} })],
 *     ...
 *   };
 */
export function withMockActions(config: MockActionsConfig) {
  return function decorator(Story: () => JSX.Element): JSX.Element {
    return (
      <MockActionsBoundary config={config}>
        <Story />
      </MockActionsBoundary>
    );
  };
}
