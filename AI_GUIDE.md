# AI Agent Programming Guide - Fullstack Base Project

This template is a minimal, stable base for AI-driven development.

Target template baseline:
- Auth flow (`/auth/signup`, `/auth/signin`, `/auth/logout`, `/auth/refresh`)
- Frontend auth UI route: `/login` only
- No business modules in the final template branch (auth-only)

Note:
- Temporary feature modules can exist in feature branches for pipeline checks.
- Before finalizing template state, remove temporary modules and keep only auth.

## Tech Stack
- Backend: NestJS, Prisma 7, PostgreSQL, JWT (Passport), nestjs-zod, Swagger
- Frontend: React 19, Vite, TanStack Query, Orval, Zustand, Tailwind, shadcn/ui
- Infra: Docker Compose (Postgres + Adminer)
- Frontend architecture: FSD-style layers (`app/pages/features/entities/shared/widgets`)

## Feature Pipeline (Required Order)

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
1. Scaffold module:
   ```powershell
   npm run gen:nest <name>
   ```
2. Replace scaffolded placeholders with real logic.
3. DTO rules:
   - Use `createZodDto(...)`
   - In response DTOs, convert Prisma `Date` fields to `z.string()` for Swagger/OpenAPI compatibility
4. Controller docs:
   - Always add `@ApiOperation(...)`
   - Always add `@ApiResponse({ type: ... })`

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
2. Implement UI in `features/*` and page in `pages/*` using generated hooks.
3. Use `shared/api/schemas.ts` for client form validation schemas.

## OpenRouter Prompt Studio Foundation (Current Branch)

Current admin prompt foundation is implemented under:
- Backend: `server/src/admin/admin.controller.ts`, `server/src/admin/admin.service.ts`
- Frontend page: `client/src/pages/admin/admin-prompts-page.tsx`
- Route: `"/admin/prompts"`

Required behavior:
1. OpenRouter key is backend-only (`OPENROUTER_API_KEY` in `server/.env`).
2. Model catalog must be loaded through backend proxy (`GET /admin/prompts/models`).
3. Prompt generation must be proxied via backend (`POST /admin/prompts/generate`).
4. Frontend must never call OpenRouter directly.
5. Prefer free models by default to reduce accidental spend.
6. Prompt test variables are local UI helpers until question system is integrated.

Recommended env vars for prompt foundation:
```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
```

## Reference Example For AI Agents (Illustrative)

Example goal: implement `news` feature with editor UI (example only, not part of final auth-only template).

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
      - add feature entry point to `client/src/pages/dashboard.tsx` (required by `verify:architecture` when features are declared)
4. Guardrails:
   - Update `template/features.manifest.json`
   - Run `npm run verify:template`
5. Final template cleanup:
   - Remove temporary module files and wiring
   - Remove feature entry from manifest
   - Run `npm run verify:template` again

## Stability Rules
1. Lint/test/build must pass:
   ```powershell
   npm run lint
   npm run test --prefix server
   npm run test:e2e --prefix server
   npm run build --prefix server
   npm run build --prefix client
   ```
2. End-to-end template verification must pass:
   ```powershell
   npm run verify:template
   ```
   This includes `verify:architecture` against `template/features.manifest.json` and mandatory server unit/e2e tests.
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
     - `setupInterceptors(api)`
   - Enforced by `npm run verify:api-mutator`.
8. Keep server error format unified:
   ```json
   { "success": false, "error": { "code": "...", "message": "..." } }
   ```

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
   - `client/src/pages/dashboard.tsx` includes feature entry links for declared routes (required by `verify:architecture`).
7. **Full pipeline green**
   - `npm run test --prefix server` and `npm run test:e2e --prefix server` passed.
8. **Full pipeline green**
   - `npm run verify:template` passed with no failures.
9. **No hidden bypasses**
   - Do not disable checks, do not comment out failing logic, do not hardcode obsolete smoke paths.

## Generator Status
- Backend resource generator is available via `npm run gen:nest <name>`.
- Fullstack feature generator (backend + frontend + route wiring in one command) is not implemented yet and should be designed separately.

## Architecture Source of Truth
- Feature inventory is declared in `template/features.manifest.json`.
- In final template state, `features` can be empty (auth-only baseline).
- In auth-only frontend baseline, required auth route is `"/login"`.
- Every declared feature must have:
  - backend module/controller/service/DTO files
  - frontend page + create form
  - generated API file from Orval
  - route wiring in `client/src/app/App.tsx`
  - `client/src/pages/dashboard.tsx` must exist and include a feature entry link (`to="<feature.route>"`) for each declared feature
- `npm run verify:architecture` fails if any of these constraints are broken.
- It also fails on stale architecture artifacts not declared in manifest (extra backend feature modules, extra non-auth feature/page directories, stale generated API directories, unexpected routes in App routing).
