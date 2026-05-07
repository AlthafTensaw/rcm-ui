/**
 * Shared types across the codes package.
 *
 * Phase 4 of the v3 plan. Each subdomain (cpt, icd, pos, etc.) defines its own
 * specific Entry type extending CodeEntryBase.
 */

export interface CodeEntryBase {
  /** Canonical code string (no separators; per-domain format varies). */
  code: string;
  /** Human-readable description. */
  description: string;
  /** ISO date the code became effective. Optional — not all sources publish. */
  effectiveDate?: string;
  /** ISO date the code was retired. If undefined, currently active. */
  endDate?: string;
}

/** Result of a lookup. Always sorted by description match relevance. */
export interface LookupResult<T extends CodeEntryBase> {
  entries: T[];
  totalMatches: number;
}

/** Common search options across subdomains. */
export interface SearchOptions {
  /** Maximum results returned (default 25). */
  limit?: number;
  /** Cap effective-date filter — only return codes active as of this date. */
  asOf?: Date;
}

/** Generic helper that filters by date if provided. */
export function isActiveAt(entry: CodeEntryBase, asOf: Date | undefined): boolean {
  if (!asOf) return true;
  if (entry.effectiveDate && new Date(entry.effectiveDate) > asOf) return false;
  if (entry.endDate && new Date(entry.endDate) < asOf) return false;
  return true;
}

/**
 * Score a description match for ranking. Exact code match scores highest.
 * Used by every domain's `search()` to keep results consistently ordered.
 */
export function scoreMatch(query: string, entry: CodeEntryBase): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const code = entry.code.toLowerCase();
  const desc = entry.description.toLowerCase();
  if (code === q) return 1000;
  if (code.startsWith(q)) return 500;
  if (desc.startsWith(q)) return 200;
  if (desc.includes(q)) return 100;
  if (code.includes(q)) return 50;
  return 0;
}

/**
 * Filter and rank entries by a query. Returns at most `limit` entries.
 */
export function searchEntries<T extends CodeEntryBase>(
  entries: T[],
  query: string,
  options: SearchOptions = {},
): T[] {
  const limit = options.limit ?? 25;
  if (!query.trim()) {
    return entries.filter((e) => isActiveAt(e, options.asOf)).slice(0, limit);
  }
  const scored: { entry: T; score: number }[] = [];
  for (const entry of entries) {
    if (!isActiveAt(entry, options.asOf)) continue;
    const score = scoreMatch(query, entry);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
