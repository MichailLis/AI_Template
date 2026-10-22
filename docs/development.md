# Development guide

Moved out of the README. Rules for agents are in `AGENTS.md`; the long-form reference is `AI_GUIDE.md`.

## Local Node Development

Use Node.js 24.21.0 LTS (see `.nvmrc`) and npm 11.19.0 for the root, client, and
server packages. Docker uses `node:24.21.0-bookworm`, which includes this npm version.
CI pins checkout 7.0.1, setup-node 7.0.0, and cache 6.0.0; self-hosted runners need
Actions Runner 2.327.1 or later (2.329.0 for authenticated Git inside container actions).

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

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- Postgres: `localhost:5432`
- Adminer: `http://localhost:8080`

These are the same host ports the root compose stack uses, so stop its `frontend` and `backend`
containers before starting the dev container.

## Required Workflow for New Features

Classify the change first (`AI_GUIDE.md`, "Phase 0: Feature Ownership Classification"). Most work
extends an existing feature and skips the generator in step 3.

1. Update DB schema (`server/prisma/schema.prisma`)
2. Run:

```powershell
npm run prisma:generate
npm run prisma:push
```

Then add the matching checked-in migration (`AI_GUIDE.md`, "Phase 1: Data Modeling");
`verify:local` and `verify:template` fail without it.

3. For a `new-feature` only, scaffold the backend resource:

```powershell
npm run gen:nest <name>
```

4. Implement real DTO/controller/service logic (replace scaffold placeholders)
5. Regenerate frontend hooks:

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

`verify:local` is the default daily development loop.
`verify:template` is the release-level full pipeline, including Prisma sync, API regeneration,
architecture/smoke checks, server tests, client Vitest, formatting, dependency audit, and critical
browser flows.

`verify:template` also enforces architecture consistency via `template/features.manifest.json`.

Prisma migration note:

- If `server/prisma/schema.prisma` changed, the branch must include the matching checked-in migration under `server/prisma/migrations`. `AI_GUIDE.md` ("Phase 1: Data Modeling") has the command that generates it.
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
- `verify:architecture` is strict: it checks route/module consistency, required schemas/models, and fails on stale feature folders/generated API directories that are not declared in manifest.
- Declared `publicRoutes` must be present in `client/src/app/App.tsx`.
- Generated API directories that do not match feature names (for example `tests-public`) must be declared in `generatedApiDirs`.

Frontend strict FSD contract:

- layer order: `app -> pages -> widgets -> features -> entities -> shared`
- imports are allowed only down this chain
- cross-slice imports should use public API (`index.ts`) for `widgets/features/entities`
- page files must stay thin (route composition, no heavy domain logic)
- `template/fsd.rules.json` is in `mode: "strict"`; transition bypass lists should stay empty
