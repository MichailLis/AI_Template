# AI Template: career guidance and testing platform

Fullstack product (NestJS + React + Prisma) for running tests and career-guidance assessments with
AI-enriched analysis. Students pass tests through public links; admins manage everything in `/admin`.

## What it does

- **Tests:** topics, draft/publish versions, four question types, AI-assisted test creation, built-in prof-orientation v3+ methodology.
- **Public links:** students open `/t/<code>` with no account; two templates (`STANDARD` with a branding constructor, `POLUS`), autosave, a safe result page.
- **AI analysis:** any OpenAI-compatible provider (Polza.ai by default, OpenRouter, others), set in the admin panel; Prompt Studio for prompts.
- **Analytics:** per-link attempts table and summary report with XLSX/PDF export.
- **Admin:** users, light/dark theme, audit log, database backups and restore from `/admin/settings`.

Details: [`docs/product-reference.md`](docs/product-reference.md).

## Quick Start

```powershell
docker compose up -d
```

| Service  | URL                         |
| -------- | --------------------------- |
| Frontend | `http://localhost:5173`     |
| Backend  | `http://localhost:3000`     |
| Swagger  | `http://localhost:3000/api` |
| Adminer  | `http://localhost:8080`     |
| Postgres | `localhost:5432`            |

There is no public signup: the first admin comes from the seed (`npm run prisma:seed`), later
accounts are created in `/admin/users`. Set `AI_API_KEY` (copy `.env.example` to `.env`) or enter
the provider in `/admin/settings` to enable AI features.

After `server/docker/dev.Dockerfile` changes, rebuild with `docker compose up -d --build backend`.
Running on the host or in a dev container: [`docs/development.md`](docs/development.md).

## Stack

- Backend: NestJS 11, Prisma 7, PostgreSQL, nestjs-zod, Swagger
- Frontend: React 19, Vite, TanStack Query, Orval, Zustand, Tailwind 4, shadcn/ui
- Infra: Docker Compose (`frontend`, `backend`, `postgres`, `adminer`)

## Branches

| Branch               | What it is                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`               | Source of truth: all development lands here through pull requests. This README describes `main`.                                                      |
| `prod`               | Snapshot of `main` at the moment the Docker Hub images were published. Behind `main` until the next release.                                          |
| `prod_ready`         | Deploy bundle only (`docker-compose.deploy.yml`, `.env.deploy.example`, database backup/restore scripts, server instructions). No application source. |
| `auth-only-baseline` | Frozen February 2026 auth-only template (login and nothing else). Kept as a reference, not updated.                                                   |

## Production

Images `morro665065/ai-template-backend:prod` and `morro665065/ai-template-frontend:prod` (no
`latest` tag). The frontend image serves the SPA through Nginx and proxies `/api/*`; Adminer is
published on `127.0.0.1` only; sign-in is limited to 10 attempts per minute per IP. Install,
update with a database copy first, rollback and backups:
[`docs/deployment-dockerhub.md`](docs/deployment-dockerhub.md).

## Quality Gates

```powershell
npm run verify:local      # daily loop, needs PostgreSQL
npm run verify:template   # release gate, run before finalizing a branch
```

Use `AGENTS.md` as the rule body for agents and `AI_GUIDE.md` as its long-form reference. Step-by-step
checks, the new-feature pipeline and the PR checklist: [`docs/development.md`](docs/development.md).

## Documentation

- [`docs/product-reference.md`](docs/product-reference.md): auth, Prompt Studio, tests, public links, backups
- [`docs/development.md`](docs/development.md): local setup, feature workflow, gates, architecture guardrails
- [`docs/deployment-dockerhub.md`](docs/deployment-dockerhub.md): deployment, update, rollback
- [`docs/agent-tooling.md`](docs/agent-tooling.md): agent tools used on this project
- [`docs/ux-glossary.md`](docs/ux-glossary.md): canonical Russian UI terms
- [`RESTORE.md`](RESTORE.md): setting up a development machine from scratch
