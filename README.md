# Fullstack AI Template (NestJS + React + Prisma)

Strict fullstack product template for AI-assisted feature delivery.

Current project state:

- Auth is fully wired: access token in response body, refresh token in an `HttpOnly` cookie
- Admin feature is enabled on this branch (`/admin`) with users management, Prompt Studio, Tests module, analytics, and settings workspaces
- `/admin` redirects into the real tests workspace; the old mock overview page is removed
- Public links admin flow is split into dedicated pages (`/admin/public-links`, `/admin/public-links/stats`)
- Public student flow (`/t/*`) is product-ready, supports selectable public templates, selectable entry profile modes, `STANDARD` public branding, autosave, and scoped themes isolated from admin screens
- Strict template guardrails remain enforced through `AI_GUIDE.md`, `template/features.manifest.json`, `template/fsd.rules.json`, and `scripts/verify-architecture.mjs`

## Stack

- Backend: NestJS, Prisma 7, PostgreSQL, nestjs-zod, Swagger
- Frontend: React 19, Vite, TanStack Query, Orval, Zustand, Tailwind, shadcn/ui
- Infra: Docker Compose (`frontend`, `backend`, `postgres`, `adminer`)

## Quick Start

1. Start the full Docker stack:

```powershell
docker compose up -d
```

2. Open the app:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- Adminer: `http://localhost:8080`
- Postgres: `localhost:5432`

The `backend` container restores server dependencies with `npm ci`, generates Prisma client, syncs the schema, and starts Nest in watch mode.
The `frontend` container restores client dependencies with `npm ci` and starts Vite.

Useful commands:

```powershell
docker compose logs -f backend frontend
docker compose down
```

## Production Docker Hub Deployment

Production deployment uses separate Docker Hub images for backend and frontend. The frontend
image includes Nginx, serves the React SPA, and proxies `/api/*` to the backend container.

See [`docs/deployment-dockerhub.md`](docs/deployment-dockerhub.md) for build, push, and
Linux/Windows deployment commands.

## Local Node Development

If you intentionally want to run the apps on the host instead of Docker:

```powershell
npm ci
npm run install:all
docker compose up -d postgres adminer
npm run prisma:generate
npm run prisma:push
npm run dev
```

## Dev Container

The dev container is only for VS Code "Dev Containers: Reopen in Container".
Do not use it as the normal project Docker runtime.

1. Open the repository in a dev container (VS Code: "Dev Containers: Reopen in Container").
2. Install dependencies in the container:

```powershell
npm ci
npm run install:all
```

3. Start frontend and backend from the workspace container:

```powershell
npm run dev:container
```

Exposed URLs from host:

- Frontend: `http://localhost:55173`
- Backend: `http://localhost:53000`
- Swagger: `http://localhost:53000/api`
- Postgres: `localhost:55432`
- Adminer: `http://localhost:58080`

Current UI note:

- This branch exposes `/login` and a protected admin workspace under `/admin`.
- `/admin` redirects to `/admin/tests`; there is no separate mock dashboard/overview page.
- Signup is available as backend API (`POST /auth/signup`) and can be tested via Swagger.
- Admin UI copy for active business screens is currently Russian-localized for manual QA convenience.

## Auth Session Contract

- `POST /auth/signup` and `POST /auth/signin` return `accessToken` and `user` in the JSON body.
- The refresh token is set only as an `HttpOnly` cookie named `refreshToken`.
- `POST /auth/refresh` reads the refresh cookie and returns a new `accessToken`; it does not return a refresh token in the response body.
- Browser refresh handling lives in `client/src/shared/api/interceptors.ts`; generated API code and `client/src/shared/api/api.ts` must not read browser storage directly.

## Prompt Studio (OpenRouter Foundation)

Prompt Studio is available at `"/admin/prompts"` and currently includes:

- model catalog loaded from OpenRouter (`all/free/paid` filter + search)
- safe default to free models when available
- prompt editor with line numbers
- editable test variables (add/remove) with duplicate-key validation
- prompt simulation area with test source selector, selected question preview, run history, metrics, and JSON view
- response format switch (`text` / `json`)
- strict structured JSON support for generation (`response_format: json_schema`) when schema is provided
- provider parameter strictness support (`provider.require_parameters`) for schema-compatible routing
- optional response-healing plugin support for malformed JSON repair

Required backend environment variables:

- Local host development: copy `server/.env.example` to `server/.env`.
- Root Docker Compose: copy `.env.example` to `.env` or export the variables in the shell.

```env
OPENROUTER_API_KEY=
# optional
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

Security note:

- Never expose OpenRouter API key in frontend code.
- If a real OpenRouter key is ever printed, committed, or shared through `docker compose config`, rotate it in OpenRouter before reuse.
- All OpenRouter requests must go through backend (`/admin/prompts/*`).

## Tests Module (Draft/Publish Baseline)

Tests workspace is available at `"/admin/tests"` and currently includes:

- topic management with slug + description
- topic deletion with confirmation (removes topic versions/questions cascade)
- version model with one active draft and optional published snapshot
- draft editor with question CRUD
- question types: `OPEN_TEXT`, `SINGLE_CHOICE`, `MULTI_CHOICE`, `SLIDER`
- publish flow: current draft -> published, then auto-create next draft copy
- drag-and-drop reorder with backend validation and user-facing recovery messaging
- AI-assisted test creation modal (generate questions -> preview -> transactional create)
- built-in prof-orientation v3+ import for the Polus template
  (`POST /admin/tests/methodologies/prof-orientation-v3-plus/import`)
- analytics report page at `"/admin/analytics"` with filters and XLSX/PDF export

Current UX baseline for question editing:

- add/edit question via modal (avoids long inline page growth)
- choice options are edited with structured rows (text + integer weight), no manual service code input
- slider scale is edited with dedicated `min`, `max`, and `step` fields
- slider bands are edited with structured rows (`min`, `max`, `label`, `weight`) and must stay inside the scale
- slider range validation rejects invalid ranges such as `max <= min` or values outside the scale
- optional JSON settings stay separate from core slider scale fields and are hidden under "Advanced settings"
- test list cards in sidebar handle long titles/slugs with safe wrapping

AI generation safety rules in tests workspace:

- model picker shows only models that advertise `structured_outputs` support
- generation requests use strict JSON schema (`responseSchema.strict=true`) to constrain allowed question types
- requests do not use OpenRouter web-search plugin (`web`) or `:online` model variants

Domain constraints currently applied:

- no branching configurator yet
- no parallel drafts
- weights are `Int`

Built-in prof-orientation v3+ contract:

- runtime uses the committed fixture under
  `server/src/tests/prof-orientation-v3-plus/site-config.json`, not the external
  source package
- each import creates a new draft topic with a unique slug/title and
  `scoringKind = PROF_ORIENTATION_V3_PLUS`
- the imported draft contains 10 multi-choice methodology questions and 11 slider
  questions
- the built-in methodology prompt uses `openai/gpt-oss-120b`
- public multi-choice questions enforce `settings.maxChoices = 2`
- `finishSession` saves deterministic algorithm analysis first, then runs optional
  LLM enrichment under `summary.llm`
- LLM enrichment may explain and expand result blocks, but must not change the
  deterministic primary direction, scores, confidence, profile type, or
  professions
- prof-orientation OpenRouter calls use a longer timeout by default and retry only
  timeout failures; see `docs/2026-05-19-prof-orientation-v3-plus.md`

Analytics report contract:

- summary endpoint: `GET /admin/tests/topics/:topicId/analytics/summary`
- export endpoints: `GET /admin/tests/topics/:topicId/analytics/export.xlsx` and
  `GET /admin/tests/topics/:topicId/analytics/export.pdf`
- filters include scope, public link, link status, and date range
- XLSX/PDF exports are binary responses generated by the backend; the frontend downloads them from the analytics workspace

## Public Links and Student Flow (Current Branch)

Admin routes:

- `"/admin/public-links"`: create/manage public links for tests
- `"/admin/public-links/stats"`: dedicated statistics workspace with table-first layout

Admin capabilities baseline:

- archive/restore lifecycle for public links (archive disables access without losing historical data)
- public template selection for new public links:
  - `STANDARD`: current public template and the default for old and new links
  - `POLUS`: branded Polus public template
- `STANDARD` public links can be customized with the branding constructor:
  - background: default, solid color, or HTTPS image URL with overlay
  - up to two HTTPS header logos with alt text and size
  - primary button colors, card/surface colors, and accent color
  - "Reset to standard" clears `publicBranding`
  - the constructor is not shown for `POLUS` links
- entry profile mode selection for new public links:
  - `DEMOGRAPHIC`: demographic profile before the test, with attempt limit forced to `1`
  - `EDUCATION`: current education-based profile before the test
  - `EDUCATION_DEMOGRAPHIC`: education profile plus demographic questionnaire before the test
- filters by test + public link on stats page
- table actions for student-level details (analysis and submitted answers)
- link selector copy uses business language (`тестов пройдено`)

Admin settings:

- `/admin/settings` shows OpenRouter key status from backend-only configuration.
- `/admin/settings` also manages the optional profession atlas URL.
- When configured, public and admin attempt result views can show the profession atlas link for prof-orientation results.

Public student routes:

- `"/t/:code"`: registration/entry screen, branched by public link template and entry profile mode
- `"/t/:code/session/:sessionToken"`: test run workspace, branched by public link template
- `"/t/:code/result/:sessionToken"`: result and analysis screen, branched by public link template

Public session/result URL security model:

- `sessionToken` works as a bearer-style link token: anyone with the URL can open the
  active session or final result while the session/link remains valid.
- Do not log or share these URLs outside the student-facing flow.
- Public result responses expose only student-safe analysis fields: status, provider mode,
  generated timestamp, safe summary, and user-facing error text.
- Raw provider output, prompts, scoring internals, and debug data remain admin/internal only.

Entry profile modes:

- `DEMOGRAPHIC`: collects gender, age, residence, and education level before starting the test
- `EDUCATION`: collects the current education-based profile before starting the test
- `EDUCATION_DEMOGRAPHIC`: collects student name, surname initial, patronymic initial, age, education organization, group/class, gender, residence, and education level in Polus hybrid entry

Current public run UX:

- the run screen uses a centered question card with compact progress (`current / total` + percent)
- single-choice questions auto-advance after selection
- multi-choice, slider, and open-text questions use in-card navigation controls
- answers autosave after a short debounce; manual save and finish wait for queued/in-flight autosave before continuing
- autosave shows human-readable student copy for saving, saved, retry, and error states, not raw API internals
- question transitions are animated to reduce abrupt content jumps
- open-text answers use a higher-contrast textarea for bright screens
- slider questions show the current value with the matching label and avoid duplicate range numbers in helper copy
- Polus prof-orientation processing uses the Professor Polus thinking animation
  while LLM enrichment is pending

UI/theming contract for public pages:

- public pages must be wrapped with `PublicThemeLayout`
- public theme tokens live in `client/src/features/tests/ui/public-theme.css` (`.theme-public` scope)
- do not move public-theme tokens into global `client/src/app/index.css`
- `STANDARD` must preserve the existing public components and remains the default unless a link explicitly stores `publicTemplate = POLUS`
- `STANDARD` may apply `publicBranding` from the public link through `PublicThemeLayout`; empty branding keeps the default look
- `POLUS` public shell components live under `client/src/widgets/public-test-workspace/ui/polus/*`; shared Polus result rendering, styles, and assets live under `client/src/features/tests/ui/polus/*`
- Polus styles must stay scoped through the Polus variant of `PublicThemeLayout`; Polus ignores the `STANDARD` branding config, and assets/fonts belong in the Polus public-test asset folder, not `client/public/prototypes`
- user-facing statuses must stay human-readable (`готов`, `в обработке`, `ошибка`) and avoid raw technical states in UI (for example `IN_PROGRESS` badge)
- Detailed public branding/autosave/analytics/settings update: `docs/2026-05-27-public-test-branding-and-autosave.md`

## Required Workflow for New Features

1. Update DB schema (`server/prisma/schema.prisma`)
2. Run:

```powershell
npm run prisma:generate
npm run prisma:push
```

3. Scaffold backend resource:

```powershell
npm run gen:nest <name>
```

4. Implement real DTO/controller/service logic (replace scaffold placeholders)
5. Run backend and regenerate frontend hooks:

```powershell
npm run gen:api
```

- Works without running backend: OpenAPI is generated to `server/openapi.json` first.

6. Build UI on top of generated hooks

## AI Agent Example (Correct Process)

Illustrative example (not final template content): add `news` feature with editor UI.

1. Add Prisma model in `server/prisma/schema.prisma`.
2. Run:

```powershell
npm run prisma:generate
npm run prisma:push
```

3. Scaffold and implement backend:

```powershell
npm run gen:nest news
```

Implement controller/service/DTO with existing patterns (`createZodDto`, Swagger decorators, user-scoped queries). 4. Regenerate API hooks:

```powershell
npm run gen:api
```

5. Implement UI in `features` and `pages`, then wire the route in `client/src/app/App.tsx`.
6. Update `template/features.manifest.json`.
7. Run quality gate:

```powershell
npm run verify:template
```

8. If this was only a pipeline test, remove the temporary feature and return the manifest/routes to the current declared baseline.

## Quality Gates

Run before finalizing changes:

```powershell
npm run verify:local
npm run verify:template
```

For explicit step-by-step checks:

```powershell
npm run lint
npm run verify:prisma-migrations
npm run test --prefix server
npm run test:e2e --prefix server
npm run build --prefix server
npm run build --prefix client
npm run test:run --prefix client
npm run format:check
npm run audit:all
npm run verify:e2e:critical
npm run verify:template
```

`verify:local` is the default daily development loop. It regenerates only the ignored backend
OpenAPI contract (`server/openapi.json`) before architecture checks; it does not regenerate the
Orval client or run client Vitest.
`verify:template` is the release-level full pipeline, including Prisma sync, full API regeneration
through Orval, architecture/smoke checks, server tests, client Vitest, formatting, dependency audit,
and critical browser flows.

`verify:template` also enforces architecture consistency via `template/features.manifest.json`.

Prisma migration note:

- If `server/prisma/schema.prisma` changed, the branch must include the matching checked-in migration under `server/prisma/migrations`.
- `npm run verify:prisma-migrations` is the focused local check for schema/migration drift.
- Production releases use `prisma migrate deploy`; do not rely on `prisma db push` for production updates.

Server smoke details:

- `npm run verify:smoke:server` starts an isolated backend on `SMOKE_SERVER_PORT`/`PORT` when set, otherwise on a free local port
- if the selected isolated port is already in use, the smoke check fails instead of validating a foreign process
- set `SMOKE_SERVER_REUSE_EXISTING=1` only for explicit local reuse; then it targets `SMOKE_SERVER_PORT`, `PORT`, or `3000`
- the smoke check stops only the process it started
- the smoke check validates the Swagger document and required routes instead of relying on a fixed unrelated port

## PR-Ready Checklist

Use this before opening PR or finalizing a feature branch:

1. Data model synced (`prisma:generate` + `prisma:push` passed locally).
2. Prisma migrations aligned (`npm run verify:prisma-migrations` passed; schema changes have explicit migrations).
3. Backend implemented (module/controller/service/DTOs, no scaffold placeholders left).
4. Manifest updated (`template/features.manifest.json` matches actual files/routes).
5. API mutator contract preserved (`npm run verify:api-mutator` passed).
6. Frontend API regenerated (`npm run gen:api` passed).
7. Route/navigation wired (`App.tsx` contains declared `features` and `publicRoutes`).
8. Server tests green (`npm run test --prefix server` and `npm run test:e2e --prefix server` passed).
9. Full template pipeline green (`npm run verify:template` passed).
10. No bypasses (do not disable checks or hardcode obsolete smoke paths).

## Architecture Guardrails

- Source of truth for enabled features: `template/features.manifest.json`
- Source of truth for public student routes: `template/features.manifest.json` (`publicRoutes`)
- Source of truth for non-feature generated API dirs: `template/features.manifest.json` (`generatedApiDirs`)
- Frontend layer rules source of truth: `template/fsd.rules.json`
- Hard check command: `npm run verify:architecture`
- If a feature is added/removed, update manifest and wiring in the same change.
- In an explicit auth-only cleanup branch, keep manifest `features` empty.
- `verify:architecture` is strict: it checks route/module consistency, required schemas/models, and fails on stale feature folders/generated API directories that are not declared in manifest.
- Declared `publicRoutes` must be present in `client/src/app/App.tsx`.
- Generated API directories that do not match feature names (for example `tests-public`) must be declared in `generatedApiDirs`.
- In an explicit auth-only cleanup branch, `auth.requiredRoutes` should reflect frontend routing (currently `"/login"`).

Frontend strict FSD contract for this branch:

- layer order: `app -> pages -> widgets -> features -> entities -> shared`
- imports are allowed only down this chain
- cross-slice imports should use public API (`index.ts`) for `widgets/features/entities`
- page files must stay thin (route composition, no heavy domain logic)
- `template/fsd.rules.json` is in `mode: "strict"`; transition bypass lists should stay empty

## Notes

- Keep auth always working while evolving business features.
- Use `AI_GUIDE.md` as the source of truth for implementation rules.
