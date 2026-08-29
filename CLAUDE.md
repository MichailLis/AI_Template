# AI_Template — entrypoint for Claude Code

`AI_GUIDE.md` is the source of truth for implementation rules. Read it before non-trivial work.
This file is the short version: the invariants that cost the most when violated.

## Stack (do not drift)

NestJS 11 + Prisma 7 + PostgreSQL · React 19 + Vite 7 + TanStack Query + Orval + Zustand +
Tailwind 3 + shadcn/ui · Docker Compose.

The stack and its gates exist to keep the architecture from drifting under AI-driven development.
Version bumps stay inside the current major. Do not propose NestJS 12, Tailwind 4, Vite 8 or
Prisma 8, and do not replace Orval, Zustand, TanStack Query or FSD. Removing dead code and
duplication is welcome; weakening a gate to move faster is not.

## Machine-readable sources of truth

- `template/features.manifest.json` — feature inventory, route/module wiring, `publicRoutes`,
  `generatedApiDirs`. For features with `ownedRoots.backend`, `backendFiles` lists entrypoints,
  not the full file set.
- `template/fsd.rules.json` — layer rules, `mode: "strict"`.
- `scripts/verify-*.mjs` — the automated checks behind both.

Prefer reading these over prose descriptions of them.

## Frontend architecture (strict FSD)

Imports flow one way: `app → pages → widgets → features → entities → shared`.
Cross-slice imports go through the slice public API (`index.ts`). `pages/*` are thin route
entrypoints — business logic belongs in `widgets/*` and `features/*`.

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

## Feature pipeline (in this order)

Classify the change first (`existing-feature-change` vs `new-feature`, see `AI_GUIDE.md` Phase 0),
then: `schema.prisma` → `npm run prisma:generate` → backend → `npm run gen:api` → frontend →
verification. Regenerate the API client before any frontend lint/build/test step when backend
DTOs or controllers changed.

## Runtime

Normal startup is the root compose file only:

```powershell
docker compose up -d
```

Four containers: `ai_template_frontend` (5173), `ai_template_backend` (3000),
`ai_template_postgres` (5432), `ai_template_adminer` (8080).
`.devcontainer/` is for VS Code "Reopen in Container" only — never use it to run the project.

After changing files under `client/`, rebuild the frontend container before browser-level
verification (`verify:template`, `verify:e2e:critical`):

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

Never disable a check, comment out failing logic, or hardcode around a gate to make it pass.

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
5. Editing files with a script? This tree is CRLF. Normalise to `\n` in memory and convert once on
   write, or you will write `\r\r\n` and `$` will stop matching under `re.MULTILINE`.

## Tools in this repo

- **Serena** (MCP, symbolic navigation over the TypeScript LSP). Prefer it over grep for
  reference lookup, renames and safe deletes: `find_symbol`, `find_referencing_symbols`,
  `find_implementations`, `get_diagnostics_for_file`, `rename_symbol`, `safe_delete_symbol`.
  Grep is still right for text, config and non-symbol search.

  Its memories under `.serena/memories/` are a thin orientation map, nothing more. Rules belong
  in `AI_GUIDE.md`: only Claude Code loads Serena, memories are read on request rather than
  injected, and a rule kept in two places drifts — two memory files were deleted from this
  repository for being stale copies of guide sections. Do not cache facts about the code there
  either; `find_referencing_symbols` answers from the current tree, a memory answers from
  whenever it was written. `verify:ai-guide` now checks these files for stale paths.

- **rtk** wraps shell output to cut tokens. A global hook rewrites commands automatically;
  `rtk test <cmd>`, `rtk lint`, `rtk tsc`, `rtk vitest`, `rtk prisma`, `rtk git diff` are the
  ones that pay off most here.
- Codex is not used in this repository.
