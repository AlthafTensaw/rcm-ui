/**
 * Endpoint helpers.
 *
 * Parses the `'METHOD /path/{param}'` declaration into method, resolved path,
 * and a remainder request body suitable for query string (GET) or JSON body
 * (POST/PATCH/PUT/DELETE).
 *
 * Kept tiny and isolated because path-param substitution is easy to get wrong.
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ResolvedEndpoint {
  method: HttpMethod;
  /** Path with all `{name}` placeholders substituted. */
  path: string;
  /**
   * The fields from the original request that were NOT consumed as path
   * parameters. For GET, send as query string; for POST/PATCH/etc., send as
   * JSON body.
   */
  remainder: Record<string, unknown>;
}

const PATH_PARAM = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Split `'METHOD /path'` into its parts. Throws if malformed.
 */
export function parseEndpoint(
  endpoint: string,
): { method: HttpMethod; pathTemplate: string } {
  const trimmed = endpoint.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx <= 0) {
    throw new Error(`[actions] Malformed endpoint "${endpoint}".`);
  }
  const method = trimmed.slice(0, spaceIdx).toUpperCase() as HttpMethod;
  const pathTemplate = trimmed.slice(spaceIdx + 1);
  return { method, pathTemplate };
}

/**
 * Substitute `{name}` placeholders from the request, returning the resolved
 * path and the remainder of the request (fields not consumed by the path).
 *
 * Throws on:
 *   - Unmatched path parameter (request lacked the field).
 *   - Path parameter value that is null, undefined, or empty string.
 */
export function resolveEndpoint(
  endpoint: string,
  request: Record<string, unknown>,
): ResolvedEndpoint {
  const { method, pathTemplate } = parseEndpoint(endpoint);
  const consumed = new Set<string>();

  const path = pathTemplate.replace(PATH_PARAM, (_match, name: string) => {
    if (!(name in request)) {
      throw new Error(
        `[actions] Endpoint "${endpoint}" expects path parameter "${name}" but request did not provide it.`,
      );
    }
    const value = request[name];
    if (value === null || value === undefined || value === '') {
      throw new Error(
        `[actions] Endpoint "${endpoint}" path parameter "${name}" is null/undefined/empty.`,
      );
    }
    consumed.add(name);
    // value is non-null/undefined/empty here; coerce via JSON to dodge
    // the base-to-string lint rule on unknown.
    return encodeURIComponent(
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value),
    );
  });

  // Build remainder by skipping consumed keys.
  const remainder: Record<string, unknown> = {};
  for (const key of Object.keys(request)) {
    if (!consumed.has(key)) {
      remainder[key] = request[key];
    }
  }

  return { method, path, remainder };
}

/**
 * Serialize a remainder object into a URL query string. Skips undefined
 * values; serializes arrays as repeated keys (`?statuses=A&statuses=B`).
 *
 * Returns the query string with leading `?` or empty string.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          usp.append(key, String(item));
        }
      }
    } else if (typeof value === 'object') {
      // Nested objects serialize as JSON — backends should accept this for complex filters,
      // or we add a separate filterParam mapper later.
      usp.append(key, JSON.stringify(value));
    } else if (typeof value === 'string') {
      usp.append(key, value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      usp.append(key, String(value));
    }
    // Other types (function/symbol/bigint) silently dropped from the
    // query string — they shouldn't appear in a request payload.
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}
