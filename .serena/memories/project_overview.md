# AI_Template — project overview

Last verified against the repository on 2026-08-29 (branch `MichailLis/sargassum`).

A strict fullstack product template that also carries a real product: a career-orientation testing
platform with an operator admin area under `/admin` and a public student flow under `/t/*`.

## Stack

- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT via Passport, `nestjs-zod`, Swagger.
- Frontend: React 19, Vite 7, TanStack Query, Orval (API client generated from OpenAPI), Zustand,
  Tailwind 3, shadcn/ui. Strict Feature-Sliced Design.
- Infrastructure: Docker Compose with four containers — `ai_template_frontend` (5173),
  `ai_template_backend` (3000), `ai_template_postgres` (5432), `ai_template_adminer` (8080).
- Integration: OpenRouter for LLM calls, proxied through the backend only; the API key never
  reaches the frontend.

## Bounded contexts

- `auth` — authentication, JWT and session behavior, the `/login` route.
- `admin` — admin shell, users, settings. `/admin/*` is a route namespace for operator UI, not a
  claim of ownership: pages under it can belong to other features.
- `tests` — test authoring and publishing, public links, education organizations, attempt/session/
  result flows, and the public `/t/*` routes. The largest context by far.
- `analysis-prompts` — prompt lifecycle and simulation, the `/admin/prompts` workspace.
- `openrouter` — integration module, declared in the manifest under `integrationModules`.
- `app-settings` — system configuration.

## Sources of truth

`AI_GUIDE.md` for implementation rules, `CLAUDE.md` for the short form, and two machine-readable
files that the verification scripts actually enforce: `template/features.manifest.json` (feature
inventory, routes, module wiring, `publicRoutes`, `generatedApiDirs`) and `template/fsd.rules.json`
(layer rules, `mode: "strict"`). Read those two files directly rather than any prose summary.

Note that for features declaring `ownedRoots.backend`, the manifest's `backendFiles` lists
entrypoints only — `server/src/tests` alone holds well over eighty files.

## Verification

`npm run verify:local` is the daily loop and needs a running PostgreSQL. `npm run verify:template`
is the release gate. Neither may be weakened or bypassed to make a check pass.

Codex is not used in this repository.
