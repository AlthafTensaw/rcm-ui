/**
 * CPT (Current Procedural Terminology) codes.
 *
 * Phase 4 of the v3 plan.
 *
 * ====================================================================
 * LICENSING — READ BEFORE BUNDLING ANY DATA
 * ====================================================================
 * CPT is owned and licensed by the American Medical Association (AMA).
 * Bundling the CPT code set into this package or any client-side bundle
 * REQUIRES an AMA license. Until that license is in place, this module
 * MUST NOT contain CPT data.
 *
 * Until the license is resolved, the platform uses one of two patterns:
 *
 *   1. Server-side lookup. The backend (which has the license) answers
 *      `GET /codes/cpt/{code}` and `GET /codes/cpt/search?q=...`. The
 *      client never holds the table. Use `cpt.useServerLookup(adapter)`
 *      to register a fetch adapter; subsequent calls to `cpt.get()` and
 *      `cpt.search()` go through the adapter (with caching).
 *
 *   2. Empty stub. If neither bundled data nor a server adapter is
 *      available, `cpt.get()` returns `undefined` and `cpt.search()`
 *      returns an empty array. UIs should display the raw code without a
 *      description and skip the descriptor tooltip.
 *
 * The TypeScript surface is identical regardless of which mode is active,
 * so calling code does not need to know.
 *
 * ACTION ITEM: legal review of AMA CPT licensing terms before this module
 * ships any bundled data. Track in ADR-CPT-LICENSE.
 * ====================================================================
 */

import type { CodeEntryBase, SearchOptions } from '../types';

export interface CptEntry extends CodeEntryBase {
  code: string;
  description: string;
  /** Section bucket (E/M, Anesthesia, Surgery, Radiology, Pathology, Medicine). */
  section: string;
}

/**
 * Adapter interface a host app implements to back CPT lookups with a
 * server-side, license-cleared data source.
 */
export interface CptServerAdapter {
  get(code: string): Promise<CptEntry | undefined>;
  search(query: string, options?: SearchOptions): Promise<CptEntry[]>;
}

let serverAdapter: CptServerAdapter | null = null;

/** Tiny LRU for request-coalescing and short-term caching. */
const cache = new Map<string, CptEntry | undefined>();
const CACHE_LIMIT = 500;

function rememberCpt(code: string, entry: CptEntry | undefined): void {
  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(code, entry);
}

export const cpt = {
  /**
   * Inject a server-side lookup adapter. Apps wire this once during bootstrap.
   */
  useServerLookup(adapter: CptServerAdapter | null): void {
    serverAdapter = adapter;
    cache.clear();
  },

  /**
   * Synchronous get. Returns from cache if available; otherwise undefined.
   * Callers that need fresh data must call `getAsync()`.
   */
  get(code: string): CptEntry | undefined {
    const normalized = code.padStart(5, '0').toUpperCase();
    return cache.get(normalized);
  },

  /**
   * Asynchronous get. Hits the server adapter if available, populates cache.
   */
  async getAsync(code: string): Promise<CptEntry | undefined> {
    const normalized = code.padStart(5, '0').toUpperCase();
    if (cache.has(normalized)) return cache.get(normalized);
    if (!serverAdapter) {
      rememberCpt(normalized, undefined);
      return undefined;
    }
    try {
      const entry = await serverAdapter.get(normalized);
      rememberCpt(normalized, entry);
      return entry;
    } catch {
      return undefined;
    }
  },

  /**
   * Asynchronous search. Returns an empty array if no adapter is configured.
   */
  async search(query: string, options?: SearchOptions): Promise<CptEntry[]> {
    if (!serverAdapter || !query.trim()) return [];
    try {
      return await serverAdapter.search(query, options);
    } catch {
      return [];
    }
  },

  /**
   * Format-only validity check. Does NOT verify against a code table — that
   * requires the server adapter. Use this for live-input feedback only.
   */
  isWellFormed(code: string): boolean {
    return /^\d{5}$/.test(code);
  },

  /** Test helper. */
  _clearCache(): void {
    cache.clear();
  },
};
