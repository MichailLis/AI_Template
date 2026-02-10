# Fullstack AI Template (NestJS + React + Prisma)

Minimal template for AI-assisted feature delivery.

Current template state:
- Auth is fully wired (JWT access/refresh)
- Final template target is auth-only (business modules are temporary during validation)

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
5. Implement UI in `features` and `pages`, wire route in `client/src/app/App.tsx`, add dashboard entry.
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
npm run build --prefix server
npm run build --prefix client
npm run verify:template
```

`verify:template` also enforces architecture consistency via `template/features.manifest.json`.

## Architecture Guardrails
- Source of truth for enabled features: `template/features.manifest.json`
- Hard check command: `npm run verify:architecture`
- If a feature is added/removed, update manifest and wiring in the same change.
- In final auth-only template state, keep manifest `features` empty.

## Notes
- Keep auth always working while evolving business features.
- Use `AI_GUIDE.md` as the source of truth for implementation rules.
