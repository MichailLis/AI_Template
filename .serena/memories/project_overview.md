# Project Overview

- Name: `fullstack-project` (workspace `AI_Template`).
- Purpose: Minimal fullstack template for AI-assisted feature delivery with strict architectural guardrails.
- Current baseline: auth-only backend + login-only frontend route (`/login`).

## Stack
- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT auth, Swagger, `nestjs-zod`.
- Frontend: React 19 + Vite, TanStack Query, Orval-generated API hooks, Zustand, Tailwind/shadcn.
- Infra: Docker Compose (`postgres`, `adminer`).

## Source of truth
- `template/features.manifest.json` controls required auth routes and feature inventory.
- In clean baseline: `features: []`, `auth.requiredRoutes` includes `/login`.

## Quality gates
- Primary gate: `npm run verify:template`.
- Gate includes: prisma generate/push, API mutator guard, OpenAPI + Orval generation, strict architecture check, lint, **server unit tests**, **server e2e tests**, build, smoke checks.
- `verify:architecture` now also fails on stale architecture artifacts not declared in manifest.