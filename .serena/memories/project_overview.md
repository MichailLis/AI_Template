# Project Overview

- Name: `fullstack-project` (workspace `AI_Template`).
- Purpose: Minimal fullstack template for AI-assisted feature delivery with strict architecture guardrails and reproducible verification pipeline.
- Current branch state:
  - Auth flow is fully wired (`/auth/signup`, `/auth/signin`, `/auth/logout`, `/auth/refresh`).
  - Frontend exposes `/login` plus protected admin workspace `/admin`.
  - Admin includes users management and Prompt Studio foundation (`/admin/prompts`).
- Final template target is still auth-only baseline; temporary business modules can be removed when preparing final baseline branch.

## Stack
- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT auth, Swagger, `nestjs-zod`.
- Frontend: React 19 + Vite, TanStack Query, Orval-generated API hooks, Zustand, Tailwind/shadcn.
- Infra: Docker Compose (`postgres`, `adminer`).

## Source of truth
- `template/features.manifest.json` controls required auth routes and feature inventory.
- Current manifest includes feature `admin`.
- `verify:architecture` enforces manifest-driven consistency for backend modules, routes, schemas, models, and generated API folders.

## Prompt Studio foundation (current branch)
- Backend proxy endpoints:
  - `GET /admin/prompts/models` (OpenRouter model catalog)
  - `POST /admin/prompts/generate` (generation proxy)
- OpenRouter key is backend-only (`OPENROUTER_API_KEY` in `server/.env`), never exposed in frontend.
- Frontend page: `client/src/pages/admin/admin-prompts-page.tsx`.
- UI currently supports model search/filter (`all/free/paid`), free-safe default, response format switch (`text/json`), prompt variables editor, and simulation log.

## Quality gates
- Primary gate: `npm run verify:template`.
- Gate includes: prisma generate/push, API mutator guard, OpenAPI + Orval generation, strict architecture check, lint, server unit/e2e tests, server/client build, smoke checks.