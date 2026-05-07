# Tensaw UI Platform

Monorepo for the Tensaw RCM UI platform. Internal use only — never published to public registries.

Implements the v3 Production Readiness Plan. This README covers the **monorepo mechanics**; for architectural detail see `docs/`.

## Quick start

```bash
# Prereqs
nvm use                       # picks up .nvmrc -> Node 22
corepack enable               # ensures pnpm 9 is available
corepack prepare pnpm@9.12.0 --activate

# Install
pnpm install

# Configure env (one time)
cp .env.example apps/patient/.env.local
# fill in Cognito + API + Stripe keys

# Run the patient app
pnpm dev
```

## Workspace layout

```
tensaw-ui/
├── apps/
│   └── patient/              # Phase 9 vertical slice
├── packages/
│   ├── runtime/              # Phases 1-2: store, middleware, events, API client
│   ├── design-system/        # Phase 3: primitives + 30+ RCM field types
│   ├── codes/                # Phase 4: CPT, ICD, POS, CARC, RARC reference tables
│   ├── visualization/        # Phase 5: charts, KPI, status badges, cell renderers
│   ├── composition/          # Phase 6: ArchetypeShell, ZoneRenderer, WidgetHost
│   ├── archetypes/           # Phase 7: 7 page archetypes
│   └── platform-rules/       # Phase 8: custom ESLint rules
├── tools/
│   ├── gen-widget/           # Phase 8: pnpm gen:widget
│   └── gen-page/             # Phase 8: pnpm gen:page
├── storybook/                # Phase 8: deployed catalog
├── prompts/                  # Phase 8: AI prompting templates
└── docs/                     # Phase 10
```

## Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts every app's dev server in parallel |
| `pnpm build` | Builds every package (`packages/*`) |
| `pnpm build:apps` | Builds every app (`apps/*`) |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier verify (CI) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright e2e tests (apps only) |
| `pnpm storybook` | Storybook dev server (Phase 8+) |
| `pnpm gen:widget` | Scaffold a new widget (Phase 8+) |
| `pnpm gen:page` | Scaffold a new page (Phase 8+) |

## Conventions

### Package naming
Internal packages live under the `@tensaw/` scope. They are **never published**; consumers reference them via `"workspace:*"` in `package.json`.

### Adding a new package
1. Create directory under `packages/` (or `apps/`).
2. Add `package.json` with `"private": true` and `"name": "@tensaw/<name>"`.
3. Add `tsconfig.json` extending `../../tsconfig.base.json` with `composite: true` and references to its workspace dependencies.
4. Add the new package as a reference in the root `tsconfig.json`.
5. Add a `README.md` documenting scope and which v3 plan phase it implements.

### Code style
- TypeScript `strict` + `noUncheckedIndexedAccess`. **No `any`** — use `unknown` and narrow.
- Prettier on save (configured in `.vscode/settings.json`).
- ESLint flat config. Type-aware rules require a project reference.
- Imports use the `@tensaw/<package>` form, not relative paths across packages.

### Environment variables
- All env keys are documented in `.env.example`.
- App-specific env files live at `apps/<app>/.env.local`.
- **Never commit filled-in env files.** `.gitignore` blocks them.
- The runtime config module (`@tensaw/runtime/config`) validates required keys with Zod at startup and fails fast.

### HIPAA constraints (cross-cutting)
- PHI fields wrap in `<PrivacyField>` (mask + reveal-on-permission + audit).
- Card data goes through Stripe Elements only. Raw PAN/CVC never enters application state.
- No PHI in URL params, query strings, log lines, or telemetry payloads.
- Idle timeout is enforced platform-wide (configurable per clinic).
- Print/export views carry user identity + timestamp watermark.

### Geography & currency
- US-only. State validators cover 50 states + DC + applicable territories.
- USD only. Negative values render as `-$164.86` (leading minus, not parens).
- ET default time zone; CT/MT/PT supported.

## Status

| Phase | Status |
|---|---|
| Monorepo scaffold | Done |
| Phase 1 — Runtime gap closure | In progress (config + API client done) |
| Phase 2 — Runtime completion | Pending |
| Phase 3 — Design primitives + RCM fields | Pending |
| Phase 4 — `@tensaw/codes` reference data | Pending |
| Phase 5 — Visualization | Pending |
| Phase 6 — Composition | Pending |
| Phase 7 — Page archetypes | Pending |
| Phase 8 — Code generation + DX | Pending |
| Phase 9 — Patient vertical slice | Pending |
| Phase 10 — Documentation | Ongoing |

## License

Proprietary. Internal use only. © Tensaw / Allofactor.
