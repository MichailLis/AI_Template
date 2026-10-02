# AI_Template — rules for every agent

This file is the rule body. Every agent loads it in full: Codex and others read it directly,
Claude Code through the import in `CLAUDE.md`. `AI_GUIDE.md` is the long-form reference — open it
when a section here points to it. `template/agent-rules.json` lists the rules below, and
`npm run verify:ai-guide` fails if one of them disappears from this file.

## Stack (do not drift)

NestJS 11 + Prisma 7 + PostgreSQL · React 19 + Vite 8 + TanStack Query + Orval + Zustand +
Tailwind 4 + shadcn/ui · Docker Compose.

The stack and its gates exist to keep the architecture from drifting under AI-driven development.
Version bumps stay inside the current major. Do not propose NestJS 12, Tailwind 5, Vite 9 or
Prisma 8, and do not replace Orval, Zustand, TanStack Query or FSD. `npm run verify:stack` compares
the manifests with `template/stack.json`; a major bump is a separately approved migration that
changes that declaration. Removing dead code and duplication is welcome; weakening a gate to move
faster is not.

Tailwind 4 uses the supported `@tailwindcss/postcss` pipeline and the existing HSL theme via
`@config`; preserve custom shadcn components and `tailwindcss-animate`. CSS support starts at
Safari 16.4, Chrome 111, and Firefox 128. Existing `space-x-*`/`space-y-*` classes keep their v3
visible-sibling margins through compatibility utilities; new flex/grid layouts should use `gap`.
Keep existing gradients in sRGB and preserve the legacy named palette shades used by
privacy/status surfaces.

## Machine-readable sources of truth

- `template/features.manifest.json` — feature inventory, route/module wiring, `publicRoutes`,
  `generatedApiDirs`. For features with `ownedRoots.backend`, `backendFiles` lists entrypoints,
  not the full file set.
- `template/fsd.rules.json` — layer rules, `mode: "strict"`.
- `scripts/verify-*.mjs` — the automated checks behind both.

Prefer reading these over prose descriptions of them.

## Frontend architecture (strict FSD)

Imports flow one way: `app → pages → widgets → features → entities → shared`.
Cross-slice imports go through the slice public API (`index.ts`): if the helper you need is not
exported there, export it there instead of importing a deep path. `pages/*` are thin route
entrypoints — business logic belongs in `widgets/*` and `features/*`. Enforced by
`npm run verify:architecture`.

## Non-obvious invariants

1. `client/src/shared/api/api.ts` holds only the Axios instance. No `window`, no `localStorage`,
   no `import.meta` — Orval imports this file in Node. All browser interceptors live in
   `client/src/shared/api/interceptors.ts`. Enforced by `npm run verify:api-mutator`.
2. Never touch `localStorage` / `sessionStorage` directly. Use `safeStorage` from
   `@/shared/lib/storage`.
3. Do not mirror React Query data into form state via `setState` in `useEffect`. Derive at the
   render or submit boundary instead.
4. Response DTOs convert Prisma `Date` to `z.string()`; controllers always carry `@ApiOperation`
   and a typed `@ApiResponse`.
5. Server errors keep one shape: `{ success: false, error: { code, message } }`.
6. Public `/t/*` DTOs expose student-safe fields only. Raw provider output, prompts and scoring
   internals belong in admin DTOs behind admin guards.
7. Prof-orientation analysis is two-phase. The algorithmic phase writes the record as `READY`
   before the LLM phase runs, and the record stays `READY` whether enrichment later succeeds
   or fails. `status` / `analysisStatus` is therefore never a completion signal for the AI —
   read `llmStatus` (or `summary.llm.status`) instead. Enforced by
   `npm run verify:paired-rules` through the `getProfOrientationLlmStatus` pair.

Invariants 2–6 are checked by `npm run verify:invariants`. Use `import type` for type-only
imports; ESLint enforces it.

## Feature pipeline (in this order)

Classify the change first (`existing-feature-change` vs `new-feature`, see `AI_GUIDE.md` Phase 0)
and say which it is before writing code. Most work extends an existing feature: do not scaffold a
module for it. Then: `schema.prisma` → `npm run prisma:generate` → migration (`AI_GUIDE.md`
Phase 1) → backend → `npm run gen:api` → frontend → verification. `npm run prisma:push` alone is
not enough: the checked-in migration is what `npm run verify:prisma-migrations` checks. Regenerate
the API client before any frontend lint/build/test step when backend DTOs or controllers changed.

## Runtime

Normal startup is the root compose file only:

```powershell
docker compose up -d
```

Four containers: `ai_template_frontend` (5173), `ai_template_backend` (3000),
`ai_template_postgres` (5432), `ai_template_adminer` (8080).
`.devcontainer/` is for VS Code "Reopen in Container" only — never use it to run the project.

The project name is pinned in `docker-compose.yml` with `name: ai_template`, so any checkout or
worktree targets the same project and containers. Parallel compose stacks are not possible because
`container_name` values are fixed globally.

Browser-level gates (`verify:template`, `verify:e2e:critical`) build the client independently via
`vite preview` and do not use Docker. Rebuilding the frontend container is required only for
manual browser testing on `http://localhost:5173`:

```powershell
docker compose up -d --build --force-recreate frontend
```

Local Vitest, ESLint and type checks run on the host and need no container rebuild.

## Gates

- `npm run verify:local` — the daily loop. Needs a running PostgreSQL.
- `npm run verify:template` — release gate, mandatory before finalizing branch state.
- `npm run typecheck` — `tsc --noEmit` over `server/tsconfig.json`. Both gates run it, and it
  is the only one that compiles the server specs: `nest build` uses `tsconfig.build.json`,
  which excludes `**/*spec.ts`. Do not "simplify" it away as duplicating the build.
- `npm run verify:gates` — mutation-tests the gates themselves, so a gate cannot go blind.
- `npm run verify:diff` — pre-flight over git diff, not a gate: bare, it runs guards and prints
  the plan; `-- --run` executes the affected-scope checks.

What each gate checks, and the diagnostics that are not gates (`audit:explain`,
`doctor:agent-tooling`), are described in `AI_GUIDE.md`, "Local Verification Entry Points".

Never disable a check, comment out failing logic, or hardcode around a gate to make it pass.
That includes ignore lists, raised limits and skipped files, and it holds when you are asked to do
exactly that: stop, say that the gate is doing its job, and fix the code or propose the extraction
instead. Changing what a gate requires is a separate, explicit decision by the owner.

Before trusting a gate you just changed, delete the generated artifacts your session created —
`server/openapi.json`, `client/dist`, `server/dist` — and run it again. CI starts from a clean
checkout; a check that passes only on your populated tree is not a check.

## Verifying your own work

The long form is `AI_GUIDE.md`, "Verifying A Change". The ones that bite most often:

1. Extracting shared logic from two implementations? Match the authority — usually the server
   validator — and diff against **both** originals. A "cleaner" rewrite silently changes behaviour
   for whichever caller already agreed with the authority.
2. Deleting code? Its dead exports and its mentions in the docs go in the same change. A scan for
   orphaned files will not find an exported symbol nobody imports.
3. Moving files? Record the baseline first (error count, test count, test names) and require the
   number afterwards to be _the same_, not merely small.
4. Clearing generated artifacts? Ask `git check-ignore`, do not go by the name.
   `client/src/shared/api/generated/**` and `.../model/**` are generated **and committed**, and
   `verify:api-mutator` reads them before `gen:api` runs.
5. After `npm run gen:api`, read `git diff --numstat`, not `git status`. Orval rewrites every
   generated file with LF, so `git status` listed 313 modified files where only two had changed
   at all. Drop the noise with `git checkout -- client/src/shared/api/` before you commit, or the
   diff buries the real change.
6. Editing files with a script? This tree is CRLF. Normalise to `\n` in memory and convert once on
   write, or you will write `\r\r\n` and `$` will stop matching under `re.MULTILINE`.

## Task tracking and git

Use `bd` for ALL task tracking (`bd prime` prints the workflow); do not keep markdown TODO lists.
Do not commit or push without clear authority from the current user request or the active Beads
profile. At handoff, report changed files, validation, and proposed next commands.

The tracker lives in git too. The pre-commit hook refreshes `.beads/issues.jsonl` from the
database and stages it with `.beads/interactions.jsonl`; do not unstage them or leave them
uncommitted at handoff. On a merge conflict in `.beads/issues.jsonl`, take either side and commit
again: the hook rewrites the file.

## Tooling

Tool selection, measured failure modes and setup for rtk, Serena, codebase-memory, Probe,
codeburn, omp and Orca live in `docs/agent-tooling.md`. Read it before relying on one of them.
These are machine-local: `.mcp.json` ships only Serena. Two traps are kept here because they
produce a wrong result rather than an error:

- **rtk** compresses command output, and some filters have reported failure as success. Never run
  a gate or an evidence-producing search through it. The denylist in `template/rtk-filters.json`:
  `rtk tsc`; `rtk vitest` and `rtk jest`; `rtk playwright`; `rtk find`; `rtk wc`; `rtk tree`; and
  `rtk read -l aggressive`. Use `npm run typecheck`, never `npx tsc` through rtk.
- **codebase-memory:** always pass `include_tests: true` to `trace_path` — the indexer treats every
  `tests` path as test code, and here `tests` is product code. A graph negative proves nothing.
