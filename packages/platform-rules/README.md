# @tensaw/platform-rules

Custom ESLint rules that enforce the Tensaw platform contracts.

Implements **Phase 8** of the v3 plan.

## Rules

- `widget-must-export-manifest`
- `no-cross-widget-imports`
- `no-raw-fetch-outside-platform-api`
- `no-hardcoded-tokens` (color/spacing literals)
- `phi-field-must-be-wrapped` — PHI fields must be wrapped in `<PrivacyField>`
- `no-phi-in-url` — PHI identifiers (MRN, SSN) cannot appear in URL params or query strings
- `no-raw-card-fields` — heuristic check for variable names suggesting raw card data
- `no-console-outside-logger` — console only allowed inside the logger adapter

## Status

Phase 8 — pending earlier phases.
