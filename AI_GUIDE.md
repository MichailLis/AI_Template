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

### Frontend Container Rebuild Before Tests

When files under `client/` are changed, rebuild/recreate the frontend container before running
frontend-related verification such as lint, build, Vitest/Jest, Playwright, smoke checks, or
`verify:*` gates:

```powershell
docker compose up -d --build --force-recreate frontend
```

Use the root `docker-compose.yml` only. The project Codex hook in `.codex/hooks.json` enforces this
guard before frontend-related test commands.

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

## CodeGraph Usage Recommendations

CodeGraph is an optional local code-intelligence index and MCP navigation tool for this repository.
Use it to speed up discovery, not to replace source reading or verification gates.

Preferred use cases:

1. Start non-trivial codebase discovery with `codegraph_status` and `codegraph_files` when the MCP
   tools are available. If MCP is not loaded in the current agent session, use the CLI equivalents
   `codegraph status` and `codegraph files`.
2. Use `codegraph_context` for "how does this feature work?" questions before opening many files.
   Prefer queries that include real code terms: feature names, route segments, symbols, DTO names,
   generated client names, or file names.
3. Use `codegraph_search` or `codegraph query` for exact symbol lookup, NestJS route lookup, and
   generated API hook discovery. Route searches such as `education-organizations` or `public-links`
   are useful; broad punctuation-only searches are not.
4. Use `codegraph_explore` after a context/search result when several related symbols need source
   snippets in one call. Keep the query symbol/file-oriented instead of natural-language heavy.
5. Use CodeGraph route results as a fast endpoint map, especially for NestJS controllers, then
   confirm behavior in the controller/service/DTO source before editing.

Trust boundaries:

1. Do not rely on `codegraph affected`, `codegraph_impact`, `codegraph_callers`, or
   `codegraph_callees` as the only test-impact signal. They can miss Jest specs, NestJS dependency
   injection chains, and generated-client relationships.
2. Always confirm affected tests with `rg`, imports, neighboring specs, and the relevant package
   test commands.
3. After file deletions or renames, run `codegraph index --force` if results look stale. A full
   reindex is fast enough for this repo and clears stale symbols reliably.
4. Keep `.codegraph/` local and ignored. Never commit the index database.
5. CodeGraph findings do not waive required project gates such as `npm run verify:local`,
   `npm run verify:template`, lint, build, or targeted tests.

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

## OpenRouter Prompt Studio Foundation (Current Branch)

Current prompt foundation is implemented as the `analysis-prompts` bounded context under:

- Backend: `server/src/analysis-prompts/*`
- Frontend page wrapper: `client/src/pages/admin/admin-prompts-page.tsx`
- Frontend workspace: `client/src/widgets/admin-prompts-workspace/*`
- Route: `"/admin/prompts"`

Required behavior:

1. OpenRouter key is backend-only (`OPENROUTER_API_KEY` in `server/.env`).
2. Model catalog must be loaded through backend proxy (`GET /admin/prompts/models`).
3. Prompt generation must be proxied via backend (`POST /admin/prompts/generate`).
4. Frontend must never call OpenRouter directly.
5. Prefer free models by default to reduce accidental spend.
6. Prompt test variables are local UI helpers until question system is integrated.
7. For strict machine-parseable output, use `response_format: json_schema` + `strict: true` with explicit schema.
8. When schema is required, set `provider.require_parameters=true` to avoid routing to providers that ignore required params.
9. Do not enable OpenRouter web-search for tests generation (`plugins: [{id: "web"}]` and `:online` variants are out of scope).
10. Archived prompt versions remain valid for already published test versions that reference them; archive hides prompt versions from future selection/editing workflows, it must not break historical runtime analysis.

Recommended env vars for prompt foundation:

```env
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

## Tests Module Foundation (Current Branch)

Current tests implementation is wired as a dedicated backend module + admin workspace:

- Backend module: `server/src/tests/*`
- Frontend page wrapper: `client/src/pages/admin/admin-tests-page.tsx`
- Frontend workspace: `client/src/widgets/admin-tests-workspace/*`
- Admin route: `"/admin/tests"`
- Manifest feature entry: `tests` (`template/features.manifest.json`)

Domain/versioning baseline:

1. Single active draft per topic (`activeDraftVersionId`).
2. Optional active published version (`activePublishedVersionId`).
3. Publish action archives prior published version (if exists), promotes draft, then clones a new draft.
4. Question weights are `Int`.
5. Branching configurator is intentionally out of scope for this stage.

Frontend UX baseline for tests editor:

1. Question add/edit must happen in modal UI (avoid oversized inline editor blocks).
2. Choice-type options should use explicit row-based inputs, not manual delimiter syntax.
3. Service-side option code should be auto-generated when not explicitly required in UI.
4. Advanced JSON settings should be collapsible by default ("Advanced settings").
5. Keep labels and helper copy clear enough for non-technical content managers.
6. Topic list must support safe deletion with explicit confirmation.
7. Sidebar cards must gracefully handle long titles/slugs (no overflow beyond card bounds).

AI-assisted tests generation baseline:

1. Trigger from tests workspace via dedicated modal (`Создать тест с ИИ`).
2. Flow is two-phase: generate preview -> commit via transactional backend endpoint.
3. Transactional create endpoint: `POST /admin/tests/ai/create` (topic + draft + questions in one transaction).
4. Model selector must show only models with structured-output capability.

Built-in prof-orientation v3+ baseline:

1. Runtime methodology data must come from the committed fixture at
   `server/src/tests/prof-orientation-v3-plus/site-config.json`; do not read from
   the external `Методика теста + вопросы` package at runtime.
2. Admin import endpoint:
   `POST /admin/tests/methodologies/prof-orientation-v3-plus/import`.
3. Each import creates a new draft Polus-compatible topic with a unique slug/title,
   10 `MULTI_CHOICE` questions, 11 `SLIDER` questions,
   `scoringKind = PROF_ORIENTATION_V3_PLUS`, and full `scoringConfig`.
4. Built-in methodology LLM enrichment must use the analysis prompt version
   selected on the test topic. Seed the built-in prompt with
   `deepseek/deepseek-v4-flash` only when no published built-in prompt version
   exists yet.
5. Public multi-choice UI must enforce `settings.maxChoices`.
6. For this scoring kind, `finishSession` must store deterministic algorithm
   analysis as `READY` before LLM enrichment starts.
7. LLM enrichment writes only to `summary.llm`; it must not mutate deterministic
   direction, score, confidence, profile, or profession fields.
8. Prof-orientation OpenRouter calls may use
   `OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS` and
   `OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES`; retries are allowed only for
   `OpenRouter request timeout` and must stay capped at 2.
9. Polus result UI should merge LLM explanations into existing methodology blocks
   and avoid exposing raw method internals to students.
10. Detailed contract: `docs/2026-05-19-prof-orientation-v3-plus.md`.

## Admin Public Links + Stats Contract (Current Branch)

Routes and ownership:

- `"/admin/public-links"` -> link lifecycle workspace
- `"/admin/public-links/stats"` -> dedicated statistics workspace
- Admin shell navigation must keep links/stats as separate menu entries.

Behavior baseline:

1. Public link lifecycle is `create/regenerate/archive/restore`.
2. Archive must disable student access without deleting historical attempts/results.
3. Stats page is table-first (avoid oversized decorative summary blocks above core filters/table).
4. Filters must support both test and public link selection.
5. Link labels in selectors should use business copy (`тестов пройдено`).
6. Student row actions must provide direct access to analysis and answers.
7. Public links have a public template:
   - `STANDARD` -> current public template; default for existing rows and new links unless explicitly changed.
   - `POLUS` -> branded Polus public template; selected during public-link creation only.
8. Public link DTOs and responses must expose `publicTemplate` through admin link lists, public link access, session state, and result fetches without changing `/t/*` routes.
9. Public links have an entry profile mode:
   - `DEMOGRAPHIC` -> collect gender, age, residence, and education level before the test; force `maxAttemptsPerStudent = 1`.
   - `EDUCATION` -> collect the current education-based profile before the test.
   - `EDUCATION_DEMOGRAPHIC` -> collect education fields plus the demographic questionnaire before the test; use education attempt/resume behavior.
10. Stats tables and attempt details must display the correct profile type without assuming education fields are always present.

## Public Student UX Contract (`/t/*`)

Target routes:

- `"/t/:code"` -> entry form
- `"/t/:code/session/:sessionToken"` -> run workspace
- `"/t/:code/result/:sessionToken"` -> result workspace

Security model:

- Public session/result URLs are bearer-style links: anyone with a valid `sessionToken`
  can open the active session or final result until normal session/link rules block access.
- Do not log, display, or send public session/result URLs outside the student-facing flow.
- Public result DTOs must expose only student-safe analysis fields: status, provider mode,
  generated timestamp, safe summary blocks, and user-facing error text.
- Raw provider output, prompts, scoring internals, and debug-only fields belong only in
  admin/internal DTOs protected by admin guards.

UI/theming rules:

1. All public pages must be wrapped by `PublicThemeLayout` (`client/src/widgets/public-test-workspace/ui/public-theme-layout.tsx`).
2. Scoped theme tokens are defined in `client/src/features/tests/ui/public-theme.css` under `.theme-public`.
3. Do not place public-theme tokens in global `client/src/app/index.css`.
4. Do not leak technical statuses to students (for example `IN_PROGRESS` badge in the run header).
5. Analysis status in result screen must be humanized (`готов`, `в обработке`, `ошибка`).
6. Entry page should remain center-composed with mobile-safe layout (no horizontal overflow).
7. Entry/run/result pages must branch by the link `publicTemplate` without changing public routes:
   - `STANDARD` preserves the existing public components.
   - `POLUS` uses public shell components under `client/src/widgets/public-test-workspace/ui/polus/*`; shared result rendering, styles, and assets live under `client/src/features/tests/ui/polus/*`.
8. Polus styles must stay scoped through the Polus variant of `PublicThemeLayout`; Polus assets/fonts belong in the production-owned Polus public-test asset folder, not `client/public/prototypes`.
9. Entry page must branch by the link `entryProfileMode` without changing public routes:
   - `DEMOGRAPHIC` shows the demographic profile form.
   - `EDUCATION` shows the education profile form.
   - `EDUCATION_DEMOGRAPHIC` shows education fields plus the demographic questionnaire; Polus hybrid entry includes name, surname initial, and patronymic initial.

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

1. Core lint/test/build commands must pass during implementation loops:
   ```powershell
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
   This is the release-level gate: Prisma generation/sync, OpenAPI/API client generation, architecture checks, maintainability, lint, server unit/e2e tests, client Vitest, server/client builds, smoke checks, `format:check`, `audit:all`, and critical browser e2e.
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

1. Fast local gate (no DB reset, no Orval/client API regeneration):
   ```powershell
   npm run verify:local
   ```
2. Full template gate (release-level):
   ```powershell
   npm run verify:template
   ```

`verify:local` is the default loop for daily implementation. It regenerates only the ignored backend
OpenAPI contract (`server/openapi.json`) before architecture checks; it does not regenerate the
Orval client or run client Vitest.
`verify:template` is mandatory before finalizing branch state. It regenerates the Orval client and
runs client Vitest as part of the release-level gate.

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
- Every declared `publicRoutes` entry must be wired in `client/src/app/App.tsx`.
- Every generated API directory outside feature names (for example `tests-public`) must be declared in `generatedApiDirs`.
- `npm run verify:architecture` fails if any of these constraints are broken.
- It also fails on stale architecture artifacts not declared in manifest (extra backend feature modules, extra non-auth feature/page directories, stale generated API directories, unexpected routes in App routing).
