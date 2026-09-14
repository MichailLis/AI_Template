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
7. Prof-orientation analysis is two-phase. The algorithmic phase writes the record as `READY`
   before the LLM phase runs, and the record stays `READY` whether enrichment later succeeds
   or fails. `status` / `analysisStatus` is therefore never a completion signal for the AI —
   read `llmStatus` (or `summary.llm.status`) instead. Enforced by
   `npm run verify:paired-rules` through the `getProfOrientationLlmStatus` pair.

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

The project name is pinned in `docker-compose.yml` with `name: ai_template`, ensuring that any
checkout or worktree targets the same project and containers. Parallel compose stacks are not
possible because `container_name` values are fixed globally.

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
- `npm run verify:invariants` — checks non-obvious invariants (Swagger completeness, no `z.date()`, storage discipline, single error shape, public DTO safety, no React Query state mirroring).
- `npm run verify:paired-rules` — verifies parity of paired implementations and shared constants between client and server via `template/paired-rules.json` and `template/paired-rules.vectors.json`.
- `npm run verify:gates` — runs in-memory mutation testing over repository gates to ensure every pipeline gate catches violations and enforces gate coverage.
- `npm run verify:diff` — auxiliary fast pre-flight over git diff; checks only affected scopes and guards. It is not a gate and does not replace `verify:local` or the release gate `verify:template`.
- `npm run audit:explain [-- --base <ref>]` — diagnostic, not a gate: it explains a red `audit:all` by splitting findings into introduced by this branch, inherited from the base, and resolved, per lock file. It exits 0 whatever it finds, is absent from `verify:local` and `verify:template`, and does not weaken `audit:all`.
- `npm run doctor:agent-tooling` — diagnostic, not a gate: inspects machine-local agent prerequisites (rtk hooks, Serena, root TypeScript, compose name, orval lockfile drift). It exits 0 whatever it finds, is absent from `verify:local` and `verify:template`, and keeps machine drift from breaking a clean tree.

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
5. After `npm run gen:api`, read `git diff --numstat`, not `git status`. Orval rewrites every
   generated file with LF, so `git status` listed 313 modified files where only two had changed
   at all — `signinDto.ts` was byte-identical to `HEAD`. Drop the noise with
   `git checkout -- client/src/shared/api/` before you commit, or the diff buries the real change.
6. Editing files with a script? This tree is CRLF. Normalise to `\n` in memory and convert once on
   write, or you will write `\r\r\n` and `$` will stop matching under `re.MULTILINE`.

## Tools in this repo

Measurements behind these choices live in `docs/tooling-evidence.md`; this section keeps only the rules and the traps that produce wrong results.

- **Tool selection:**

  | Question                                      | Reach for                                                | Why                                                                   |
  | --------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
  | Is the symbol name unique (first step)        | **`npm run find:symbol -- <name>`**                      | Fast, no binaries, flags client/server drift, routes to Serena or rg. |
  | Who uses it — before a rename, move or delete | **`typescript-lsp`** (`findReferences`, `incomingCalls`) | Finds callers the graph misses. Re-query once on cold start.          |
  | How deep does the call chain go               | **graph** `trace_path` with `include_tests: true`        | Only tool that ranks by hop. Absence proves nothing.                  |
  | Where is X handled, name unknown              | **graph** `search_graph query=`                          | Ranked search without the exact name.                                 |
  | A property of the whole tree                  | **graph** `query_graph`                                  | Grep and Serena cannot express it.                                    |
  | A unique symbol name                          | **`rg --with-filename`**                                 | Cheaper and exact.                                                    |
  | Literals, UI strings, config, non-code files  | **`rg`**                                                 | Not in the graph.                                                     |
  | Read a located function                       | **`sed -n 'a,bp'`**                                      | `get_code_snippet` costs more and needs a `qualified_name`.           |
  | Compiler errors in one file                   | **Serena** `get_diagnostics_for_file`                    | `npm run typecheck` is faster for the whole server.                   |
  | Typecheck the whole server                    | **`npm run typecheck`**                                  | `rtk tsc` prints "No errors found" when the compiler never ran.       |
  | File structure / CRLF-safe symbol edit        | **Serena** (`replace_*`, `get_symbols_overview`)         | Avoids `\r\r\n` corruption.                                           |
  | Command output                                | **rtk**, safe filters only                               | Several filters report failure as success (below).                    |

- **typescript-lsp:** answers "who uses this symbol" locally (`findReferences`, `incomingCalls`, `goToDefinition`). **The first query after a cold start can return an incomplete reference list** — always re-query before a rename or move. Evidence: `docs/tooling-evidence.md#8-tooling-audit-2026-09-06`.

- **Serena** (MCP over TypeScript LSP):
  - `find_symbol` and `safe_delete_symbol` take `name_path_pattern`; `find_referencing_symbols` takes `name_path`.
  - Its editing tools (`replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`, `replace_in_files`, `replace_content`) preserve CRLF; ad-hoc scripts write `\r\r\n`.
  - Its line numbers are 0-based: add 1 before using them with `rg` or `sed -n`.
  - Evidence: `docs/tooling-evidence.md#1-serena`.

- **codebase-memory** (MCP knowledge graph):
  - Always pass `include_tests: true` to `trace_path`: the indexer treats every `tests` path as test code, and here `tests` is product code.
  - `DECORATES` points method → decorator: `(m:Method)-[:DECORATES]->(d:Decorator)`.
  - Bare callbacks (`.map(fn)`) get no inbound `CALLS` edges, so caller traces and dead-code detection miss them.
  - `Route` nodes are not the route table; use `template/features.manifest.json` and `server/openapi.json`.
  - No client-to-server edges: `cross_service` tracing stops at `customInstance`.
  - The index lags the working tree: check `check_index_coverage` (`metadata_changed` means stale) before trusting recent code.
  - Evidence: `docs/tooling-evidence.md#2-codebase-memory`.

- **rtk** (compresses command output):
  - **Never use — they report success or emptiness on failure:** `rtk tsc` (never runs the compiler), `rtk find` and `rtk wc` (skip missing paths), `rtk tree` (broken on Windows), `rtk playwright`, `rtk vitest` and `rtk jest` (`PASS (0) FAIL (0)` on missing files or filters), `rtk read -l aggressive` (strips code bodies).
  - **Use with care:** `rtk git diff` (strips context, breaks `git apply`), `rtk lint` (crashes on ESLint syntax errors).
  - **Safe filters:** `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, `rtk ls`, `rtk read` (without `-l aggressive`).
  - Needs `rg` on PATH. Give `rtk rg` an explicit path (otherwise file names and line numbers are dropped) and `</dev/null` inside pipelines (otherwise it hangs).
  - The `Bash` PreToolUse hook rewrites `npx tsc` to `rtk tsc`; this machine excludes it via `hooks.exclude_commands` in `%APPDATA%\rtk\config.toml`. Use `npm run typecheck`.
  - Evidence: `docs/tooling-evidence.md#3-rtk`.

- **Claude Code hooks:** user-level hooks (`~/.claude/settings.json`) do not fire after `--continue`/`--resume` or in subagents; project hooks do. Verify, do not assume. Evidence: `docs/tooling-evidence.md#4-claude-code-hooks`.

- **omp:** workers read `~/.omp/agent/` (`mcp.json`, `AGENTS.md`, `skills/`) and root `.mcp.json`; `tools.xdevDocs: builtins` keeps MCP schemas on demand. Evidence: `docs/tooling-evidence.md#5-omp`.

- **Orca orchestration:**
  - Stop one worker with `orca orchestration worker-stop --dispatch <id>` (`terminal stop` closes the whole worktree). It may answer `dispatch_inactive` yet succeed: confirm `termination_reason: operator_close` in `worker-show`.
  - A worker that dies while the host sleeps leaves its dispatch active forever; only the worker can settle it.
  - Judge liveness by transcript growth in `worker-read`, not by `last_heartbeat_at`.
  - Parse `--json` from stdout only; crashpad lines on stderr break the parser.
  - Evidence: `docs/tooling-evidence.md#6-orca-orchestration`.

- Codex is not used in this repository.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:

   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```

5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**

- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
