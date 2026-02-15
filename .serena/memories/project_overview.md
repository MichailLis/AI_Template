# Project Overview (updated 2026-02-15)

- Name: `fullstack-project` (workspace `AI_Template`).
- Purpose: stable fullstack template for AI-assisted delivery with strict architecture + verification guardrails.
- Branch currently contains active business modules (`admin`, `tests`, `public links`, `public student flow`) for product development; final auth-only baseline remains a separate cleanup target.

## Core stack
- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT/Passport, Swagger, `nestjs-zod`.
- Frontend: React 19 + Vite, TanStack Query, Orval-generated API hooks, Zustand, Tailwind/shadcn.
- Infra: Docker Compose (`postgres`, `adminer`).

## Source of truth
- `AI_GUIDE.md` is the repo-level operating contract for AI agents.
- Architecture contract: `template/features.manifest.json` + `template/fsd.rules.json` + `scripts/verify-architecture.mjs`.
- API mutator contract: `scripts/verify-api-mutator.mjs`.

## Current product capabilities
- Admin modules:
  - `/admin/users`
  - `/admin/prompts`
  - `/admin/tests`
  - `/admin/public-links`
  - `/admin/public-links/stats`
- Public student flow:
  - `/t/:code`
  - `/t/:code/session/:sessionToken`
  - `/t/:code/result/:sessionToken`

## Recent major upgrades
1. Large frontend refactor completed (decomposition into hooks/helpers/action-creators across tests/public/admin workspaces).
2. Route-level lazy loading added in `client/src/app/App.tsx` (initial bundle reduced, chunk warning removed).
3. Prisma teardown hardened (`pool.end()` on module destroy) to avoid e2e worker/open-handle instability.
4. AI-agent governance added:
   - `verify:ai-guide`
   - `verify:maintainability`
   - `verify:local`
5. Public links now support managed educational organizations:
   - Admin can create/list organizations.
   - Public link can be bound to one organization.
   - Student entry uses link-bound organization (manual typing reduced).
6. Public test completion flow hardened:
   - Finish action auto-saves current answers before finalizing session.
   - Manual "Save answers" action removed from student run bar to reduce user error.

## Quality gates
- Daily local gate: `npm run verify:local`.
- Release-level gate: `npm run verify:template`.
- Additional targeted checks used frequently:
  - `npm run verify:api-mutator`
  - `npm run verify:architecture`
  - `npm run verify:maintainability`
  - `npm run verify:smoke:server`
  - `npm run verify:smoke:client`