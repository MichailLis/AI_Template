# AI Agent Programming Guide - Fullstack Base Project

This template is a stable product-oriented base for AI-driven development.

Current branch baseline:

- Auth flow (`/auth/signin`, `/auth/logout`, `/auth/refresh`); there is no public signup — accounts
  are created by an admin through `POST /admin/users`
- Frontend auth UI route: `/login`
- Admin workspace, Prompt Studio, tests editor, public links, analytics, public student flow, and Polus public template

The rules every agent must follow are in `AGENTS.md`, which every agent loads in full. This guide
is the long-form reference behind it: the criteria, commands and reasons that are too long to
load into every session. It does not restate the stack, the runtime topology or the invariants.

Auth-only mode is still a supported cleanup target for a dedicated template-finalization branch. Do not remove current business modules from this branch unless the task explicitly asks to return to auth-only.

## Docker Runtime Contract

The runtime contract is Node.js 24.21.0 LTS with npm 11.19.0, pinned in `.nvmrc`,
all three package manifests, CI, and the Node Docker images. The official Node image
includes npm 11.19.0; use `npm ci` with the committed lockfiles. The optional VS Code
workspace uses the supported `javascript-node:5.2.1-24-bookworm` devcontainer image.

Startup, the four containers and the rule about the devcontainer compose file are in
`AGENTS.md`, "Runtime".

Runtime security defaults:

- Local development may use the root compose defaults and local JWT/database placeholders.
- Non-local `NODE_ENV` values must provide non-placeholder `DATABASE_URL`,
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and explicit `CORS_ALLOWED_ORIGINS`.
- `CORS_ALLOWED_ORIGINS` is a comma-separated list of frontend origins. Do not use
  wildcard origins with credentialed auth cookies.

The devcontainer compose file creates a single `workspace` container that runs frontend and
backend together; that is why it is not the project runtime topology.

### AI Provider Configuration

The backend talks to any OpenAI-compatible API (`POST /chat/completions`, `GET /models`) through
the official `openai` SDK in `server/src/ai-provider`. The API key is backend-only and must never
reach the frontend. Prompt behaviour itself is documented in
[`docs/specs/prompt-studio.md`](docs/specs/prompt-studio.md).

```env
AI_PROVIDER=polza            # polza (default) | openrouter | openai-compatible
AI_BASE_URL=                 # empty = preset address; required for openai-compatible
AI_API_KEY=
AI_DEFAULT_MODEL="openai/gpt-4o-mini"
AI_TIMEOUT_MS=120000
AI_PROF_ORIENTATION_TIMEOUT_MS=90000
AI_PROF_ORIENTATION_TIMEOUT_RETRIES=2
OPENROUTER_HTTP_REFERER="http://localhost:5173"   # OpenRouter only
OPENROUTER_APP_NAME="AI Template Admin"           # OpenRouter only
```

| `AI_PROVIDER`       | Default `AI_BASE_URL`          | What the request carries                                         |
| ------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `polza`             | `https://polza.ai/api/v1`      | Standard Chat Completions; catalog requested with `type=chat`    |
| `openrouter`        | `https://openrouter.ai/api/v1` | Plus `provider` routing, `response-healing`, attribution headers |
| `openai-compatible` | none, `AI_BASE_URL` required   | Standard Chat Completions only                                   |

- The provider is configured in the admin panel (`/admin/settings`, tab «Интеграции»): provider,
  base URL, API key and default model. Saved values live in `app_settings` (`ai.*`) and override
  the env variables below; the key is stored AES-256-GCM encrypted with a key derived from
  `JWT_REFRESH_SECRET` and is never returned by the API (only a masked value). Rotating
  `JWT_REFRESH_SECRET` makes the saved key unreadable: it is then treated as unset (the env key
  applies) and must be entered again. Changes are written to the audit journal without the key.
  Without saved settings the env variables below are used, which suits first deployment.
- Switching provider by env: set `AI_PROVIDER`, `AI_API_KEY` and, for any
  other service, `AI_BASE_URL`. Model ids saved in prompt versions are provider-specific; when a
  saved id is missing from the new catalog, analysis falls back to the catalog default model.
- OpenRouter extensions are sent only to `openrouter`: a strict OpenAI-compatible service answers
  400 to unknown fields.
- The model catalog keeps models that report structured output support (`response_format`, and
  for OpenRouter also `structured_outputs`). A catalog that reports no capabilities at all keeps
  every model; the request itself then decides.
- Legacy names: with `AI_PROVIDER` and `AI_API_KEY` unset, a set `OPENROUTER_API_KEY` selects
  `openrouter`, and `OPENROUTER_DEFAULT_MODEL`, `OPENROUTER_TIMEOUT_MS`,
  `OPENROUTER_PROF_ORIENTATION_TIMEOUT_*` are read as fallbacks, so an environment configured
  before `AI_*` keeps working unchanged.

## Refactor Debt Prevention (Always-On)

Goal: avoid another large refactor wave by enforcing guardrails continuously.

1. Prefer extraction when file size grows near warning thresholds.
2. Keep pages thin (routing/composition only).
3. Keep side-effect orchestration in hooks/actions, not in JSX-heavy components.
4. Keep helpers pure and colocated with their feature/workspace.
5. If change requires broad structural edits, split into dedicated refactor commit first.

Maintainability thresholds for proactive extraction:

- Prefer splitting files before they cross ~350 lines (lint warning).
- Hard fail limits are effective lines per file, enforced by `npm run verify:maintainability`:
  client source 420, server source 700, server specs 900, repository scripts 700, client CSS 2000.
- Prefer reducer/extraction when a module accumulates more than ~14 `useState` calls.
- Treat complexity warnings as mandatory refactor candidates for the next small PR.

## Verifying A Change (Always-On)

Every rule below exists because it was violated in this repository and cost a red CI run, a
regression, or a false green. They are cheap to follow and expensive to skip.

1. **Verify from the state CI has, not the state you are in.** Your working tree accumulates
   generated artifacts — `server/openapi.json`, `client/dist`, `server/dist` — from earlier steps
   in the session. CI starts clean. Before trusting a gate you changed, delete those and run it
   again. A check that passes only because you generated something an hour ago is not a check.

   Ask `git check-ignore` which ones those are, rather than deciding by the word "generated".
   `client/src/shared/api/generated/**` and `client/src/shared/api/model/**` are produced by Orval
   and **committed**; `verify:api-mutator` reads them before `gen:api` ever runs. Deleting them to
   "start clean" breaks the gate with an `ENOENT` that looks like a repository fault and is not
   one. Generated and gitignored are different properties here.

2. **When extracting shared logic from two implementations, the extraction must match the
   authority, and you must diff it against every original.** If the server validates the same
   rule, the server is the authority and the client copy mirrors it exactly, non-obvious branches
   included. Writing a "cleaner" version silently changes behaviour for whichever caller already
   agreed with the authority.
3. **Deleting code means deleting its exports and its mentions, in the same change.** A file with
   no importers is one kind of dead code; an exported symbol nobody imports is another, and a
   scan for orphaned _files_ will not see it. Grep the documentation for the name of every script,
   command or path you remove — a guide that names a deleted command reads as an instruction.
4. **Prove a mechanical refactor by equality, not by absence of complaints.** Record the baseline
   first — error count, test count, test names — then require the number after the move to be
   _the same_, not merely small. "It builds" hides a lost test; "33 before, 33 after, same files"
   does not.
5. **Reproduce a reported failure with the system's own input before acting on it.** A claim built
   from a hand-written example can be confidently wrong about a tool that produces different input
   in reality. Run the real command, read the real arguments, then decide. This applies equally to
   findings from other agents and to your own hypotheses.
6. **Say what a number counts before you report it.** A measurement can be arithmetically right and
   still answer the wrong question. "Twelve of the thirteen files this branch touches are gone from
   `main`" means the branch is stale; the same query run over files the branch _adds_ means nothing
   at all, because a file it creates is supposed to be absent. Separate the categories, then count.
   The same applies to a green check: `MERGEABLE` says two diffs do not overlap textually, not that
   the merged result is correct. When both sides edited one file, merge locally and run the gate
   before merging for real.
7. **Editing files with a script is fine; guessing their line endings is not.** This tree is CRLF.
   Reading with `newline=''`, splitting on `\r\n` and writing with `newline='\r\n'` doubles every
   carriage return, and `$` under `re.MULTILINE` does not anchor before a `\r`, so replacements
   silently miss. Normalise to `\n` in memory, do the work, convert once on write — and prefer
   moving a block of bytes over retyping it, so Cyrillic strings and shell quoting stay out of it.

## Write-Time Guard (Hint, Not A Gate)

`scripts/claude-write-guard.mjs` runs as a Claude Code `PreToolUse` hook on every `Edit`/`Write`
(wired in `.claude/settings.json`) and can deny a write before it lands. It checks the content
being added against `scripts/lib/write-guard.mjs`, which rejects exactly four cases: editing the
generated API client (`client/src/shared/api/generated/**`, `client/src/shared/api/model/**`),
adding `window`/`localStorage`/`sessionStorage`/`import.meta` to `client/src/shared/api/api.ts`
(INV-1), direct `localStorage`/`sessionStorage` use outside `safeStorage` (INV-2), and
`z.date()`/`z.coerce.date()` in a server DTO (INV-4b).

This guard is a convenience, not a source of truth, for two reasons:

1. **Silence from the guard does not mean the write was verified.** Hooks configured in user-level
   `~/.claude/settings.json` were previously recorded as not being picked up by `--continue`/`--resume`,
   and a spawned subagent inherits that inactive state. Conversely, on 2026-09-06, the project hook
   in `.claude/settings.json` was observed active in a resumed session (`SessionStart` with
   `"source": "resume"`): an attempt to write a new file into `client/src/shared/api/generated/`
   was denied with `[generated-api-client]`, leaving no file created. A single observation refutes
   "never" without establishing "always." Silence from the guard means either "no violation found"
   or "guard did not run" — and only `npm run verify:invariants` can distinguish the two.
2. **It is deliberately conservative.** It only sees the text being added, not the whole file or
   the rest of the invariant surface, and a false positive here blocks a write outright — so it
   errs toward letting a doubtful case through rather than guessing.

`npm run verify:invariants` remains the only authoritative check for these invariants; do not
treat a clean write as proof the invariant holds, and do not skip running the gate because the
guard stayed quiet.

## Frontend Architecture Contract (Strict FSD)

The layer order and the public-API rule are in `AGENTS.md`, "Frontend architecture". What that
section does not say:

- `template/fsd.rules.json` uses `mode: "strict"`. `transition.allowLayerBypass` and
  `transition.allowDeepImports` must remain empty; a temporary bypass must be documented and
  removed before merge.
- Feature inventory and public student routes come from `template/features.manifest.json`; FSD does
  not replace manifest discipline.
- `scripts/verify-architecture.mjs` is the automated check, and any architecture change must keep
  `npm run verify:architecture` green.

## Feature Pipeline (Required Order)

### Phase 0: Feature Ownership Classification

Before any fullstack feature work, classify the task and state the classification explicitly.
Do not run `npm run gen:nest <name>` until the owning feature is clear.

Use `existing-feature-change` when the work extends an existing bounded context. This is the default
choice when the route root, Prisma models, UI workspace, and user workflow already belong to an
existing feature such as `admin`, `tests`, or `auth`.

Use `new-feature` only when the work introduces a new durable bounded context with most of these
signals:

- a new business object or process with an independent lifecycle
- a new backend module and API tag/route root
- new Prisma model ownership or a clearly separate data owner
- a new frontend slice/workspace/page instead of an addition to an existing workspace
- a new entry in `template/features.manifest.json`
- a generated API file that belongs to the new feature after `npm run gen:api`
- dedicated unit/e2e coverage for the new workflow

Examples:

- `existing-feature-change`: import questions from CSV under `/admin/tests`, export test attempts,
  add public-link statistics filters, or add settings for test publishing.
- `new-feature`: add a standalone `news` management area with its own `News` model, `/admin/news`
  route, backend module, frontend workspace, manifest entry, and tests.

Classification guardrails:

1. Prefer expanding the existing owning feature over creating a module for every button or endpoint.
2. Do not hide a truly independent domain inside `admin` or `tests` just because it is faster.
3. If table ownership is unclear, stop and ask before changing Prisma schema or scaffolding a module.
4. If a change crosses multiple bounded contexts, define the owning feature and the cross-feature
   contract before implementation.
5. Keep cross-feature public surface explicit; do not deep-import another feature's internals.

Current ownership map:

- `auth` owns authentication flow, JWT/session behavior, and `/login` frontend entrypoint.
- `admin` is an admin shell and operational workspace, not a catch-all product domain. It owns the
  admin frame, overview, users, and settings screens.
- `/admin/*` is a route namespace for protected operator UI. A page under `/admin` does not
  automatically belong to the `admin` feature.
- `tests` owns test authoring, publishing, public links, education organizations used by tests,
  attempt/session/result flows, public `/t/*` routes, and `tests` / `tests-public` generated API
  clients.
- `analysis-prompts` owns prompt lifecycle, prompt simulation, and the `/admin/prompts` operator
  workflow. Tests may reference published prompt versions through database relations/contracts, but
  must not deep-import analysis prompt internals.
- `ai-provider` is infrastructure/integration code. Feature code must not import AI provider
  utilities through another feature module; expose integration services from the integration owner.
- `audit` is the change journal, also an integration module. `admin`, `analysis-prompts`, `tests`
  and `app-settings` write events through `AuditService`; each feature serves the history of its
  own entities from its own route.
- Integration-only backend modules (`ai-provider`, `audit`) are declared in
  `template/features.manifest.json` `integrationModules`, not as feature-owned route contexts.
- `app-settings` is system configuration/infrastructure unless a task gives it an independent
  product workflow and lifecycle.

For every backend + frontend task, include this pre-implementation note in the working plan:

```text
Change classification:
Owning feature/module:
Prisma owner/model:
Route root:
Manifest impact:
Generator decision:
Verification gates:
```

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
4. Add the checked-in migration. `prisma:push` changes only your database;
   `npm run verify:prisma-migrations` (part of `verify:local` and `verify:template`) fails until
   `server/prisma/migrations` reproduces the schema. Generate the SQL from the difference between
   the committed migrations and the schema, against a disposable shadow database:

   ```powershell
   docker exec ai_template_postgres createdb -U user migration_shadow
   cd server
   $env:SHADOW_DATABASE_URL = "postgresql://user:password@localhost:5432/migration_shadow?schema=public"
   New-Item -ItemType Directory prisma/migrations/<YYYYMMDDHHMMSS>_<name>
   npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script --output prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql
   cd ..
   docker exec ai_template_postgres dropdb -U user migration_shadow
   npm run verify:prisma-migrations
   ```

   Read the generated SQL before committing it, and add any data backfill by hand. Do not use
   `prisma migrate dev` on a database that was synced with `prisma:push`: it reports drift and
   offers to reset the database.

### Phase 2: Backend API

1. For a `new-feature`, scaffold the backend module:
   ```powershell
   npm run gen:nest <name>
   ```
   For an `existing-feature-change`, intentionally skip the generator and extend the owning module.
2. Replace scaffolded placeholders with real logic when a generator was used.
3. DTO rules:
   - Use `createZodDto(...)`
   - In response DTOs, convert Prisma `Date` fields to `z.string()` for Swagger/OpenAPI compatibility
4. Controller docs:
   - Always add `@ApiOperation(...)`
   - Always add `@ApiResponse({ type: ... })`
   - For endpoints used by generated frontend clients, do not use schema-only responses as a substitute for typed DTO response declarations.

### React Query/Form Sync Rule

1. Do not mirror query data into form state via `setState` inside `useEffect`.
2. Prefer derived/effective values (`queryValue ?? localFormValue`) at render/submit boundaries.
3. If metadata must be fixed (for example link-bound organization), lock the input and submit the effective value.

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
   - If backend DTOs/controllers changed, regenerate API client before any frontend lint/build/test step.
2. Implement UI/domain composition in `widgets/*` and `features/*`; keep `pages/*` as thin route entrypoints.
3. Use `shared/api/schemas.ts` for client form validation schemas.

## Product Contracts

These describe the product built on this template rather than the template itself. Read the one
you are touching; do not load them all up front.

- [`docs/specs/prompt-studio.md`](docs/specs/prompt-studio.md) — working on `/admin/prompts`, prompt versioning, or AI provider calls.
- [`docs/specs/tests-module.md`](docs/specs/tests-module.md) — working on test authoring, publishing, or the built-in prof-orientation methodology.
- [`docs/specs/public-links-and-stats.md`](docs/specs/public-links-and-stats.md) — working on `/admin/public-links` or its statistics workspace.
- [`docs/specs/public-student-ux.md`](docs/specs/public-student-ux.md) — working on the public `/t/*` routes, public theming, or the Polus template.

## Stability Rules

The invariants themselves are in `AGENTS.md`, "Non-obvious invariants". This section adds what is
not there.

1. **What the release gate runs.** `npm run verify:template`: Prisma generation/sync, OpenAPI/API
   client generation, architecture checks, maintainability, typecheck, lint, server unit/e2e tests,
   client Vitest, server/client builds, smoke checks, `format:check`, `audit:all`, and critical
   browser e2e.
2. **Why `typecheck` is not redundant with the server build.** `nest build` compiles through
   `server/tsconfig.build.json`, which excludes `**/*spec.ts`, so the server specs are the one part
   of the tree no other gate ever compiles. Type errors accumulate there silently while every check
   stays green — thirty-three of them had, before the gate was added. `npm run typecheck` runs
   `tsc --noEmit` over `server/tsconfig.json`, which includes them.
3. Do not keep dead feature files/routes in the template.
4. Keep auth flow always working while adding/removing features.
5. **The API mutator contract in full** (enforced by `npm run verify:api-mutator`):
   - `client/src/shared/api/api.ts` must export `customInstance`, default `api`, and
     `configureApiBaseUrl`, and must not contain `import.meta` (it causes Orval/esbuild warnings
     in the Node target).
   - `client/src/app/App.tsx` must call `configureApiBaseUrl(import.meta.env.VITE_API_URL)`,
     `configureInterceptorsRuntime(...)` and `setupInterceptors(api)`.
6. Storage goes through `safeStorage` because direct access throws "Access to storage is not
   allowed" in restricted browser contexts.
7. Runtime API discovery must validate required API routes before accepting a discovered origin
   (prevents binding to unrelated local Swagger instances).

## Local Verification Entry Points

Use these commands during local AI-agent development:

1. Fast local gate (no DB reset, no API regeneration):
   ```powershell
   npm run verify:local
   ```
2. Full template gate (release-level):
   ```powershell
   npm run verify:template
   ```
3. Scoped pre-flight over the git diff, also wired to the `pre-push` hook:
   ```powershell
   npm run verify:diff -- --run
   ```

`verify:local` is the default loop for daily implementation.
`verify:template` is mandatory before finalizing branch state.

`.husky/pre-push` runs `npm run verify:diff -- --run` on every `git push`. It checks only the
scopes the diff touches — 60 seconds on a branch of 38 changed files — and stays a pre-flight,
not a gate: `verify:template` remains the release gate, and `scripts/verify-package-scripts.mjs`
keeps `verify:diff` out of both pipelines on purpose.

`npm run doctor:agent-tooling` runs `scripts/doctor-agent-tooling.mjs` to diagnose machine-local tooling prerequisites: the RTK policy and hook exclusions, Serena, root TypeScript, TypeScript Language Server, codebase-memory, Compose naming, Orval lockfile alignment, and Prisma package alignment. Run it once when onboarding a new machine. It is a diagnostic rather than a gate and exits 0 even when it reports problems, so inspect every status line and use direct smoke tests for critical tools. `scripts/verify-package-scripts.mjs` keeps it out of both `verify:local` and `verify:template` so machine state never breaks a clean tree.
`verify:architecture` reads `server/openapi.json`, which is gitignored and regenerated rather
than committed. `npm run verify:contracts` pairs the generation with the check so neither gate
can validate a stale document: `verify:local` calls it, and `verify:template` reaches the same
state through `gen:api`, which regenerates the client as well. Run `npm run verify:contracts`
on its own after changing a controller or DTO to see the architecture result without paying
for the full loop.
`npm run verify:invariants` runs `scripts/verify-invariants.mjs` to check non-obvious architecture invariants (handler Swagger completeness, no `z.date()` in DTOs, storage discipline, unified error shape, public DTO safety, no React Query state mirroring).
`npm run verify:paired-rules` runs `scripts/verify-paired-rules.mjs` to ensure paired implementations and constants across client and server remain synchronized against `template/paired-rules.json` and `template/paired-rules.vectors.json`.
`npm run verify:stack` runs `scripts/verify-stack.mjs` to compare the three `package.json` files with `template/stack.json`, which declares the allowed major of each stack package (NestJS, Prisma, React, Vite, Tailwind, Orval, Zustand, TanStack Query). A major bump or the removal of a stack library fails until the declaration is changed in the same, separately approved, change.
`npm run verify:ai-guide` also checks `template/agent-rules.json`: every rule listed there must still be present in `AGENTS.md`, the rule body every agent loads, and `CLAUDE.md` must import it. The two files together must stay inside the always-loaded size budget. Rewording a rule out of those files turns the gate red; to retire a rule, change the registry on purpose.
`npm run verify:gates` runs `scripts/verify-gates.mjs` to verify via in-memory mutation testing that repository verification gates detect real invariant violations and maintain full gate coverage. It first runs every gate on the unmutated tree and stops if one is red or cannot be started: a mutation counts as caught only when a gate that was green, and did run, exits non-zero.
`npm run verify:diff` runs `scripts/verify-diff.mjs` as an auxiliary fast pre-flight over changed scopes. Without `--run` it runs only its guards (CRLF corruption, Orval line-ending noise) and prints the plan; `npm run verify:diff -- --run` executes the planned checks. It is not a gate and does not replace `verify:local` or the release gate `verify:template`.
`npm run find:symbol -- <name>` runs `scripts/find-symbol.mjs` to check whether a symbol name is unique across `client/src`, `server/src`, and `scripts`, warn on client/server drift, detect candidate unused exports, and route to Serena or `rg`.
`npm run audit:explain [-- --base <ref>]` runs `scripts/audit-explain.mjs` to split the vulnerabilities npm reports into the ones this branch introduced, inherited, and fixed, per lock file; it is a diagnostic for a red `audit:all`, never a gate, so it exits 0 whatever it finds and belongs in neither `verify:local` nor `verify:template`.

## Generator Status

- Backend resource generator is available via `npm run gen:nest <name>`.
- Fullstack feature generator (backend + frontend + route wiring in one command) is not implemented yet and should be designed separately.

## Architecture Source of Truth

- Feature inventory is declared in `template/features.manifest.json`.
- Public student routes are declared in `template/features.manifest.json` under `publicRoutes`.
- Additional non-feature generated API directories are declared in `template/features.manifest.json` under `generatedApiDirs`.
- In an explicit auth-only cleanup branch, `features` can be empty and `auth.requiredRoutes` should reflect frontend routing (currently `"/login"`).
- Every declared feature must have:
  - backend module/controller/service/DTO files
  - frontend page + create form
  - generated API file from Orval
  - route wiring in `client/src/app/App.tsx`
- `backendFiles` and `frontendFiles` are **entrypoint lists, not inventories**. For a feature that
  declares `ownedRoots`, those roots define what the feature owns; the file lists name the modules,
  controllers and pages an agent should start from. `server/src/tests` alone holds more than eighty
  files and is not meant to be enumerated by hand. Keep every module and controller listed, and do
  not read a short list as evidence that the rest of the feature does not exist.
- A file belongs to exactly one feature's `frontendFiles`. Shared frames such as
  `client/src/features/admin/ui/admin-shell.tsx` stay with their owning feature; other features
  reference them without claiming them.
- Every declared `publicRoutes` entry must be wired in `client/src/app/App.tsx`.
- Every generated API directory outside feature names (for example `tests-public`) must be declared in `generatedApiDirs`.
- `npm run verify:architecture` fails if any of these constraints are broken.
- It also fails on stale architecture artifacts not declared in manifest (extra backend feature modules, extra non-auth feature/page directories, stale generated API directories, unexpected routes in App routing).
