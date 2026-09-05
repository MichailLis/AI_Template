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
5. After `npm run gen:api`, read `git diff --numstat`, not `git status`. Orval rewrites every
   generated file with LF, so `git status` listed 313 modified files where only two had changed
   at all — `signinDto.ts` was byte-identical to `HEAD`. Drop the noise with
   `git checkout -- client/src/shared/api/` before you commit, or the diff buries the real change.
6. Editing files with a script? This tree is CRLF. Normalise to `\n` in memory and convert once on
   write, or you will write `\r\r\n` and `$` will stop matching under `re.MULTILINE`.

## Tools in this repo

- **Serena** (MCP, symbolic navigation over the TypeScript LSP): `find_symbol`,
  `find_referencing_symbols`, `find_implementations`, `get_diagnostics_for_file`, `rename_symbol`,
  `safe_delete_symbol`.

  Reach for it on two triggers, not as a blanket replacement for grep — a measured session used it
  once against 341 greps, because "prefer it generally" is not a decision anyone makes:
  1. **The name is not unique across the repo.** `getMaxChoices` exists in
     `client/src/features/tests/lib/` and in `server/src/tests/session/answer-validation.ts` as
     two different implementations of one rule. Grep returns 14 hits and cannot say which tree
     owns which; `find_referencing_symbols` scoped to the server file returns the one real call
     site. Getting this wrong is how the client copy drifted from the server authority once.
  2. **You are about to move or delete an exported symbol.** Grep shows lines; Serena names the
     enclosing method, which is the thing that tells you whether the move is safe.

  For a symbol whose name is unique, grep is correct and about four times cheaper. Use it. Roughly
  a quarter of one session's greps were identifier lookups; the rest were paths, flags, UI strings
  and pipelines filtering command output, where Serena does not apply at all.

  Two frictions worth knowing before you start, because both cost a wasted call:
  - The tools are deferred, so the first use costs a schema fetch before the query itself. Decide
    to use Serena at the start of a refactor, not halfway through it.
  - The parameter is **not** named consistently across siblings: `find_symbol` and
    `safe_delete_symbol` take `name_path_pattern`, `find_referencing_symbols` takes `name_path`.
    Passing the wrong one fails validation.

  Two cheap tools worth reaching for before you open a file. `get_symbols_overview` returns a
  file's whole symbol inventory for about 200 bytes — the ten symbols of `answer-validation.ts`
  cost a fiftieth of reading it. `find_symbol` with `depth: 1` returns a class with its members
  and their line ranges, which is the cheapest way to answer "what methods does this controller
  have". `search_for_pattern` is a grep that keeps its paths, and `restrict_search_to_code_files:
true` drops documentation hits that `rg` would return.

  On a symbol with many references, pass a deliberately small `max_answer_chars` first:
  `find_referencing_symbols` for `ensureAdminAccess` overflows at 27K characters and degrades to a
  per-file reference histogram — 18 files, 73 references — for well under a kilobyte. Size the
  blast radius from that, then drill into the files that matter. For a normally-called function
  the graph is still the better answer to the same question: it named all 42 calling methods
  grouped by their service class.

  `rename_symbol` was spot-checked against the graph's worst case and handles it completely:
  renaming `mapQuestionToPromptPayload` rewrote the declaration, both imports and all three
  `.map(fn)` call sites across three files — exactly the usage for which the graph holds zero
  edges. Its "N changes applied" counts files, not occurrences. `search_for_pattern` with
  `multiline: true` expresses things `rg` needs `-U` for: one regex over `*.controller.ts`
  matching a verb decorator through to `async <name>(` without an `@ApiResponse` in between
  returned exactly one handler — `AuthController.logout`, the same answer the graph's Cypher gave
  from the other direction.

  **Its editing tools are CRLF-safe, which hand-rolled scripts are not.** This tree's TypeScript is
  CRLF, and `insert_after_symbol`, `replace_symbol_body` and `replace_in_files` all left it that
  way — bodies passed in with bare `\n` came back written as `\r\n`,
  zero bare LF introduced. That is the cheapest way to avoid the `\r\r\n` trap in
  "Verifying your own work" above.
  `replace_in_files` is the one to reach for on a repeated small edit across files: run it with
  `dry_run: true` first and it returns every prospective change as a line diff with an occurrence
  id, then re-issue with `occurrence_ids` to apply only the ones you picked — verified by
  replacing exactly one of two matches. `insert_before_symbol` and `replace_content` are the same
  family but were not individually exercised.

  It scales unevenly on the generated API client, this tree's biggest source at 116 KB.
  `search_for_pattern` handles it without complaint — 19 hits with line numbers for 1.7 KB — but
  `get_symbols_overview` overflows and falls back to counts by kind (88 constants, 87 variables,
  40 functions), which is the right answer for generated boilerplate and useless if you wanted
  names. `list_memories` reports exactly the two files under `.serena/memories/` and nothing more.

  **Serena's line numbers are 0-based.** `getMaxChoices` sits at line 26 for `rg`, `sed` and the
  graph, and at 25 for every Serena tool. Do not carry a Serena line number into a `sed -n` range
  without adding one.

  `get_diagnostics_for_file` returns compiler errors grouped by enclosing symbol for one file.
  `npm run typecheck` covers the whole server in about five seconds, so reach for diagnostics when
  you want one file's errors without the other files' noise, not for speed.

  **Serena is available to dispatched workers too, and that is deliberate.** The project
  `.mcp.json` at the repo root declares it and omp honours that file alongside its own
  `~/.omp/agent/mcp.json`, so an omp worker gets the same 22 Serena tools — one confirmed them
  mounted in its own context. An earlier decision kept Serena away from short-lived workers
  because each one paid ~3000 tokens of schemas it never used; that reason has since gone, since
  omp's `tools.xdevDocs: builtins` keeps MCP schemas on demand. What remains is the process cost:
  each worker spawns `uvx serena start-mcp-server` and a TypeScript language server. Worth it,
  because a worker asked to find every use of a symbol needs the one tool that does not miss
  callbacks.

  Its memories under `.serena/memories/` are a thin orientation map, nothing more. Rules belong
  in `AI_GUIDE.md`: memories are read on request rather than
  injected, and a rule kept in two places drifts — two memory files were deleted from this
  repository for being stale copies of guide sections. Do not cache facts about the code there
  either; `find_referencing_symbols` answers from the current tree, a memory answers from
  whenever it was written. `verify:ai-guide` now checks these files for stale paths.

- **codebase-memory** (MCP, a local knowledge graph over the whole tree — 6.7k nodes and 23.8k
  edges here, rebuilt in seconds). The index lives in `~/.cache/codebase-memory-mcp/`; nothing is
  written into the repository. A watcher keeps it fresh and `auto_index` is on, so each Orca
  worktree indexes itself on first connection — the graph records the canonical root but is keyed
  on the worktree path, so every worktree is its own project. The watcher is real and quick:
  a new file's symbols appeared in the graph 11.2 s after it was written, and disappeared about a
  second after it was deleted.

  The server injects an instruction telling you to prefer graph tools over grep for all code
  discovery. Do not take that at face value here: the calibration above still holds, and for a
  symbol whose name is unique grep remains correct and cheaper. What the graph does give you that
  neither grep nor Serena can:
  1. **Transitive call chains, ranked by hop.** On the `getMaxChoices` case above,
     `trace_path(direction="inbound", include_tests=true)` against the server copy returns five
     callers with their distance — `validatePublicAnswerPayload` at hop 1, `saveAnswers` at 2,
     `finishSession` at 3. Every hop was checked against the source and every one is right: line
     97 sits inside `validatePublicAnswerPayload`; `saveAnswers` reaches it at
     `public-session.service.ts:232`; `validatePublicAttemptAnswersForFinish` calls it too; and
     `finishSession` reaches the whole chain through that at line 297. Grep's hits cannot be
     ranked and Serena answers one level. Trust these positives; never trust the absence of an
     edge — see the callback hole below.
  2. **One question against the whole tree**, which neither of the others can express. A single
     Cypher query over `DECORATES` compared the 58 HTTP handlers with the 115 Swagger decorations
     and found the one handler carrying `@ApiOperation` without `@ApiResponse`
     (`AuthController.logout`). That is invariant 4 above, and no `verify:*` script covers it —
     `verify-architecture` and `smoke-server` check the manifest's `openApiOperations` against
     `openapi.json`, never the decorators on the methods.
  3. `schema.prisma` is in the graph: models as `Class`, enums as `Enum`, columns as `Field`.
  4. **Duplicate-implementation candidates** via `SIMILAR_TO` (507 edges, 279 of them cross-file).
     It found `getUniqueOptionValue` in `features/tests/lib/ai-generator-parse.ts` and
     `getUniqueValue` in `features/tests/lib/tests-utils.ts` at a Jaccard of 1.0 — confirmed
     byte-identical bar the parameter names. Filter on `same_file = "false"` and expect the top of
     the list to be Orval boilerplate (`withQueryKey` repeated across four generated files). Note
     what it does _not_ find: the `getMaxChoices` client/server pair has no `SIMILAR_TO` edge at
     all, so this is a source of leads, never a duplication audit.
  5. **`trace_path` with `mode: "data_flow"`**, which records the argument _expressions_ passed at
     each hop — `getMaxChoices` receives `question.settings`, `finishSession` passes
     `attempt.topicVersion.questions`. It reconstructs where a parameter came from without opening
     a file, and nothing else in this toolbox does it.
  6. **`semantic_query`** (an array of keywords) runs real embeddings with cosine scores, separate
     from the BM25 `query`. Both work on this index.
  7. **Complexity metrics per function**, which no other tool here offers: `complexity`,
     `cognitive`, `loop_depth`, `transitive_loop_depth` and `linear_scan_in_loop` are queryable
     node properties. Spot-checked and accurate — it flags `verifyFsdRules` for a linear scan
     inside a loop, and that function does call `hasPrefixMatch` inside its loop over client
     files.

  Traps, each of which costs a wasted call or — worse — a wrong negative:
  - **Always pass `include_tests: true` to `trace_path` in this repository.** The indexer flags a
    node as test code when its path contains `tests` — the pattern is hardcoded in the binary next
    to `__tests__` and `.spec.` — and here `tests` is the _product_. 985 nodes carry the flag and
    **736 of them are business code**: `topics.service.ts`, `topics.controller.ts`,
    `analysis.service.ts`, `prof-orientation-v3-plus/scoring.ts`, all of
    `client/src/features/tests/`, and 102 nodes of the generated `api/generated/tests/tests.ts`.
    That is 11% of the graph, and `trace_path` hides it by default. Concretely: inbound on
    `getMaxChoices` — the canonical case above — returns **five callers with `include_tests: true`
    and zero without it**. A default-parameter trace over this tree is not a weak answer, it is a
    wrong one. `search_graph` and `query_graph` do not filter and need nothing.
  - **`DECORATES` points method → decorator**, the opposite of how the name reads. The intuitive
    `(d:Decorator)-[:DECORATES]->(m:Method)` returns zero rows plus a hint pointing at
    `get_graph_schema`, which lists edge types without their direction. Empty here means "wrong
    direction", not "none exist" — the same failure mode as a bad grep.
  - `Decorator` nodes are one per decorator _name_ (19 in total) and carry no arguments, so the
    graph knows `getUsers` is a `@Get` but not the path it is mounted on.
  - **`Route` nodes are not the server's route table.** In this repo they come from HTTP call
    sites in tests and client code: `path` and `file_path` are null and nothing links a route to
    its handler. `template/features.manifest.json` and `server/openapi.json` stay the authority.
  - **Cross-service linking does not work in this repository, so the graph cannot tell you which
    client code breaks when a server endpoint changes.** There are six `HTTP_CALLS` edges in
    total: a runtime base-URL probe, three lifted from fixture strings in a `scripts/` test, and
    two outbound calls to OpenRouter. Not one links client to server. `trace_path` with
    `mode: "cross_service"` from `adminControllerGetUsers` stops at `customInstance`. The cause is
    structural — Orval funnels every call through one Axios wrapper with a templated URL, and Nest
    paths live in decorator arguments the graph does not keep. Splitting them does not help: with
    `client/` and `server/` indexed as two separate projects (3717 and 1897 nodes) the schema
    still carries no `CROSS_*` edge type of any kind, and the same trace still stops at
    `customInstance`. Nor do the routes improve — a server-only project yields 26 `Route` nodes
    that still have null `file_path` and `source`, and one of them is
    `/tests/public/sessions/not-a-real-token`, a string that exists only inside a test.
    `template/features.manifest.json` plus `verify-architecture`'s OpenAPI inventory stay the only
    mechanism for that question.
  - **It cannot index the main checkout.** `index_repository` on
    `C:/Users/admin/Documents/WebAI/AI_Template` fails in both `full` and `fast` mode with nothing
    but `status: "error"` and a generic "Pipeline failed. Check repo_path exists and contains
    source files" — and `CBM_LOG_LEVEL=debug` adds not one extra line. The worktree at
    `orca/workspaces/AI_Template/sargassum` indexes fine, as do `client/` and `server/` taken
    alone, so the failure is specific to that root and undiagnosable from the outside.
  - **`check_index_coverage` cries wolf.** For every valid, unmodified file it returns
    `freshness: "metadata_changed"` with `recommended_action: "read_source_and_reindex"`, and for
    a path that does not exist at all it answers `status: "no_recorded_issue"`. The agent
    definitions cbm installed tell you to batch it over every evidence path; on this tree that
    produces noise. Its `parse_partial` and `excluded` statuses are accurate — use those and
    ignore the freshness field.
  - **`search_code` cannot paginate.** It is a useful hybrid — grep hits mapped to the enclosing
    graph symbol, so you get the function name around each match — but it takes `limit` (default 10) with no `offset`, and runs in ~730 ms against ripgrep's ~10 ms. Reach for it to name the
    enclosing symbol, not to enumerate matches.
  - **The daemon can take your MCP connection down mid-session.** One shared per-account daemon
    serves every CBM client; when its last committed client disconnects it stops, and a session
    still working loses every `mcp__codebase-memory-mcp__*` tool with no warning. That happened
    here the moment a parallel worker finished, and **it does not come back** — the daemon
    restarted, fresh workers connected to it happily, and this session's tools stayed gone for the
    rest of its life. The fallback is the same binary:
    `codebase-memory-mcp.exe cli <tool> '<json args>'` reads the identical graph, at a ~1.9 s cold
    start per call. The three `codebase-memory-*` subagents cbm installs inherit the session's MCP
    state, so once this happens they are left with only `Read`/`Grep`/`Glob` while their own
    definitions instruct them to lead with graph tools — judge them in a fresh session or not at
    all.
  - The Cypher subset is small — no `EXISTS { … }` past a single hop, `NOT (a)<-[:X]-()` is
    rejected outright, and there is no `id()`, no `MATCH path = …`, and no property-to-property
    comparison (`WHERE a.lines < b.lines`). Express a set difference as two queries and diff the
    results yourself.
  - **A function passed as a bare callback gets no inbound edge at all.** `.map(fn)` is invisible:
    `mapQuestionToPromptPayload` is used at three call sites in two services and the graph records
    zero inbound `CALLS`; `normalizeCorsOrigin` is used at `setup-app.ts:39` and its only edge is
    `DEFINES`. `USAGE` does not rescue this — it points outward (what the function uses) and is
    name-matched, so it drags in unrelated `type`/`title`/`required` keys from
    `server/schematics/*.json`. Consequence: **dead-code detection is unusable here** — the one
    candidate it produced for `server/src` was a false positive — and `trace_path` under-reports
    callers for the DTO-mapping layer, which is written almost entirely in `.map(fn)`.

  Three tools and one aspect are not worth the call here. **`ingest_traces` is a stub** — it
  answers `{"status":"accepted","traces_received":0,"note":"Runtime edge creation from traces not
yet implemented"}`, so it accepts input and does nothing. `get_architecture` with
  `aspects: ["file_tree"]` returns 227 rows of plain directory listing for 9.7 KB, which `Glob`
  gives you for a fraction. And its `layers`/`boundaries` analysis is derived from a package
  heuristic that does not fit this tree: it reports `src` — the entire client _and_ server — as
  one undifferentiated "internal" layer, promotes the script directories to peers, and lists the
  OpenRouter URL path `ai/api/v1/chat/completions` as a layer of the architecture. For anything
  about FSD layers or Nest module structure, `template/fsd.rules.json` and `verify-architecture`
  are the authority.

  Do not adopt `manage_adr`. Every `index_repository` and `get_architecture` response nags you to
  start one, but an ADR store inside the graph is a second home for rules that already live in
  `AI_GUIDE.md` and `template/features.manifest.json` — the same duplication that got two Serena
  memory files deleted from this repository. `ingest_traces` and `delete_project` are likewise
  unused here.

  Pagination is trustworthy: `total` and `has_more` are exact, rows come back name-ordered, and
  `offset` continues precisely where the previous page stopped. Page with `detail: "ids"` — a
  200-row default-detail page is thousands of tokens.

  `index_status` reports what the indexer could not fully parse; today that is
  `client/nginx/default.conf` (all 54 lines) and one line in each `.env*.example`. Grep those
  rather than trusting the graph on them.

- **rtk** wraps shell output to cut tokens. **The global `PreToolUse` hook on `Bash` silently
  rewrites bare commands**, and this is the thing to internalise: `rg`→`rtk rg`, `cat`→`rtk read`,
  `git`→`rtk git`, `ls`→`rtk ls`, `grep`→`rtk grep`, `npm`→`rtk npm`, `docker`→`rtk docker`, and
  **`npx tsc`→`rtk tsc`**. Verified live in `rtk gain --history`, which logged this session's own
  bare `git status` and `rg` as `rtk` calls. A command wrapped in `timeout …` with redirections is
  left alone, which is the only reason the measurements in this section are raw. The consequence
  is sharp: typing `npx tsc --noEmit` gets you `rtk tsc`, which reports "No errors found" when the
  compiler never ran — you never asked for rtk and are never told. `sed` is not rewritten;
  `rtk test <cmd>`, `rtk lint`, `rtk vitest`, `rtk prisma` and `rtk git diff` are the ones that
  pay off most here. `rtk tsc` used to be on that list and has been removed — see below.

  **rtk needs `rg` on PATH.** Without ripgrep it falls back to raw execution and its grep output
  becomes unreliable rather than merely unfiltered — in one session it reported "0 matches" for a
  symbol present three times in the file it was given, and printed a whole file with the newlines
  stripped when asked for twelve lines. If you see
  `Failed to resolve 'rg' via PATH`, do not trust search results until it is installed
  (`winget install BurntSushi.ripgrep.MSVC`, then restart the session so child processes inherit
  the new PATH).

  **Search with `rtk rg`, not `rtk grep`.** They are separate subcommands: `rtk rg` runs ripgrep
  itself, while `rtk grep` proxies a native `grep`, which Windows PowerShell does not have — it
  fails with `Failed to resolve 'grep' via PATH` and returns nothing.

  **`rtk rg` drops the file names only when you give it no path to search.** `rtk rg getMaxChoices`
  returns the matching lines with no path and no line number; add `-n` and you get `114:`, `20:`,
  `26:` with nothing saying which file, which is worse than either. Pass an explicit path and both
  come back: `rtk rg -n getMaxChoices server/src` is byte-for-byte what raw `rg -n` prints (202
  against 204). So the rule is simply **always give `rtk rg` a path argument** — and expect no
  saving from it, because there is none. rtk pays on command output instead: test runs, linters.

  **Never use `rtk tsc` in this repository — it reports success when TypeScript never ran.** On a
  throwaway project with three deliberate type errors, raw `tsc` exits 2 and prints all three;
  `rtk tsc` prints `TypeScript: No errors found`. Its tee log shows why: it shells out to
  `npx tsc`, `tsc` is not on PATH here, npx resolves the decoy `tsc` package, and rtk reads that
  banner as a clean run. Use `npm run typecheck`, which resolves the local compiler.

  A sweep of all fourteen filters sorts them into three groups, and the first group is the one
  that matters:
  - **Never use these — they report success or emptiness when the run failed.** `rtk tsc`, as
    above. `rtk find`, which exits 0 with no output when the directory does not exist, so a typo
    in a path reads as "no files match". `rtk read -l aggressive`, which cuts function bodies and
    closing braces out of TypeScript — 64% smaller and syntactically invalid, with the security
    checks in `setup-app.ts` silently gone. `rtk wc` over several files, which drops the missing
    one and totals the rest as if all were read. And `rtk vitest` / `rtk jest` to prove tests
    ran: a filter matching nothing prints `PASS (0) FAIL (0)`, and real config errors vanish
    behind `[RTK:PASSTHROUGH] … All parsing tiers failed`.
  - **Use with care.** `rtk git diff` strips the context lines, so its output is not a valid
    unified diff and cannot be fed to `git apply`; on an all-insertions diff it saves about 10%.
    `rtk lint` crashes its own Rust deserializer on ESLint fatal parse errors instead of showing
    them.
  - **Safe.** `rtk run` (raw passthrough), `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`,
    `rtk ls`, and `rtk read` with no level flag — which is byte-identical to `cat`, so its saving
    there is zero.

  **The silent `npx tsc` rewrite is fixable, and the lever is `hooks.exclude_commands` in
  `%APPDATA%\rtk\config.toml`** — it already carries `"npm run lint"` and `"eslint"`. Adding
  `"npx tsc"` and `"tsc"` **has been applied**, so the defect is closed on this machine: the hook
  now returns nothing for either command while still rewriting `npm run typecheck`, `git status`
  and `rg`. End to end, `npx tsc --noEmit -p server/tsconfig.json` now fails visibly with the
  decoy package's own banner and exit 1 instead of answering `TypeScript: No errors found`. If you
  meet a machine where it still lies, that config file is the lever. There is no equivalent setting for `rtk rg`
  filenames (pass a path argument instead), and `rtk trust --list` reports no project-local TOML
  filters, so that route is unused here.

  Where a binary is simply absent, rtk is honest. Across a sweep of 25 further subcommands the
  ones whose tool was genuinely missing — `docker`, `psql`, `npx`, `playwright`, `wget`, `grep`,
  `cargo`, `aws`, `pnpm`, `ruff`, `oc`, `glab`, `wc` — every one printed
  `rtk: Failed to resolve '<tool>' via PATH`, and `tree` printed install instructions instead.
  The ones whose tool was present passed the real failure through: `kubectl`, `dotnet`, `gh`,
  `log`, `smart`, `summary` and `curl` all surfaced the underlying error text, and `rtk docker`
  on a missing service and `rtk npm` on a missing script both answered verbatim with exit 1.
  Only `prettier` (a bare newline) and `next` (a ten-second hang on an empty directory) were
  uninformative. The dangerous cases above are failures of _parsing_, not of
  resolution, which is why they are so much harder to notice.

  `rtk discover` is worth running for the adoption picture — 3610 Bash commands over 7 sessions,
  only 1.3% actually routed through rtk, because the hook leaves wrapped commands alone — but read
  its advice with care: four of its top ten recommendations are `rtk grep`, `rtk tsc`, `rtk find`
  and `rtk wc`, every one of which is on the never-use list above. It ranks by tokens saved, not
  by whether the answer is true. `rtk learn` just replays past command corrections; 19 KB of
  output and nothing actionable here.

  Nor will rtk's own diagnostics warn you: `rtk gain --failures` lists 138 parse
  failures at a claimed "Recovery rate: 100.0%" and `tsc` appears nowhere in it — rtk read the
  decoy banner as a clean run, so it does not count this as a failure at all. Where the underlying
  tool does run, the compression is real: `rtk gain --project` reports 857K tokens saved over 936
  commands in this worktree, 72.5% average. It varies with the shape of the output, though —
  `rtk git diff` on an all-insertions diff saved 8% because there is no unchanged context to
  strip, while test and lint runs are where the 90%-plus figures come from.

  **`rtk rg` hangs when you pipe it** unless stdin is redirected. `rtk rg pat | wc -l` never
  returns; `rtk rg pat </dev/null | wc -l` returns immediately. Reproducible on 0.46.0, and it
  looks exactly like a slow search rather than a hang.

  **Keep rtk at 0.46 or newer** (`rtk --version`; it has no self-update, so replace the binary in
  `~/.local/bin` by hand). Up to 0.40 it truncated `git push` output, reporting a branch name cut
  mid-word as success while the commit never reached the remote — a push is only confirmed by
  comparing local `HEAD` against `origin/<branch>`, which is worth doing regardless of version.

- **Choosing between them.** Measured on this repository; quality first, tokens second.

  | Question                                               | Reach for                                                 | Why not the others                                                                                                                                            |
  | ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Who uses this symbol — before a rename, move or delete | **Serena** `find_referencing_symbols`                     | Only tool that got all three `.map(fn)` uses _and_ named the enclosing method. The graph returned zero.                                                       |
  | How deep does the call chain go, what is hop distance  | **graph** `trace_path`, always with `include_tests: true` | Nothing else ranks by hop. Positives only — absence proves nothing, and the default parameters prove less than nothing.                                       |
  | Where is X handled, when you do not know the name      | **graph** `search_graph query=`                           | BM25 put `scoreProfOrientationV3Plus` second; `rg -i score` returns 180 lines across 52 files and ranks nothing.                                              |
  | A property of the whole tree at once                   | **graph** `query_graph`                                   | Neither grep nor Serena can express it. This is what found the missing `@ApiResponse`.                                                                        |
  | A symbol whose name is unique                          | **`rg --with-filename`**                                  | Four times cheaper and exact.                                                                                                                                 |
  | Literals, UI strings, config keys, non-code files      | **`rg`**                                                  | Not in the graph, not symbols.                                                                                                                                |
  | Read a function you already located                    | **`sed -n 'a,bp'`**                                       | `get_code_snippet` costs ~2.4x for the same lines and needs a `qualified_name` first.                                                                         |
  | Compiler errors in one file                            | **Serena** `get_diagnostics_for_file`                     | `npm run typecheck` covers the server in ~5s; use diagnostics for one file's noise, not for speed.                                                            |
  | Typecheck the whole server                             | **`npm run typecheck`**                                   | `rtk tsc` prints "No errors found" when the compiler never ran.                                                                                               |
  | What is in this file / this class                      | **Serena** `get_symbols_overview`, `find_symbol depth:1`  | ~200 bytes against several KB for reading the file.                                                                                                           |
  | Command output                                         | **rtk**, but only the safe filters listed above           | Its compression is real on command output, unlike on search — but `tsc`, `find`, `wc`, `vitest`/`jest` and `read -l aggressive` misreport failure as success. |

- **Claude Code's own hooks.** Installing codebase-memory added seven hook entries to
  `~/.claude/settings.json` backed by three identical `.cmd` shims that all call
  `codebase-memory-mcp hook-augment`. Measured by feeding each one a real hook payload:

  | Hook                                          | Injects                                                                                                           | Cost   |
  | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
  | `SessionStart` (startup/resume/clear/compact) | 806 B — project index status, the scout/verify/auditor router, the coverage invariant                             | ~1.8 s |
  | `SubagentStart`                               | 810 B, the same context for a subagent                                                                            | 1.8 s  |
  | `PreToolUse` on `Grep`                        | 440–630 B — the graph symbols matching your pattern, explicitly marked "your search results below are unaffected" | ~1.8 s |
  | `PreToolUse` on `Glob`                        | 1190 B, matched on a word inside the glob, so vaguer                                                              | 1.9 s  |
  | `PostToolUse` on `Read`                       | **nothing at all**                                                                                                | 1.7 s  |

  Two things follow. The `Grep` augmentation is genuinely useful — it answers the client/server
  `getMaxChoices` question for free on every search — while the `Read` hook is pure latency on
  every file you open. And every one of them pays the binary's ~1.8 s cold start, against a 5 s
  hook timeout. There is no `Bash` matcher despite the upstream README advertising one.

  The skill and the three agents it also installs are cheap but oversold. The skill body is 5.1 KB
  (~1300 tokens) and loads only when invoked; its opening line claims graph tools cost "~500
  tokens vs ~80K for grep", which does not describe this tree — the `getMaxChoices` question cost
  about 320 tokens through the graph against about 500 through `rg`. The agents differ less than
  their names suggest: `codebase-memory` and `codebase-memory-auditor` declare an identical
  fourteen-tool list and are separated only by their prompts, while `-scout` drops four tools.
  All three list `mcp__codebase-memory-mcp__*` tools they cannot get if the session's MCP
  connection has dropped.

  **They do not fire in a resumed session.** Proven rather than assumed: instrumenting
  `cbm-code-discovery-gate.cmd` to touch a marker file produced nothing across a real `Grep` call,
  while invoking the exact same command line from settings.json by hand produced both the marker
  and the correct augmentation. Hooks added to `~/.claude/settings.json` mid-session are picked up
  by a genuinely new session, not by `--continue`/`--resume`. If you have just installed or
  changed a hook, start a fresh session before concluding anything about whether it works.

- **omp** (Oh My Pi) is the agent the Orca workers run on. It reads three things from
  `~/.omp/agent/`, and a dispatched worker confirmed all three from inside its own context:
  `mcp.json` (the MCP servers), `AGENTS.md` (loaded verbatim into a `<repo-rules>` block), and
  `skills/<name>/SKILL.md` (listed under `<skills>` and readable as `skill://<name>`). It also
  honours the project `.mcp.json` at the repo root, which is how Serena reaches it.

  Its `tools.xdevDocs: builtins` setting is load-bearing and measured, not assumed. The fifteen
  codebase-memory tool schemas total 20,646 characters — roughly 5–6k tokens — but the system
  prompt carries only about 2,000 characters of one-line catalogue entries for them under
  `## Additional devices (docs on demand)`; the full schema arrives only when the agent reads
  `xd://<tool>`. So adding an MCP server to omp costs a catalogue line per tool, not its schema.
  That is what makes a fifteen-tool server affordable for short-lived workers.

- **Orca orchestration** is how workers get dispatched here; `orca skills get orchestration`
  prints the version-matched guide and should be read before the first command. Two things worth
  knowing that the guide does not spell out. `task-create --deps '["<task_id>"]'` genuinely gates:
  the dependent task sits in `pending` while its dependency runs, and no worker can pick it up.
  And a `worker-start` that dies with `agent_prompt_stalled` leaves the task in `failed`, after
  which a retry is refused with `task_not_startable` — the recovery is
  `task-update --id <task> --status ready` and then `worker-start` again, which worked first time.
  Pipe only stdout when parsing `--json`: the Orca CLI writes a crashpad line to stderr that
  breaks any parser fed `2>&1`.

  Decision gates work as advertised and need no worker to try: `gate-create --task <id>
--question <text> --options '["a","b"]'` moves the task to `blocked` and the gate to `pending`,
  `gate-list` shows it, and `gate-resolve --id <gate> --resolution <text>` marks it `resolved` and
  returns the task to `ready`. That is the mechanism to use when a worker's finding needs your
  decision before the next task may start.

  From the wider `orca` CLI only a little is relevant here. `worktree current` and `worktree ps`
  are worth knowing — this machine carries five Orca worktrees of this repo and `ps` tells you
  which branch each one sits on, which matters because the graph keys its project on the worktree
  path. `terminal read`/`send`/`wait` exist for driving a non-agent shell and `file diff` opens a
  diff in the Orca editor; neither was exercised. The `repo`, `artifact` and remote-environment
  commands have no place in this repository's workflow.

  Two more things learned the hard way. A worker whose machine sleeps is simply gone: the task
  stays `dispatched` for ever, `worker-read` returns an empty transcript, `task-update` refuses
  the transition and `worker-release` answers `dispatch_inactive`, so the row cannot be closed at
  all. Do **not** judge liveness by `last_heartbeat_at` — it was set and stale on the worker that
  had died, and `None` on a worker that was demonstrably working. The reliable test is
  `worker-read --dispatch <id>`: a live worker's transcript grows new tool calls between two
  checks, a dead one returns nothing. And `ask`/`reply` does work: a worker's `orchestration ask` reached the coordinator
  as a `question` message, the `reply --id <msg_id>` came back to it in an `answer` field within
  ten seconds. Process the whole delivery batch before acknowledging it — the question arrived in
  a second batch behind an unrelated `worker_done` and two heartbeats.

- Codex is not used in this repository.
