# @tensaw/actions — CHANGELOG

## 0.0.1 — Platform fix session (2026-05-06)

### Fixed

- **Issue #1 — Cache-key mismatch when request schema has `.default(...)`.**
  `useActionQuery` now pre-validates the request through the action's Zod
  schema before deriving the cache key. Without this, a schema with
  `.default(...)` for a field the caller omitted produced a divergence: the
  hook subscribed to a key built from the raw request (e.g. `{limit: 200}`),
  but the dispatcher wrote to a key built from the validated request (e.g.
  `{limit: 200, offset: 0}`). Subscribers never received the data, even
  though the dispatch and cache write succeeded. The fix adds a `useMemo`'d
  `safeParse` step in the hook so subscription, dispatch, and cache writes
  all key off the same validated shape. Behavior unchanged for callers who
  already pass full request objects (no defaults applied).

  - Surfaced by: Operations Console Phase A
  - Worked around in Phase A by stripping `.default(...)` from action
    schemas; that workaround can be reverted now (one schema —
    `admin.stuck-cases` — has been reverted in this session as
    end-to-end validation)
  - Patient app unaffected (its callers pass full requests; bug was latent)

### Added

- New regression test file `src/issue1-cacheKey.test.ts` (3 tests):
  - Asserts the hook delivers data when the caller omits a field with a
    Zod default
  - Asserts the hook still works when the caller passes the full
    validated request
  - Asserts a partial caller and a full caller (resolving to the same
    validated shape) share one fetch and one cache entry

  Test count: 69 → 72.
