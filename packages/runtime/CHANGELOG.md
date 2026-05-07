# @tensaw/runtime — CHANGELOG

## 0.1.0 — Platform fix session (2026-05-06)

### Added

- **`buildSuccessEnvelope<T>(data)`** and **`buildErrorEnvelope(code, message, details?)`**
  exported from `@tensaw/runtime` via the existing `api/envelope.ts` module.
  Both return plain envelope objects (`ApiSuccess<T>` / `ApiError`); callers
  wrap with `HttpResponse.json(...)` (or equivalent) to produce real HTTP
  responses. Each call emits a fresh meta block with `correlationId`,
  `timestamp`, and `apiVersion: 'v1'`, matching what real backends produce.

  Use these in MSW handlers, test fixtures, and any code that constructs a
  platform response by hand. `authenticatedFetch` strictly validates every
  backend response against `apiSuccessSchema` / `apiErrorSchema`; returning
  a raw body will produce a `PLATFORM_ENVELOPE_INVALID` error and the
  action dispatch will fail before the component sees data.

  - Issue #2 from `Frontend_Phase_A_Handback.md`: this requirement was
    previously undocumented. Operations Console Phase A discovered it the
    hard way (runtime envelope-validation failure) and added a local
    `envelope()` helper. The patient-app's `@tensaw/mock-server` package
    had a similar local copy. Both consumers have been migrated to import
    from `@tensaw/runtime` in this session; their local copies have been
    deleted. The MSW envelope requirement is now documented in
    `packages/design-system/docs/WIRING_PATTERNS.md`.

### Tests

- 12 new unit tests for the builders covering data attachment, meta block
  shape, `apiSuccessSchema` / `apiErrorSchema` validation, type-guard
  round-trip, fresh meta per call, primitive payloads, structured details
  attachment, and details omission when not supplied.

  Test count: 71 → 83.

### Migration notes for downstream consumers

- If you have a local `envelope()` / `errorEnvelope()` helper in an MSW
  handler or test fixture, replace it with imports from `@tensaw/runtime`.
  See `packages/mock-server/src/handlers/arHandlers.ts` and
  `apps/operations-console/src/mocks/handlers.ts` for migration examples.
