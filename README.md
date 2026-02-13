# Fullstack AI Template (NestJS + React + Prisma)

Minimal template for AI-assisted feature delivery.

Current project state:
- Auth is fully wired (JWT access/refresh)
- Admin feature is enabled on this branch (`/admin`) with users management, Prompt Studio foundation, and Tests module workspace
- Final template target remains auth-only; business modules are temporary and can be removed when finalizing baseline

## Stack
- Backend: NestJS, Prisma 7, PostgreSQL, nestjs-zod, Swagger
- Frontend: React 19, Vite, TanStack Query, Orval, Zustand, Tailwind, shadcn/ui
- Infra: Docker Compose (`postgres`, `adminer`)

## Quick Start

1. Install dependencies:
```powershell
npm install
npm run install:all
```

2. Start database:
```powershell
docker-compose up -d
```

3. Sync Prisma schema:
```powershell
npm run prisma:generate
npm run prisma:push
```

4. Run both apps:
```powershell
npm run dev
```

URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- Adminer: `http://localhost:8080`

Current UI note:
- This branch exposes `/login` and a protected admin workspace under `/admin`.
- Signup is available as backend API (`POST /auth/signup`) and can be tested via Swagger.
- Admin UI copy for active business screens is currently Russian-localized for manual QA convenience.

## Prompt Studio (OpenRouter Foundation)

Prompt Studio is available at `"/admin/prompts"` and currently includes:
- model catalog loaded from OpenRouter (`all/free/paid` filter + search)
- safe default to free models when available
- prompt editor with line numbers
- editable test variables (add/remove) with duplicate-key validation
- response format switch (`text` / `json`)

Required backend environment variables (`server/.env`):
```env
OPENROUTER_API_KEY="sk-or-v1-..."
# optional
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
```

Security note:
- Never expose OpenRouter API key in frontend code.
- All OpenRouter requests must go through backend (`/admin/prompts/*`).

## Tests Module (Draft/Publish Baseline)

Tests workspace is available at `"/admin/tests"` and currently includes:
- topic management with slug + description
- version model with one active draft and optional published snapshot
- draft editor with question CRUD
- question types: `OPEN_TEXT`, `SINGLE_CHOICE`, `MULTI_CHOICE`, `SLIDER`
- publish flow: current draft -> published, then auto-create next draft copy

Current UX baseline for question editing:
- add/edit question via modal (avoids long inline page growth)
- choice options are edited with structured rows (text + integer weight), no manual service code input
- slider bands are edited with structured rows (`min`, `max`, `label`, `weight`)
- optional JSON settings are hidden under "Advanced settings"

Domain constraints currently applied:
- no branching configurator yet
- no parallel drafts
- weights are `Int`

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
   Implement controller/service/DTO with existing patterns (`createZodDto`, Swagger decorators, user-scoped queries).
4. Regenerate API hooks:
```powershell
npm run gen:api
```
5. Implement UI in `features` and `pages`, wire route in `client/src/app/App.tsx`, and add feature links in `client/src/pages/dashboard.tsx` (required when features are declared).
6. Update `template/features.manifest.json`.
7. Run quality gate:
```powershell
npm run verify:template
```
8. If this was only a pipeline test, remove the feature and return to auth-only baseline.

## Quality Gates

Run before finalizing changes:
```powershell
npm run lint
npm run test --prefix server
npm run test:e2e --prefix server
npm run build --prefix server
npm run build --prefix client
npm run verify:template
```

`verify:template` also enforces architecture consistency via `template/features.manifest.json` and runs mandatory server unit/e2e tests.

## PR-Ready Checklist

Use this before opening PR or finalizing a feature branch:

1. Data model synced (`prisma:generate` + `prisma:push` passed).
2. Backend implemented (module/controller/service/DTOs, no scaffold placeholders left).
3. Manifest updated (`template/features.manifest.json` matches actual files/routes).
4. API mutator contract preserved (`npm run verify:api-mutator` passed).
5. Frontend API regenerated (`npm run gen:api` passed).
6. Route/navigation wired (`App.tsx` and `client/src/pages/dashboard.tsx` contains links to declared feature routes).
7. Server tests green (`npm run test --prefix server` and `npm run test:e2e --prefix server` passed).
8. Full template pipeline green (`npm run verify:template` passed).
9. No bypasses (do not disable checks or hardcode obsolete smoke paths).

## Architecture Guardrails
- Source of truth for enabled features: `template/features.manifest.json`
- Hard check command: `npm run verify:architecture`
- If a feature is added/removed, update manifest and wiring in the same change.
- In final auth-only template state, keep manifest `features` empty.
- `verify:architecture` is strict: it checks route/module consistency, required schemas/models, and fails on stale feature folders/generated API directories that are not declared in manifest.
- When `features` is not empty, `client/src/pages/dashboard.tsx` must exist and include `to="<feature.route>"` links for declared features.
- In auth-only baseline, `auth.requiredRoutes` should reflect frontend routing (currently `"/login"`).

## Notes
- Keep auth always working while evolving business features.
- Use `AI_GUIDE.md` as the source of truth for implementation rules.
