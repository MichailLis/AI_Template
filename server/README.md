# AI Template Server

NestJS backend for the AI Template product workspace.

## Stack

- NestJS 11
- Prisma 7 + PostgreSQL
- Passport/JWT auth
- `nestjs-zod` DTO validation
- Swagger/OpenAPI generation
- OpenRouter integration through a backend-only module
- Jest unit/e2e tests

## Runtime

Normal local startup is managed from the repository root with the root `docker-compose.yml`:

```powershell
docker compose up -d
```

The backend container serves Nest on `http://localhost:3000` and Swagger on `http://localhost:3000/api`.

For host-only development inside `server/`:

```powershell
npm ci
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

Useful server commands:

```powershell
npm run prisma:generate
npm run prisma:push
npm run openapi:generate
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Environment

Local host development uses `server/.env`. Root Docker Compose can use root `.env` overrides. Production deployment uses `.env.deploy` with `docker-compose.deploy.yml`.

Required non-local values:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ALLOWED_ORIGINS`

OpenRouter variables are backend-only:

- `OPENROUTER_API_KEY`
- `OPENROUTER_DEFAULT_MODEL`
- `OPENROUTER_HTTP_REFERER`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_TIMEOUT_MS`
- `OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS`
- `OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES`

Do not expose `OPENROUTER_API_KEY` through frontend/Vite env.

## Domain Modules

- `auth` — signup/signin/logout/refresh. Access token is returned in the JSON body; refresh token is stored in an `HttpOnly` cookie.
- `admin` — admin shell APIs, users, and settings.
- `app-settings` — persisted system settings such as profession atlas URL.
- `analysis-prompts` — Prompt Studio lifecycle, model proxy, generation, and simulation endpoints.
- `openrouter` — integration-owned OpenRouter API client/key resolution.
- `tests` — tests authoring, public links, education organizations, public sessions, analytics, exports, and prof-orientation v3+ methodology.

## Public Test API Highlights

Public student API lives under `/tests/public/*` and powers frontend `/t/*` routes.

Current contract highlights:

- Public links expose `entryProfileMode`, `publicTemplate`, and optional `publicBranding`.
- `STANDARD` public pages can apply `publicBranding` from `TestPublicLink.publicBranding`.
- `POLUS` public pages use dedicated scoped assets/styles and ignore the STANDARD branding config.
- Public run answers can be saved before finish; the frontend autosaves with debounce and waits for in-flight saves before final submit.
- Public results include student-safe analysis fields and optional `professionAtlasUrl`.

Admin analytics endpoints:

- `GET /admin/tests/topics/:topicId/analytics/summary`
- `GET /admin/tests/topics/:topicId/analytics/export.xlsx`
- `GET /admin/tests/topics/:topicId/analytics/export.pdf`

## Prisma And OpenAPI Workflow

Local schema sync:

```powershell
npm run prisma:generate
npm run prisma:push
```

Production deployment uses checked-in Prisma migrations and runs:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

Before release/Docker image publication when `server/prisma/schema.prisma` changes, verify that the matching migration exists and run the root gate:

```powershell
npm run verify:prisma-migrations
```

OpenAPI generation:

```powershell
npm run openapi:generate
```

Root `npm run gen:api` runs server OpenAPI generation and then regenerates the frontend Orval client.

## Deployment Docs

- Docker Hub deployment: `../docs/deployment-dockerhub.md`
- Server-admin checklist: `../docs/server-admin-deploy.md`
- Repository implementation rules: `../AI_GUIDE.md`

## Verification

Common server checks:

```powershell
npm run lint
npm run test
npm run test:e2e
npm run build
```

Root gates:

```powershell
npm run verify:local
npm run verify:template
```
