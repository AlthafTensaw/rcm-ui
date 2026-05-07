/**
 * Authentication token provider.
 *
 * Thin adapter over AWS Amplify Auth v6. The rest of the platform talks to the
 * `tokenProvider` interface, never to Amplify directly. If we ever need to
 * swap auth libraries, only this file changes.
 *
 * Implements Phase 1.2 of the v3 plan (token + refresh side).
 */

import { fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';

export interface TokenProvider {
  /**
   * Returns the current ID token if the session is valid. Returns `null` if
   * there is no signed-in user. Forces a refresh if `forceRefresh` is true.
   */
  getIdToken(opts?: { forceRefresh?: boolean }): Promise<string | null>;

  /**
   * Returns the current access token (used as Authorization bearer). Same
   * semantics as getIdToken.
   *
   * For a Cognito + API Gateway setup the access token is what the API
   * Gateway JWT authorizer validates, so this is the one we put in the
   * Authorization header.
   */
  getAccessToken(opts?: { forceRefresh?: boolean }): Promise<string | null>;

  /** Signs the user out and revokes the refresh token. */
  signOut(): Promise<void>;
}

class AmplifyTokenProvider implements TokenProvider {
  async getIdToken(opts?: { forceRefresh?: boolean }): Promise<string | null> {
    try {
      const session = await fetchAuthSession({ forceRefresh: opts?.forceRefresh ?? false });
      const token = session.tokens?.idToken?.toString();
      return token ?? null;
    } catch {
      return null;
    }
  }

  async getAccessToken(opts?: { forceRefresh?: boolean }): Promise<string | null> {
    try {
      const session = await fetchAuthSession({ forceRefresh: opts?.forceRefresh ?? false });
      const token = session.tokens?.accessToken.toString();
      return token ?? null;
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    await amplifySignOut({ global: false });
  }
}

let providerOverride: TokenProvider | null = null;

/** Inject a different provider (used by tests and Storybook). */
export function setTokenProvider(provider: TokenProvider | null): void {
  providerOverride = provider;
}

/** The default singleton provider used by the API client. */
export function getTokenProvider(): TokenProvider {
  return providerOverride ?? defaultProvider;
}

const defaultProvider = new AmplifyTokenProvider();
