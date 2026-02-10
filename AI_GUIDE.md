# AI Agent Programming Guide - Fullstack Base Project

This template is a minimal, stable base for AI-driven development.

Target template baseline:
- Auth flow (`/auth/signup`, `/auth/signin`, `/auth/logout`, `/auth/refresh`)
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
2. Implement UI in `features/*` and page in `pages/*` using generated hooks.
3. Use `shared/api/schemas.ts` for client form validation schemas.

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
     - `client/src/pages/dashboard.tsx`
4. Guardrails:
   - Update `template/features.manifest.json`
   - Run `npm run verify:template`
5. Final template cleanup:
   - Remove temporary module files and wiring
   - Remove feature entry from manifest
   - Run `npm run verify:template` again

## Stability Rules
1. Lint/build must pass on both apps:
   ```powershell
   npm run lint
   npm run build --prefix server
   npm run build --prefix client
   ```
2. End-to-end template verification must pass:
   ```powershell
   npm run verify:template
   ```
   This includes `verify:architecture` against `template/features.manifest.json`.
3. Do not keep dead feature files/routes in the template.
4. Keep auth flow always working while adding/removing features.
5. Use `import type` for type-only imports.
6. Keep server error format unified:
   ```json
   { "success": false, "error": { "code": "...", "message": "..." } }
   ```

## Generator Status
- Backend resource generator is available via `npm run gen:nest <name>`.
- Fullstack feature generator (backend + frontend + route wiring in one command) is not implemented yet and should be designed separately.

## Architecture Source of Truth
- Feature inventory is declared in `template/features.manifest.json`.
- In final template state, `features` can be empty (auth-only baseline).
- Every declared feature must have:
  - backend module/controller/service/DTO files
  - frontend page + create form
  - generated API file from Orval
  - route wiring in `client/src/app/App.tsx` and `client/src/pages/dashboard.tsx`
- `npm run verify:architecture` fails if any of these constraints are broken.
