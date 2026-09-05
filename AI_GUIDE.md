# AI Agent Programming Guide - Fullstack Base Project

This template is a stable product-oriented base for AI-driven development.

Current branch baseline:

- Auth flow (`/auth/signup`, `/auth/signin`, `/auth/logout`, `/auth/refresh`)
- Frontend auth UI route: `/login`
- Admin workspace, Prompt Studio, tests editor, public links, analytics, public student flow, and Polus public template

Auth-only mode is still a supported cleanup target for a dedicated template-finalization branch. Do not remove current business modules from this branch unless the task explicitly asks to return to auth-only.

## Tech Stack

- Backend: NestJS, Prisma 7, PostgreSQL, JWT (Passport), nestjs-zod, Swagger
- Frontend: React 19, Vite, TanStack Query, Orval, Zustand, Tailwind, shadcn/ui
- Infra: Docker Compose (frontend + backend + Postgres + Adminer)
- Frontend architecture: Strict FSD with template guardrails (enforced)

## AI Agent Operating Mode (Local Development)

This repository is optimized for AI-agent implementation loops.

Mandatory behavior for agents:

1. Read `AI_GUIDE.md` first and treat it as repository source-of-truth.
2. Start with search and evidence collection before edits.
3. Prefer small, reversible commits over broad refactors.
4. Never bypass architecture/lint/test gates to "make it pass".
5. Keep changes scoped to the user's request; no opportunistic rewrites.

## Docker Runtime Contract

For normal project startup, agents must use the root `docker-compose.yml` only.

Required command:

```powershell
docker compose up -d
```

Expected runtime services:

- `ai_template_frontend` on `http://localhost:5173`
- `ai_template_backend` on `http://localhost:3000`
- `ai_template_postgres` on `localhost:5432`
- `ai_template_adminer` on `http://localhost:8080`

Runtime security defaults:

- Local development may use the root compose defaults and local JWT/database placeholders.
- Non-local `NODE_ENV` values must provide non-placeholder `DATABASE_URL`,
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and explicit `CORS_ALLOWED_ORIGINS`.
- `CORS_ALLOWED_ORIGINS` is a comma-separated list of frontend origins. Do not use
  wildcard origins with credentialed auth cookies.

Do not use `.devcontainer/docker-compose.devcontainer.yml` to start the project for the user.
That compose file is only for the VS Code "Reopen in Container" workflow and creates a single
`workspace` container that runs frontend and backend together. It is not the project runtime topology.

### OpenRouter Configuration

The API key is backend-only and must never reach the frontend. Prompt behaviour itself is
documented in [`docs/specs/prompt-studio.md`](docs/specs/prompt-studio.md).

```env
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

### Frontend Container Rebuild Before Tests

When files under `client/` are changed, rebuild/recreate the frontend container before running
frontend-related verification such as lint, build, Vitest/Jest, Playwright, smoke checks, or
`verify:*` gates:

```powershell
docker compose up -d --build --force-recreate frontend
```

Use the root `docker-compose.yml` only. Host-level checks - Vitest, ESLint and `tsc` - run against
the sources directly and need no container rebuild; the rule applies to browser-level verification.

## Search Mode (Exhaustive, For Non-Trivial Tasks)

Use exhaustive search mode when request touches unfamiliar areas, multiple modules, or architecture decisions.

Execution protocol:

1. Run parallel internal discovery first:
   - codebase search (`grep` / `rg` / AST search)
   - structure scan (feature, widget, page, shared layers)
   - existing pattern lookup in neighboring modules
2. In parallel, run external reference scan for unfamiliar libraries:
   - official docs first
   - high-quality OSS examples second
3. Do not stop at the first hit. Confirm patterns from multiple matches.
4. Summarize findings before implementation (what exists, what differs, what to reuse).
5. Then implement minimally, following discovered conventions.

Stop conditions for search:

- You can name exact target files and existing pattern to follow.
- Additional searches return repetitive information.
- Required external behavior is confirmed by official docs.

## Refactor Debt Prevention (Always-On)

Goal: avoid another large refactor wave by enforcing guardrails continuously.

1. Prefer extraction when file size grows near warning thresholds.
2. Keep pages thin (routing/composition only).
3. Keep side-effect orchestration in hooks/actions, not in JSX-heavy components.
4. Keep helpers pure and colocated with their feature/workspace.
5. If change requires broad structural edits, split into dedicated refactor commit first.

Maintainability thresholds for proactive extraction:

- Prefer splitting files before they cross ~350 lines (lint warning).
- Hard fail target is 420 effective lines. Current guard is tightened in steps:
  client source at 420, server source at 700 during backend extraction, server specs at 900.
- Prefer reducer/extraction when a module accumulates more than ~14 `useState` calls.
- Treat complexity warnings as mandatory refactor candidates for the next small PR.

## Verifying A Change (Always-On)

Every rule below exists because it was violated in this repository and cost a red CI run, a
regression, or a false green. They are cheap to follow and expensive to skip.

1. **Verify from the state CI has, not the state you are in.** Your working tree accumulates
   generated artifacts — `server/openapi.json`, `client/dist`, `server/dist` — from earlier steps
   in the session. CI starts clean. Before trusting a gate you changed, delete those and run it
   again. A check that passes only because you generated something an hour ago is not a check.

   Ask `git check-ignore` which ones those are, rather than deciding by the word "generated".
   `client/src/shared/api/generated/**` and `client/src/shared/api/model/**` are produced by Orval
   and **committed**; `verify:api-mutator` reads them before `gen:api` ever runs. Deleting them to
   "start clean" breaks the gate with an `ENOENT` that looks like a repository fault and is not
   one. Generated and gitignored are different properties here.

2. **When extracting shared logic from two implementations, the extraction must match the
   authority, and you must diff it against every original.** If the server validates the same
   rule, the server is the authority and the client copy mirrors it exactly, non-obvious branches
   included. Writing a "cleaner" version silently changes behaviour for whichever caller already
   agreed with the authority.
3. **Deleting code means deleting its exports and its mentions, in the same change.** A file with
   no importers is one kind of dead code; an exported symbol nobody imports is another, and a
   scan for orphaned _files_ will not see it. Grep the documentation for the name of every script,
   command or path you remove — a guide that names a deleted command reads as an instruction.
4. **Prove a mechanical refactor by equality, not by absence of complaints.** Record the baseline
   first — error count, test count, test names — then require the number after the move to be
   _the same_, not merely small. "It builds" hides a lost test; "33 before, 33 after, same files"
   does not.
5. **Reproduce a reported failure with the system's own input before acting on it.** A claim built
   from a hand-written example can be confidently wrong about a tool that produces different input
   in reality. Run the real command, read the real arguments, then decide. This applies equally to
   findings from other agents and to your own hypotheses.
6. **Say what a number counts before you report it.** A measurement can be arithmetically right and
   still answer the wrong question. "Twelve of the thirteen files this branch touches are gone from
   `main`" means the branch is stale; the same query run over files the branch _adds_ means nothing
   at all, because a file it creates is supposed to be absent. Separate the categories, then count.
   The same applies to a green check: `MERGEABLE` says two diffs do not overlap textually, not that
   the merged result is correct. When both sides edited one file, merge locally and run the gate
   before merging for real.
7. **Editing files with a script is fine; guessing their line endings is not.** This tree is CRLF.
   Reading with `newline=''`, splitting on `\r\n` and writing with `newline='\r\n'` doubles every
   carriage return, and `$` under `re.MULTILINE` does not anchor before a `\r`, so replacements
   silently miss. Normalise to `\n` in memory, do the work, convert once on write — and prefer
   moving a block of bytes over retyping it, so Cyrillic strings and shell quoting stay out of it.

## Frontend Architecture Contract (Strict FSD)

Source of truth:

- `template/fsd.rules.json` (layer rules)
- `scripts/verify-architecture.mjs` (automated checks)
- `template/features.manifest.json` (feature inventory + route/module wiring + `publicRoutes` + `generatedApiDirs`)

Layer order (imports only "down"):

- `app -> pages -> widgets -> features -> entities -> shared`

Rules:

1. `pages/*` are route entrypoints/composition only. No deep business logic inside page files.
2. Cross-slice imports in `widgets/features/entities` must go through slice public API (`index.ts`) in strict mode.
3. Feature inventory and public student routes still come from `template/features.manifest.json`; FSD does not replace manifest discipline.
4. Any architecture change must keep `npm run verify:architecture` green.
5. Feature implementation order remains strict: data model -> backend -> `gen:api` -> frontend -> full verification.

Current branch state:

- `template/fsd.rules.json` uses `mode: "strict"`.
- `transition.allowLayerBypass` and `transition.allowDeepImports` must remain empty.
- Any temporary bypass must be explicitly documented and removed before merge.

## Feature Pipeline (Required Order)

### Phase 0: Feature Ownership Classification

Before any fullstack feature work, classify the task and state the classification explicitly.
Do not run `npm run gen:nest <name>` until the owning feature is clear.

Use `existing-feature-change` when the work extends an existing bounded context. This is the default
choice when the route root, Prisma models, UI workspace, and user workflow already belong to an
existing feature such as `admin`, `tests`, or `auth`.

Use `new-feature` only when the work introduces a new durable bounded context with most of these
signals:

- a new business object or process with an independent lifecycle
- a new backend module and API tag/route root
- new Prisma model ownership or a clearly separate data owner
- a new frontend slice/workspace/page instead of an addition to an existing workspace
- a new entry in `template/features.manifest.json`
- a generated API file that belongs to the new feature after `npm run gen:api`
- dedicated unit/e2e coverage for the new workflow

Examples:

- `existing-feature-change`: import questions from CSV under `/admin/tests`, export test attempts,
  add public-link statistics filters, or add settings for test publishing.
- `new-feature`: add a standalone `news` management area with its own `News` model, `/admin/news`
  route, backend module, frontend workspace, manifest entry, and tests.

Classification guardrails:

1. Prefer expanding the existing owning feature over creating a module for every button or endpoint.
2. Do not hide a truly independent domain inside `admin` or `tests` just because it is faster.
3. If table ownership is unclear, stop and ask before changing Prisma schema or scaffolding a module.
4. If a change crosses multiple bounded contexts, define the owning feature and the cross-feature
   contract before implementation.
5. Keep cross-feature public surface explicit; do not deep-import another feature's internals.

Current ownership map:

- `auth` owns authentication flow, JWT/session behavior, and `/login` frontend entrypoint.
- `admin` is an admin shell and operational workspace, not a catch-all product domain. It owns the
  admin frame, overview, users, and settings screens.
- `/admin/*` is a route namespace for protected operator UI. A page under `/admin` does not
  automatically belong to the `admin` feature.
- `tests` owns test authoring, publishing, public links, education organizations used by tests,
  attempt/session/result flows, public `/t/*` routes, and `tests` / `tests-public` generated API
  clients.
- `analysis-prompts` owns prompt lifecycle, prompt simulation, and the `/admin/prompts` operator
  workflow. Tests may reference published prompt versions through database relations/contracts, but
  must not deep-import analysis prompt internals.
- `openrouter` is infrastructure/integration code. Feature code must not import OpenRouter
  utilities through another feature module; expose integration services from the integration owner.
- Integration-only backend modules such as `openrouter` are declared in
  `template/features.manifest.json` `integrationModules`, not as feature-owned route contexts.
- `app-settings` is system configuration/infrastructure unless a task gives it an independent
  product workflow and lifecycle.

For every backend + frontend task, include this pre-implementation note in the working plan:

```text
Change classification:
Owning feature/module:
Prisma owner/model:
Route root:
Manifest impact:
Generator decision:
Verification gates:
```

### Phase 1: Data Modeling

1. Update `server/prisma/schema.prisma`.
2. Regenerate Prisma + Zod types:
   ```powershell
   npm run prisma:generate
   ```
3. Sync DB schema:
   ```powershell
   npm run prisma:push
   ```

### Phase 2: Backend API

1. For a `new-feature`, scaffold the backend module:
   ```powershell
   npm run gen:nest <name>
   ```
   For an `existing-feature-change`, intentionally skip the generator and extend the owning module.
2. Replace scaffolded placeholders with real logic when a generator was used.
3. DTO rules:
   - Use `createZodDto(...)`
   - In response DTOs, convert Prisma `Date` fields to `z.string()` for Swagger/OpenAPI compatibility
4. Controller docs:
   - Always add `@ApiOperation(...)`
   - Always add `@ApiResponse({ type: ... })`
   - For endpoints used by generated frontend clients, do not use schema-only responses as a substitute for typed DTO response declarations.

### React Query/Form Sync Rule

1. Do not mirror query data into form state via `setState` inside `useEffect`.
2. Prefer derived/effective values (`queryValue ?? localFormValue`) at render/submit boundaries.
3. If metadata must be fixed (for example link-bound organization), lock the input and submit the effective value.

### Phase 3: Frontend Integration

1. Regenerate OpenAPI + API hooks (no running backend required):
   ```powershell
   npm run gen:api
   ```
   Notes:
   - OpenAPI source is generated to `server/openapi.json`
   - The script clears stale generated files before Orval run.
   - Before generation, run mutator guard (or use full template verify):
     ```powershell
     npm run verify:api-mutator
     ```
   - If backend DTOs/controllers changed, regenerate API client before any frontend lint/build/test step.
2. Implement UI/domain composition in `widgets/*` and `features/*`; keep `pages/*` as thin route entrypoints.
3. Use `shared/api/schemas.ts` for client form validation schemas.

## Product Contracts

These describe the product built on this template rather than the template itself. Read the one
you are touching; do not load them all up front.

- [`docs/specs/prompt-studio.md`](docs/specs/prompt-studio.md) — working on `/admin/prompts`, prompt versioning, or OpenRouter calls.
- [`docs/specs/tests-module.md`](docs/specs/tests-module.md) — working on test authoring, publishing, or the built-in prof-orientation methodology.
- [`docs/specs/public-links-and-stats.md`](docs/specs/public-links-and-stats.md) — working on `/admin/public-links` or its statistics workspace.
- [`docs/specs/public-student-ux.md`](docs/specs/public-student-ux.md) — working on the public `/t/*` routes, public theming, or the Polus template.

## Reference Example For AI Agents (Illustrative)

Example goal: implement `news` feature with editor UI (example only, not part of the current baseline).

1. Schema:
   - Add `News` model to `server/prisma/schema.prisma`.
   - Add relation on `User`.
2. Backend:
   - `npm run gen:nest news`
   - Implement:
     - `server/src/news/news.controller.ts`
     - `server/src/news/news.service.ts`
     - `server/src/news/dto/create-news.dto.ts`
     - `server/src/news/dto/news-response.dto.ts`
   - Keep rules:
     - use `createZodDto`
     - `createdAt/updatedAt` as `z.string()` in response DTO
     - `@ApiOperation` + `@ApiResponse`
3. Frontend:
   - `npm run gen:api`
   - Add form/page and route wiring:
     - `client/src/features/create-news/ui/create-news-form.tsx`
     - `client/src/pages/news/news-page.tsx`
     - `client/src/app/App.tsx`
4. Guardrails:
   - Update `template/features.manifest.json`
   - Run `npm run verify:template`
5. Temporary feature cleanup, only when the feature was created just for pipeline checks:
   - Remove temporary module files and wiring
   - Remove feature entry from manifest
   - Run `npm run verify:template` again

## Stability Rules

1. Core typecheck/lint/test/build commands must pass during implementation loops:
   ```powershell
   npm run typecheck
   npm run lint
   npm run test --prefix server
   npm run test:e2e --prefix server
   npm run test:run --prefix client
   npm run build --prefix server
   npm run build --prefix client
   ```
2. End-to-end template verification must pass:

   ```powershell
   npm run verify:template
   ```

   This is the release-level gate: Prisma generation/sync, OpenAPI/API client generation, architecture checks, maintainability, typecheck, lint, server unit/e2e tests, client Vitest, server/client builds, smoke checks, `format:check`, `audit:all`, and critical browser e2e.

   `npm run typecheck` is not redundant with `npm run build --prefix server`. `nest build` compiles through `server/tsconfig.build.json`, which excludes `**/*spec.ts`, so the server specs are the one part of the tree no other gate ever compiles. Type errors accumulate there silently while every check stays green — thirty-three of them had, before the gate was added. `npm run typecheck` runs `tsc --noEmit` over `server/tsconfig.json`, which includes them.

3. Do not keep dead feature files/routes in the template.
4. Keep auth flow always working while adding/removing features.
5. Use `import type` for type-only imports.
6. **Storage Safety:** NEVER use `localStorage` or `sessionStorage` directly. Always use `safeStorage` from `@/shared/lib/storage` to avoid "Access to storage is not allowed" errors in restricted browser contexts.
7. **API Architecture (Node.js Compatibility):**
   - `client/src/shared/api/api.ts` MUST contain ONLY the Axios instance creation. No browser-specific code (localStorage, window, etc.) is allowed here because this file is imported by Orval generator in a Node.js environment.
   - `client/src/shared/api/api.ts` MUST NOT contain `import.meta` (it causes Orval/esbuild warnings in Node target).
   - `client/src/shared/api/api.ts` must export `customInstance`, default `api`, and `configureApiBaseUrl`.
   - All browser-specific interceptors (auth token injection, refresh logic) MUST reside in `client/src/shared/api/interceptors.ts`.
   - `client/src/app/App.tsx` must call:
     - `configureApiBaseUrl(import.meta.env.VITE_API_URL)`
     - `configureInterceptorsRuntime(...)`
     - `setupInterceptors(api)`
   - Enforced by `npm run verify:api-mutator`.
8. Keep server error format unified:
   ```json
   { "success": false, "error": { "code": "...", "message": "..." } }
   ```
9. Runtime API discovery must validate required API routes before accepting discovered origin (prevents binding to unrelated local Swagger instances).

## Local Verification Entry Points

Use these commands during local AI-agent development:

1. Fast local gate (no DB reset, no API regeneration):
   ```powershell
   npm run verify:local
   ```
2. Full template gate (release-level):
   ```powershell
   npm run verify:template
   ```

`verify:local` is the default loop for daily implementation.
`verify:template` is mandatory before finalizing branch state.

`verify:architecture` reads `server/openapi.json`, which is gitignored and regenerated rather
than committed. `npm run verify:contracts` pairs the generation with the check so neither gate
can validate a stale document: `verify:local` calls it, and `verify:template` reaches the same
state through `gen:api`, which regenerates the client as well. Run `npm run verify:contracts`
on its own after changing a controller or DTO to see the architecture result without paying
for the full loop.
`npm run verify:invariants` runs `scripts/verify-invariants.mjs` to check non-obvious architecture invariants (handler Swagger completeness, no `z.date()` in DTOs, storage discipline, unified error shape, public DTO safety, no React Query state mirroring).
`npm run verify:diff` runs `scripts/verify-diff.mjs` as an auxiliary fast pre-flight check over changed scopes; it is not a gate and does not replace `verify:local` or the release gate `verify:template`.

## PR-Ready Checklist (Feature Delivery)

Use this checklist before opening PR or finalizing work.

1. **Data model synced**
   - `server/prisma/schema.prisma` updated.
   - `npm run prisma:generate` and `npm run prisma:push` passed.
2. **Backend completed**
   - Module/controller/service/DTOs implemented.
   - Controllers include `@ApiOperation` and `@ApiResponse`.
3. **Manifest aligned**
   - Feature added or updated in `template/features.manifest.json`.
   - `backendFiles`, `frontendFiles`, and `generatedApiFile` paths are correct.
4. **Mutator contract preserved**
   - `client/src/shared/api/api.ts` remains Node-safe.
   - `npm run verify:api-mutator` passed.
5. **Frontend API regenerated**
   - `npm run gen:api` passed.
   - Generated hooks are used by the new UI.
6. **Routes and navigation wired**
   - Route added in `client/src/app/App.tsx`.
   - `publicRoutes` from manifest are wired in `client/src/app/App.tsx`.
7. **Core tests green**
   - `npm run test --prefix server`, `npm run test:e2e --prefix server`, and `npm run test:run --prefix client` passed when the branch changed related behavior.
8. **Full pipeline green**
   - `npm run verify:template` passed with no failures.
9. **No hidden bypasses**
   - Do not disable checks, do not comment out failing logic, do not hardcode obsolete smoke paths.

## Generator Status

- Backend resource generator is available via `npm run gen:nest <name>`.
- Fullstack feature generator (backend + frontend + route wiring in one command) is not implemented yet and should be designed separately.

## Architecture Source of Truth

- Feature inventory is declared in `template/features.manifest.json`.
- Public student routes are declared in `template/features.manifest.json` under `publicRoutes`.
- Additional non-feature generated API directories are declared in `template/features.manifest.json` under `generatedApiDirs`.
- In an explicit auth-only cleanup branch, `features` can be empty and `auth.requiredRoutes` should reflect frontend routing (currently `"/login"`).
- Every declared feature must have:
  - backend module/controller/service/DTO files
  - frontend page + create form
  - generated API file from Orval
  - route wiring in `client/src/app/App.tsx`
- `backendFiles` and `frontendFiles` are **entrypoint lists, not inventories**. For a feature that
  declares `ownedRoots`, those roots define what the feature owns; the file lists name the modules,
  controllers and pages an agent should start from. `server/src/tests` alone holds more than eighty
  files and is not meant to be enumerated by hand. Keep every module and controller listed, and do
  not read a short list as evidence that the rest of the feature does not exist.
- A file belongs to exactly one feature's `frontendFiles`. Shared frames such as
  `client/src/features/admin/ui/admin-shell.tsx` stay with their owning feature; other features
  reference them without claiming them.
- Every declared `publicRoutes` entry must be wired in `client/src/app/App.tsx`.
- Every generated API directory outside feature names (for example `tests-public`) must be declared in `generatedApiDirs`.
- `npm run verify:architecture` fails if any of these constraints are broken.
- It also fails on stale architecture artifacts not declared in manifest (extra backend feature modules, extra non-auth feature/page directories, stale generated API directories, unexpected routes in App routing).
