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
- `npm run verify:invariants` — checks non-obvious invariants (Swagger completeness, no `z.date()`, storage discipline, single error shape, public DTO safety, no React Query state mirroring).
- `npm run verify:paired-rules` — verifies parity of paired implementations and shared constants between client and server via `template/paired-rules.json` and `template/paired-rules.vectors.json`.
- `npm run verify:gates` — runs in-memory mutation testing over repository gates to ensure every pipeline gate catches violations and enforces gate coverage.
- `npm run verify:diff` — auxiliary fast pre-flight over git diff; checks only affected scopes and guards. It is not a gate and does not replace `verify:local` or the release gate `verify:template`.
- `npm run audit:explain [-- --base <ref>]` — diagnostic, not a gate: it explains a red `audit:all` by splitting findings into introduced by this branch, inherited from the base, and resolved, per lock file. It exits 0 whatever it finds, is absent from `verify:local` and `verify:template`, and does not weaken `audit:all`.

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

Empirical measurements, benchmarks, and experimental findings behind tool choices are recorded in `docs/tooling-evidence.md`. This section contains only actionable rules and traps where violation leads to incorrect results.

- **Tool selection overview:**

  | Question                                               | Reach for                                                 | Why not the others                                                                                                          |
  | ------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
  | Is the symbol name unique (first step)                 | **`npm run find:symbol -- <name>`**                       | Answers uniqueness in milliseconds without external binaries, reports declarations, warns on drift, routes to Serena or rg. |
  | Who uses this symbol — before a rename, move or delete | **Serena** `find_referencing_symbols`                     | Only tool that resolves all callback uses (`.map(fn)`) and names the enclosing method. The graph misses callbacks.          |
  | How deep does the call chain go, what is hop distance  | **graph** `trace_path`, always with `include_tests: true` | Nothing else ranks by hop. Positives only — absence proves nothing, and default parameters miss product code.               |
  | Where is X handled, when you do not know the name      | **graph** `search_graph query=`                           | BM25 and vector ranking surface relevant symbols without exact name matching.                                               |
  | A property of the whole tree at once                   | **graph** `query_graph`                                   | Neither grep nor Serena can express it across the entire AST.                                                               |
  | A symbol whose name is unique                          | **`rg --with-filename`**                                  | Four times cheaper and exact.                                                                                               |
  | Literals, UI strings, config keys, non-code files      | **`rg`**                                                  | Not in the graph, not symbols.                                                                                              |
  | Read a function you already located                    | **`sed -n 'a,bp'`**                                       | `get_code_snippet` costs ~2.4x for the same lines and needs a `qualified_name` first.                                       |
  | Compiler errors in one file                            | **Serena** `get_diagnostics_for_file`                     | `npm run typecheck` covers the server in ~5s; use diagnostics for one file's noise, not for speed.                          |
  | Typecheck the whole server                             | **`npm run typecheck`**                                   | `rtk tsc` prints "No errors found" when the compiler never ran.                                                             |
  | What is in this file / this class                      | **Serena** `get_symbols_overview`, `find_symbol depth:1`  | ~200 bytes against several KB for reading the file.                                                                         |
  | Command output                                         | **rtk**, but only the safe filters listed below           | Compresses command output — but `tsc`, `find`, `wc`, `vitest`/`jest` and `read -l aggressive` misreport failure as success. |

- **Serena** (MCP, symbolic navigation over TypeScript LSP):
  - **Symbol discovery:** To choose between tools for finding a symbol, run `npm run find:symbol -- <name>`.
  - **Parameter names differ between sibling tools:** `find_symbol` and `safe_delete_symbol` take `name_path_pattern`, whereas `find_referencing_symbols` takes `name_path`. Passing the wrong parameter name fails validation.
  - **Editing tools are CRLF-safe:** `insert_after_symbol`, `replace_symbol_body`, `replace_in_files`, `insert_before_symbol`, and `replace_content` preserve CRLF and leave 0 bare LFs, avoiding the `\r\r\n` corruption trap. Ad-hoc scripts often corrupt line endings.
  - **Serena's line numbers are 0-based:** Line 26 in `rg`, `sed`, or the graph sits at line 25 in Serena. Always add 1 before carrying a Serena line number into `sed -n`.
  - Detailed measurements and benchmarks: `docs/tooling-evidence.md#1-serena`.

- **codebase-memory** (MCP, local knowledge graph over the whole tree):
  - **Always pass `include_tests: true` to `trace_path` in this repository:** The indexer marks any path with `tests` as test code. Here `tests` is the product: 736 business code nodes (11% of the graph) are flagged. Inbound tracing on `getMaxChoices` returns 5 callers with `include_tests: true` and 0 without it.
  - **`DECORATES` points method → decorator:** The direction is counter-intuitive (`(m:Method)-[:DECORATES]->(d:Decorator)`). Querying `(d:Decorator)-[:DECORATES]->(m:Method)` returns zero rows.
  - **Functions passed as bare callbacks get no inbound edges:** `.map(fn)` is invisible to the graph (`mapQuestionToPromptPayload` has 3 call sites and 0 inbound `CALLS` edges). Consequence: automated dead-code detection is unusable (produces false positives), and caller traces miss callback usages.
  - **`Route` nodes are not the route table:** Generated from call sites in tests/client code with null `path` and `file_path`. Authorities are `template/features.manifest.json` and `server/openapi.json`.
  - **No cross-service linking:** The graph contains zero client-to-server edges; `trace_path` with `mode: "cross_service"` stops at `customInstance`.
  - Detailed findings (main checkout indexing failure, Cypher subset, daemon lifecycle): `docs/tooling-evidence.md#2-codebase-memory`.

- **rtk** (wraps shell output to cut tokens):
  - **Never use these — they report success or emptiness when the command failed:** `rtk tsc` (reports "No errors found" without running compiler), `rtk find` (exits 0 on non-existent directories), `rtk tree` (broken on Windows, exits 0 with parameter error), `rtk playwright` (reports `PASS (0) FAIL (0)` on missing files), `rtk read -l aggressive` (strips braces and bodies, breaking syntax), `rtk wc` (silently drops missing files), and `rtk vitest` / `rtk jest` (reports `PASS (0) FAIL (0)` on unmatched filters, masks config errors).
  - **Use with care:** `rtk git diff` (strips context, incompatible with `git apply`), `rtk lint` (crashes deserializer on ESLint syntax errors).
  - **Safe filters:** `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, `rtk ls`, `rtk read` (without `-l aggressive`).
  - **rtk requires `rg` on PATH:** Without ripgrep, it falls back to raw execution with corrupted search output.
  - **Always give `rtk rg` an explicit path:** `rtk rg <pat>` drops file names and line numbers; `rtk rg -n <pat> server/src` keeps them.
  - **`rtk rg` hangs on pipelines without stdin redirection:** `rtk rg pat | wc -l` hangs; use `rtk rg pat </dev/null | wc -l`.
  - **Silent `npx tsc` rewrite:** The `Bash` PreToolUse hook rewrites `npx tsc` to `rtk tsc`. Fixed on this machine via `hooks.exclude_commands = ["npx tsc", "tsc"]` in `%APPDATA%\rtk\config.toml`. Use `npm run typecheck`.
  - Detailed sweeps and compression stats: `docs/tooling-evidence.md#3-rtk`.

- **Claude Code hooks:**
  - **Hooks do not fire in a resumed session:** Hooks configured in `~/.claude/settings.json` are not picked up by `--continue` or `--resume`, and spawned subagents inherit this inactive state. If you change or rely on hooks, verify in a fresh session.
  - Cost and latency measurements: `docs/tooling-evidence.md#4-claude-code-hooks`.

- **omp (Oh My Pi):**
  - Dispatched workers read `~/.omp/agent/` (`mcp.json`, `AGENTS.md`, `skills/`) and root `.mcp.json`.
  - `tools.xdevDocs: builtins` keeps MCP schemas on demand, avoiding context inflation in short-lived workers.
  - Token analysis: `docs/tooling-evidence.md#5-omp`.

- **Orca orchestration:**
  - **Worker termination:** Individual workers are stopped with `orca orchestration worker-stop --dispatch <id>`. `worker-stop` can respond with `dispatch_inactive` and still succeed — verify state via `worker-show`, where a stopped worker has `termination_reason: operator_close` and `stage: process_exited`. In contrast, `terminal stop` is per-worktree only.
  - **Deadlock on worker death:** If the host sleeps, a worker dying mid-run leaves the dispatch permanently active and task unrecoverable. Only the worker can settle its dispatch.
  - **Worker liveness:** Do not judge liveness by `last_heartbeat_at` (can be stale or `None`). The authoritative check is transcript growth across checks via `worker-read --dispatch <id>`.
  - **JSON output parsing:** When parsing Orca CLI `--json`, connect only stdout; crashpad diagnostic lines emitted to stderr break JSON parsers if merged.
  - Detailed mechanics and experiments: `docs/tooling-evidence.md#6-orca-orchestration`.

- Codex is not used in this repository.
