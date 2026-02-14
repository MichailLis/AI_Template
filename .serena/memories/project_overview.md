# Project Overview

- Name: `fullstack-project` (workspace `AI_Template`).
- Purpose: Minimal fullstack template for AI-assisted feature delivery with strict architecture guardrails and reproducible verification pipeline.
- Current branch state:
  - Auth flow is fully wired (`/auth/signup`, `/auth/signin`, `/auth/logout`, `/auth/refresh`).
  - Frontend exposes `/login` plus protected admin workspace `/admin`.
  - Admin includes users management, Prompt Studio foundation (`/admin/prompts`), and Tests workspace (`/admin/tests`).
- Final template target is still auth-only baseline; temporary business modules can be removed when preparing final baseline branch.

## Stack
- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT auth, Swagger, `nestjs-zod`.
- Frontend: React 19 + Vite, TanStack Query, Orval-generated API hooks, Zustand, Tailwind/shadcn.
- Infra: Docker Compose (`postgres`, `adminer`).

## Source of truth
- `template/features.manifest.json` controls required auth routes and feature inventory.
- Current manifest includes features `admin` and `tests`.
- `verify:architecture` enforces manifest-driven consistency for backend modules, routes, schemas, models, and generated API folders.

## Prompt Studio foundation (current branch)
- Backend proxy endpoints:
  - `GET /admin/prompts/models` (OpenRouter model catalog)
  - `POST /admin/prompts/generate` (generation proxy)
- OpenRouter key is backend-only (`OPENROUTER_API_KEY` in `server/.env`), never exposed in frontend.
- Frontend page: `client/src/pages/admin/admin-prompts-page.tsx`.
- UI currently supports model search/filter (`all/free/paid`), free-safe default, response format switch (`text/json`), prompt variables editor, and simulation log.
- Generation proxy now supports strict structured output options (`responseSchema`, `requireParameters`, `useResponseHealing`) for schema-constrained JSON responses.
- Model catalog response includes `supportsStructuredOutputs` capability flag.

## Tests module baseline (current branch)
- Backend module and DTO/controller/service live in `server/src/tests/*`.
- Versioning model: one active draft per topic + optional published version.
- Publish flow: promote draft to published and auto-create next draft copy.
- Question types: open text, single choice, multi choice, slider.
- Admin tests editor UX is modal-based for add/edit question.
- Choice options are row-based (`text`, `weight`) with service code hidden from UI.
- JSON settings are available under collapsible advanced section.
- Sidebar includes search, long-title-safe cards, and delete-topic action with confirmation.
- Drag-and-drop reorder is supported with backend reorder endpoint and validation.
- AI test generator modal is available (generate preview + transactional create via `POST /admin/tests/ai/create`).

## Quality gates
- Primary gate: `npm run verify:template`.
- Gate includes: prisma generate/push, API mutator guard, OpenAPI + Orval generation, strict architecture check, lint, server unit/e2e tests, server/client build, smoke checks.


## Public links + student flow (updated 2026-02)
- Admin public-link management is split into two routes:
  - `/admin/public-links` (create/manage/archive/restore links)
  - `/admin/public-links/stats` (table-first analytics workspace)
- Public-link archive is soft-disable, not deletion: archived links are inaccessible for students but historical sessions/results remain available.
- Stats workflow includes filter-by-test + filter-by-link and student-level actions for analysis and submitted answers.
- Selector/business copy uses wording around completed tests (`тестов пройдено`).
- Public student flow routes are: `/t/:code`, `/t/:code/session/:sessionToken`, `/t/:code/result/:sessionToken`.
- Public pages use isolated scoped theme (`PublicThemeLayout` + `.theme-public` in `public-theme.css`) so admin/login visuals are not affected.
- Student-facing UI should avoid raw technical statuses (e.g. do not expose `IN_PROGRESS` badge); use human labels (`готов`, `в обработке`, `ошибка`).
- Runtime API autodiscovery must validate required API routes before accepting discovered origin to avoid binding to unrelated local Swagger instances.
