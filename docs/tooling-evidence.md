# Tooling Evidence and Measurements

This document records the empirical measurements, benchmarks, and experimental findings behind the tool choices in this repository. Operational rules and invariants are in `CLAUDE.md`.

## 1. Serena (TypeScript LSP via MCP)

Serena provides symbolic navigation over the TypeScript Language Server (`find_symbol`, `find_referencing_symbols`, `find_implementations`, `get_diagnostics_for_file`, `rename_symbol`, `safe_delete_symbol`).

### Calibration and Usage Triggers

In a measured development session, Serena was invoked once against 341 grep calls. "Prefer Serena generally" does not reflect actual developer decisions. Serena is reached for on two specific triggers:

1. **The name is not unique across the repo.** `getMaxChoices` exists in `client/src/features/tests/lib/` and in `server/src/tests/session/answer-validation.ts` as two different implementations of one rule. Grep returns 14 hits and cannot distinguish which tree owns which; `find_referencing_symbols` scoped to the server file returns the one real call site. Getting this wrong previously caused the client copy to drift from the server authority.
2. **Moving or deleting an exported symbol.** Grep shows lines; Serena names the enclosing method, which reveals whether the move is safe.

For a symbol whose name is unique, grep is correct and approximately four times cheaper. Roughly a quarter of the measured session's greps were identifier lookups; the rest were paths, flags, UI strings, and pipelines filtering command output, where Serena does not apply.

### Tool Friction

- **Deferred tool loading:** Tools are deferred, so the first invocation incurs a schema fetch before the query itself runs.
- **Inconsistent parameter names:** Parameter names differ across sibling tools: `find_symbol` and `safe_delete_symbol` take `name_path_pattern`, whereas `find_referencing_symbols` takes `name_path`. Passing the wrong parameter name fails validation.

### Lightweight Navigation and Scaling

- `get_symbols_overview` returns a file's entire symbol inventory for approximately 200 bytes — the ten symbols of `server/src/tests/session/answer-validation.ts` cost 1/50th of reading the file.
- `find_symbol` with `depth: 1` returns a class with its members and their line ranges, the cheapest way to answer what methods a controller defines.
- `search_for_pattern` is a path-preserving grep; `restrict_search_to_code_files: true` drops documentation hits that `rg` returns.
- **Reference histograms on large blast radius:** For a symbol with many references, passing a small `max_answer_chars` causes `find_referencing_symbols` (tested on `ensureAdminAccess`) to overflow at 27K characters and degrade to a compact per-file reference histogram (18 files, 73 references) for well under a kilobyte. Size the blast radius from that, then drill into the files that matter. For a normally-called function, the knowledge graph remains the better answer to the same question (naming all 42 calling methods grouped by service class).
- **Worst-case rename verification:** `rename_symbol` was spot-checked against the graph's worst case (`mapQuestionToPromptPayload`) and handled it completely: it rewrote the declaration, both imports, and all three `.map(fn)` call sites across three files — exactly the usage for which the knowledge graph records zero edges. Its "N changes applied" message counts files, not individual occurrences.
- **Multi-line pattern search:** `search_for_pattern` with `multiline: true` expresses patterns requiring `rg -U`: a regex over controller files matching a HTTP method decorator through `async <name>(` without an `@ApiResponse` in between returned exactly one handler (`AuthController.logout`), matching the graph Cypher query.
- **Large file scaling:** On the generated API client (116 KB), `search_for_pattern` succeeds without issue (19 hits with line numbers for 1.7 KB), whereas `get_symbols_overview` overflows and falls back to counts by kind (88 constants, 87 variables, 40 functions).

### CRLF Safety of Editing Tools

The repository's TypeScript files use CRLF line endings. Serena's editing tools (`insert_after_symbol`, `replace_symbol_body`, `replace_in_files`, `insert_before_symbol`, `replace_content`) were tested with input containing bare `\n`. In every case, output was written with `\r\n` (0 bare LF introduced), avoiding `\r\r\n` corruption.

- `replace_in_files` with `dry_run: true` returns prospective changes as line diffs with occurrence IDs; re-issuing with `occurrence_ids` applies only selected changes.

### 0-Based Line Numbers

Serena's line numbers are 0-based. For example, `getMaxChoices` sits at line 26 for `rg`, `sed`, and the graph, but at line 25 for Serena. Carrying a Serena line number into `sed -n` requires adding 1.

### Diagnostics and Typechecking

`get_diagnostics_for_file` returns compiler errors grouped by enclosing symbol for one file. Since `npm run typecheck` checks the entire server in ~5 seconds, single-file diagnostics are useful to filter out unrelated noise rather than for speed.

### Worker Availability and OMP Integration

The root `.mcp.json` declares Serena, and OMP honors it alongside `~/.omp/agent/mcp.json`, mounting 22 Serena tools in worker sessions. An earlier decision kept Serena away from short-lived workers because each one paid ~3000 tokens of schemas it never used; that reason has since gone, since OMP's `tools.xdevDocs: builtins` keeps MCP schemas on demand. What remains is the process cost: each worker spawns `uvx serena start-mcp-server` and a TypeScript language server. This is worthwhile because a worker asked to find every use of a symbol needs the one tool that does not miss callbacks.

### Role of `.serena/memories/`

Files under `.serena/memories/` serve only as a thin orientation map. Architectural rules belong in `AI_GUIDE.md`; duplicate rule files were removed to eliminate drift. `scripts/verify-ai-guide.mjs` validates paths inside `.serena/memories/`.

---

## 2. codebase-memory (Knowledge Graph)

`codebase-memory` maintains a local knowledge graph in `~/.cache/codebase-memory-mcp/` (6.7k nodes, 23.8k edges in this worktree).

### Watcher Latency and Freshness

With `auto_index` enabled, each worktree indexes as its own project keyed on its path. In live testing, symbols from a newly created file appeared in the graph 11.2 seconds after write, and disappeared approximately 1 second after file deletion.

### Transitive Call Chains

For call-chain depth, `trace_path(direction="inbound", include_tests=true)` on `getMaxChoices` returned 5 callers ranked by distance:

- Hop 1: `validatePublicAnswerPayload`
- Hop 2: `saveAnswers`
- Hop 3: `finishSession`
  Verified against source: line 97 in `validatePublicAnswerPayload`, `server/src/tests/session/public-session.service.ts` line 232 in `saveAnswers`, and line 297 in `finishSession`.

### Whole-Tree Structural Queries

A Cypher query comparing 58 HTTP handlers against 115 Swagger decorators identified the single handler carrying `@ApiOperation` without `@ApiResponse` (`AuthController.logout`), which is enforced by repository invariant 4.

### Prisma Models in Graph

`server/prisma/schema.prisma` is indexed: models appear as `Class`, enums as `Enum`, and columns as `Field`.

### Duplicate Implementation Detection (`SIMILAR_TO`)

Duplicate-implementation candidates via `SIMILAR_TO` (507 edges, 279 of them cross-file). It identified `getUniqueOptionValue` in `client/src/features/tests/lib/ai-generator-parse.ts` and `getUniqueValue` in `client/src/features/tests/lib/tests-utils.ts` at Jaccard 1.0 (byte-identical except parameter names). Filter on `same_file = "false"` and expect the top of the list to be Orval boilerplate (`withQueryKey` repeated across four generated files). Note that `getMaxChoices` client and server implementations share no `SIMILAR_TO` edge between them — it is a heuristic lead-generator, not an exhaustive audit.

### Data Flow and Semantic Queries

- `trace_path` with `mode: "data_flow"` records argument expressions at each hop (`getMaxChoices` receives `question.settings`, `finishSession` receives `attempt.topicVersion.questions`).
- `semantic_query` uses vector embeddings with cosine similarity alongside BM25 `query`. For locating unfamiliar functionality where the exact symbol name is unknown, `search_graph query=` uses BM25 ranking (which put `scoreProfOrientationV3Plus` second), whereas `rg -i score` returns 180 lines across 52 files and ranks nothing.
- Function complexity properties (`complexity`, `cognitive`, `loop_depth`, `transitive_loop_depth`, `linear_scan_in_loop`) are queryable. For example, `verifyFsdRules` is flagged for linear scan inside a loop due to calling `hasPrefixMatch` while iterating over client files.

### The `include_tests: true` Trap

The indexer classifies paths containing `tests` as test code. In this repository, `tests` is core business logic. Out of 985 nodes flagged as test code, 736 are business code (`topics.service.ts`, `topics.controller.ts`, `analysis.service.ts`, `scoring.ts`, all of `client/src/features/tests/`, and 102 nodes of generated test APIs), comprising 11% of the graph.
Calling `trace_path` on `getMaxChoices` without `include_tests: true` returned 0 callers; with `include_tests: true`, it returned all 5 callers. Traces without this flag return incorrect negative results.

### Graph Schema Traps

- **`DECORATES` edge direction:** Method points to Decorator (`(m:Method)-[:DECORATES]->(d:Decorator)`). The inverse query returns 0 rows.
- **Decorator nodes:** One node per decorator name (19 total) with no argument payload (the graph knows a method has `@Get`, but not its route path).
- **Route nodes:** Generated from client/test call sites, not server route tables (`path` and `file_path` are null).
- **Absence of cross-service edges:** Only 6 `HTTP_CALLS` edges exist across the graph (runtime base-URL probe, test fixtures, OpenRouter calls). Not one links client to server: `trace_path` with `mode: "cross_service"` from `adminControllerGetUsers` stops at `customInstance`. The cause is structural — Orval funnels every call through one Axios wrapper with a templated URL, and Nest paths live in decorator arguments the graph does not keep. Splitting them does not help: with `client/` and `server/` indexed as two separate projects (3717 and 1897 nodes) the schema still carries no `CROSS_*` edge type of any kind, and the same trace still stops at `customInstance`. Nor does a second whole copy help: another git worktree of this repository indexed as its own project (6370 nodes, 22776 edges) again reports 21 edge types and no `CROSS_*`, `cross_service` from the first project still ends at `customInstance`, and a query in the first project for any node whose path belongs to the second returns zero. Projects are sealed off from one another. Nor do the routes improve — a server-only project yields 26 `Route` nodes that still have null `file_path` and `source`.

### Main Checkout Indexing Failure (5 Disproven Hypotheses)

`index_repository` on the main checkout root (`C:/Users/admin/Documents/WebAI/AI_Template`) fails silently in both `full` and `fast` modes with nothing but `status: "error"` and a generic "Pipeline failed. Check repo_path exists and contains source files" — and `CBM_LOG_LEVEL=debug` adds not one extra line. The worktree at `orca/workspaces/AI_Template/sargassum` indexes fine, and so does every part of the main checkout taken separately. Five explanations were tested and none holds:

1. _Cyrillic folder names:_ A scratch repo containing Cyrillic names indexed without issue.
2. _Scale:_ It is not scale — 1256 non-ignored files against the worktree's 939; subfolders index fine.
3. _Specific top-level directories:_ Every part of the main checkout taken separately indexes without complaint — `server/` alone gives 1664 nodes, and `01_брендинг`, `Design`, `docs`, `graphify-out`, and `output` each index successfully in isolation.
4. _Git worktrees parent repository:_ Reproduced in a scratch repository with attached worktrees; the scratch repo indexed without issue.
5. _Oversized files:_ The largest root file is 1.1 MB.
   Only the root itself fails, and it fails silently.

### Index Coverage and Limitations

- `check_index_coverage` returns `freshness: "metadata_changed"` for valid, unmodified files, and `status: "no_recorded_issue"` for non-existent paths. Its `parse_partial` and `excluded` statuses are reliable; the freshness recommendation should be ignored.
- `search_code` takes `limit` (default 10) but lacks an `offset` parameter, and runs in ~730 ms vs ~10 ms for ripgrep.
- **Daemon lifecycle:** A single shared daemon serves clients. When its last client disconnects, the daemon terminates. Sessions can lose MCP access mid-run; the fallback is `codebase-memory-mcp.exe cli <tool> '<json>'` (~1.9 s cold start). Subagents declaring explicit MCP tools in frontmatter retain access.
- **Cypher subset:** No multi-hop `EXISTS { ... }`, `NOT (a)<-[:X]-()` is rejected, and `id()`, `MATCH path = ...`, and property-to-property comparisons are unsupported.
- **Callback invisibility:** Functions passed as callbacks (e.g., `.map(fn)`) have no inbound `CALLS` edges (`mapQuestionToPromptPayload` has 3 call sites in 2 services and 0 inbound edges; `normalizeCorsOrigin` has only `DEFINES`). Consequently, automated dead-code detection produces false positives.
- **Stubs and noisy aspects:** `ingest_traces` returns a stub message ("Runtime edge creation from traces not yet implemented"). `get_architecture` with `aspects: ["file_tree"]` returns 227 rows of plain directory listing for 9.7 KB, which `Glob` gives you for a fraction. And its `layers`/`boundaries` analysis is derived from a package heuristic that does not fit this tree (reporting `src` as one undifferentiated "internal" layer). `manage_adr` is rejected to avoid duplicate rule storage.
- `index_status` reports what the indexer could not fully parse; today that is `client/nginx/default.conf` (all 54 lines) and one line in each `.env*.example`. Grep those rather than trusting the graph on them.

---

## 3. rtk (Command Output Filter)

`rtk` wraps shell command execution to reduce token overhead.

### Command Rewriting via PreToolUse Hook

A global `PreToolUse` hook on `Bash` silently rewrites commands: `rg` -> `rtk rg`, `cat` -> `rtk read`, `git` -> `rtk git`, `ls` -> `rtk ls`, `grep` -> `rtk grep`, `npm` -> `rtk npm`, `docker` -> `rtk docker`, and `npx tsc` -> `rtk tsc`.

- Confirmed via `rtk gain --history`.
- Commands wrapped as `timeout <cmd> > file 2>&1 </dev/null` bypass rewriting.
- `rtk test <cmd>`, `rtk lint`, `rtk vitest`, `rtk prisma`, and `rtk git diff` provide high compression.

### PATH Requirements and Execution Behavior

- `rtk` requires `rg` on PATH. Without ripgrep, fallback execution corrupts search results (reported 0 matches for a symbol present 3 times, and stripped newlines when reading 12 lines).
- `rtk rg` executes ripgrep; `rtk grep` attempts to call native `grep` (which fails on Windows PowerShell with `Failed to resolve 'grep' via PATH` and returns nothing).
- **Explicit path required:** `rtk rg` drops the file names only when you give it no path to search. `rtk rg getMaxChoices` returns the matching lines with no path and no line number; add `-n` and you get `114:`, `20:`, `26:` with nothing saying which file, which is worse than either. Pass an explicit path and both come back: `rtk rg -n getMaxChoices server/src` is byte-for-byte what raw `rg -n` prints (202 against 204). So the rule is simply always give `rtk rg` a path argument — and expect no saving from it, because there is none. rtk pays on command output instead: test runs, linters.
- **Pipeline hang:** `rtk rg <pattern> | wc -l` hangs indefinitely. Redirecting stdin (`rtk rg <pattern> </dev/null | wc -l`) resolves the hang.
- **Version 0.46+:** Versions prior to 0.40 truncated `git push` output, reporting partial branch names as successful pushes when remote updates had not occurred.

### The `rtk tsc` Decoy Failure and Fix

Executing `rtk tsc` shells out to `npx tsc`. When `tsc` is not on PATH, `npx` installs the unassociated npm `tsc` decoy package, whose output rtk interprets as a clean compilation:

- On a test project with 3 deliberate type errors, `tsc` exits 2 and reports errors; `rtk tsc` prints `TypeScript: No errors found`.
- **Resolution:** Add `"npx tsc"` and `"tsc"` to `hooks.exclude_commands` in `%APPDATA%\rtk\config.toml`. Filter configurations in `.rtk/filters.toml` do not prevent the wrong binary from running.
- In this repository, use `npm run typecheck`.

### Filter Evaluation Across 14 Builtin Subcommands

- **Unsafe (reports success on failure or corrupts output):**
  - `rtk tsc`: Reports "No errors found" without running the compiler.
  - `rtk find`: Exits 0 with empty output when directory does not exist.
  - `rtk tree`: Fails on Windows argument parsing ("слишком много параметров") and exits 0.
  - `rtk playwright`: Outputs `PASS (0) FAIL (0)` for non-existent test files.
  - `rtk read -l aggressive`: Strips function bodies and closing braces, generating invalid syntax.
  - `rtk wc`: Drops missing files from multi-file counts and reports partial sums.
  - `rtk vitest` / `rtk jest`: Outputs `PASS (0) FAIL (0)` when filter matches no tests, and obscures configuration errors.
- **Use with care:**
  - `rtk git diff`: Strips context lines, producing diffs incompatible with `git apply`.
  - `rtk lint`: Crashes internal Rust deserializer on ESLint syntax errors.
- **Safe:** `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, `rtk ls`, and `rtk read` (without `-l aggressive`).

### Subcommand Failure Sweep

- Testing 11 stack subcommands with deliberate failures:
  - Honest errors: `docker`, `psql`, `npx`, `format`, `pipe`, `log`, `smart`, `curl`.
  - Uninformative: `prettier` (0 bytes), `summary` (empty line).
  - Actively misreporting: `playwright`, `tree`.
- Sweep of 25 subcommands with missing binaries:
  - Absent tools (`docker`, `psql`, `npx`, `playwright`, `wget`, `grep`, `cargo`, `aws`, `pnpm`, `ruff`, `oc`, `glab`, `wc`) correctly reported `rtk: Failed to resolve '<tool>' via PATH`.
  - Present tools (`kubectl`, `dotnet`, `gh`, `log`, `smart`, `summary`, `curl`) passed failures through.

### Compression Statistics and Discovery

- `rtk discover` is worth running for the adoption picture — 3610 Bash commands over 7 sessions, only 1.3% actually routed through rtk, because the hook leaves wrapped commands alone — but read its advice with care: four of its top ten recommendations are `rtk grep`, `rtk tsc`, `rtk find` and `rtk wc`, every one of which is on the never-use list above. It ranks by tokens saved, not by whether the answer is true.
- `rtk learn` just replays past command corrections; 19 KB of output and nothing actionable here.
- `rtk gain --failures` showed 138 parse failures with 100% claimed recovery, completely omitting `tsc` silent failures (rtk read the decoy banner as a clean run, so it does not count this as a failure at all).
- Where the underlying tool does run, the compression is real: `rtk gain --project` reports 857K tokens saved over 936 commands in this worktree, 72.5% average (primarily from linter and test suite runs, while `rtk git diff` on an all-insertions diff saved 8% because there is no unchanged context to strip).

---

## 4. Claude Code Hooks

Installing `codebase-memory` configured seven hooks in `~/.claude/settings.json` via three `.cmd` shims calling `codebase-memory-mcp hook-augment`.

### Hook Overhead and Latencies

| Hook                                          | Injected Payload                                     | Measured Latency |
| --------------------------------------------- | ---------------------------------------------------- | ---------------- |
| `SessionStart` (startup/resume/clear/compact) | 806 B (project index status, tier router)            | ~1.8 s           |
| `SubagentStart`                               | 810 B (subagent context)                             | 1.8 s            |
| `PreToolUse` on `Grep`                        | 440–630 B (matching graph symbols)                   | ~1.8 s           |
| `PreToolUse` on `Glob`                        | 1190 B, matched on a word inside the glob, so vaguer | 1.9 s            |
| `PostToolUse` on `Read`                       | 0 B (empty output)                                   | 1.7 s            |

- `PreToolUse` on `Grep` provides useful graph symbol context.
- `PostToolUse` on `Read` injects no content while adding ~1.7 s latency to every read.
- Each hook incurs a ~1.8 s cold start against a 5 s hook timeout. No `Bash` matcher exists.

### Skill and Agent Evaluation

- The skill and the three agents it also installs are cheap but oversold. The skill body is 5.1 KB (~1300 tokens) and loads only when invoked; its opening line claims graph tools cost "~500 tokens vs ~80K for grep", which does not describe this tree — the `getMaxChoices` question cost about 320 tokens through the graph against about 500 through `rg`. The agents differ less than their names suggest: `codebase-memory` and `codebase-memory-auditor` declare an identical fourteen-tool list and are separated only by their prompts, while `-scout` drops four tools.
- `codebase-memory-scout` completed a symbol lookup (`parseSliderSettings`) in 9 tool calls (~30k tokens), enforcing coverage checks and source fallbacks.

### Inactivity in Resumed Sessions

Hooks configured in `~/.claude/settings.json` do not execute in sessions resumed with `--continue` or `--resume`.

- Testing with marker file instrumentation in `cbm-code-discovery-gate.cmd` confirmed hooks fire only in newly initiated sessions.
- Subagents spawned from a resumed session inherit this inactive state (`SubagentStart` and `PreToolUse` do not trigger).

---

## 5. omp (Oh My Pi) Runtime

OMP workers load configuration from three files:

- `~/.omp/agent/mcp.json` (MCP servers)
- `~/.omp/agent/AGENTS.md` (injected into `<repo-rules>`)
- `~/.omp/agent/skills/<name>/SKILL.md` (surfaced under `<skills>`)
- Root `.mcp.json` (repository-level MCP definitions, mounting Serena)

### `tools.xdevDocs: builtins` Context Optimization

The 15 `codebase-memory` tool schemas total 20,646 characters (~5–6k tokens). Under `tools.xdevDocs: builtins` (implemented in `tools/xdev.ts`), the system prompt includes only ~2,000 characters of catalog entries under `## Additional devices (docs on demand)`. Full schemas load only when reading `xd://<tool>`, keeping MCP tools lightweight for short-lived worker dispatches.

---

## 6. Orca Orchestration

Orca provides multi-agent worker orchestration.

### Task Lifecycle and Gating

- `task-create --deps '["<task_id>"]'` enforces execution order: dependent tasks remain `pending` until prerequisites complete.
- `gate-create` moves tasks to `blocked` until `gate-resolve` returns them to `ready`.
- A worker launch failing with `agent_prompt_stalled` leaves the task in `failed`. Executing `task-update --id <task> --status ready` allows successful re-launch.

### Terminal and Worktree Management

- `worktree ps` lists active worktrees and branches.
- `terminal list` and `terminal read` work and are worth knowing: the first showed the nine live terminals on this machine with their handles and titles; the second returns a `terminal` object whose `tail` carries the live output — 826 characters of a running omp worker's screen — beside `status`, `returnedLineCount` and `oldestCursor`/`nextCursor`/`latestCursor` for paging. One trap: pass a truncated handle and it fails with `terminal_handle_stale`, which misnames the problem — the handle is not stale, it is incomplete, and the full UUID from `terminal list` works.
- `terminal wait` operates on agent TUIs, timing out on standard PowerShell prompts.
- `terminal stop` is scoped strictly per-worktree (`--worktree`), which stops all terminals in the worktree including the active session.

### Worker Termination

- Individual workers are terminated using `orca orchestration worker-stop --dispatch <id>`.
- `worker-stop` may return `dispatch_inactive` even when termination succeeds. Verification must be performed via `worker-show`, confirming `termination_reason: operator_close` and `stage: process_exited`.

### Deadlock on Machine Sleep and Liveness Detection

If the host sleeps during a worker run, the worker process may terminate while the dispatch remains active:

- The task remains `dispatched`, `worker-read` returns an empty transcript, and state transitions via `task-update` are rejected with `task_not_startable — cannot move ... while Dispatch <id> is active`.
- `last_heartbeat_at` is unreliable for liveness (observed as set and stale on dead workers, and `None` on active workers).
- The authoritative liveness check is transcript growth across successive calls to `worker-read --dispatch <id>`.

### Inter-Agent Communication and JSON Parsing

- `orca orchestration ask` sends questions to the coordinator, and `reply --id <msg_id>` returns answers in ~10 seconds. Delivery batches must be processed completely before acknowledgment.
- When parsing Orca CLI output with `--json`, parse `stdout` exclusively; crashpad messages emitted to `stderr` break JSON deserialization if streams are merged.

---

## 7. Comprehensive Tool Selection Matrix

| Objective                                      | Recommended Tool                                     | Rationale                                                                                                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check if symbol name is unique                 | `npm run find:symbol -- <name>`                      | Instant check across repo, flags client/server drift, routes to Serena or `rg`.                                                                                                        |
| Who uses this symbol (pre-refactor/delete)     | Serena `find_referencing_symbols`                    | Resolves callback uses (`.map(fn)`) and names enclosing methods.                                                                                                                       |
| Transitive call chain and hop distance         | Graph `trace_path(include_tests=true)`               | Ranks callers by distance; requires `include_tests: true` to avoid false negatives.                                                                                                    |
| Locate unfamiliar functionality by concept     | Graph `search_graph query=` / `semantic_query`       | BM25 put `scoreProfOrientationV3Plus` second; `rg -i score` returns 180 lines across 52 files and ranks nothing. Vector ranking surfaces relevant symbols without exact name matching. |
| Global architectural properties                | Graph `query_graph`                                  | Cypher query evaluates relationships across the entire tree (e.g. Swagger decorators).                                                                                                 |
| Unique symbol lookup                           | `rg --with-filename`                                 | Direct text search is ~4x cheaper than AST lookups when name is unique.                                                                                                                |
| Literals, UI text, config keys, non-code files | `rg`                                                 | Graph and Serena do not index non-code text.                                                                                                                                           |
| Read specific located function                 | `sed -n 'a,bp'`                                      | Reading targeted lines is ~2.4x cheaper than full symbol snippet queries.                                                                                                              |
| Single-file compiler diagnostics               | Serena `get_diagnostics_for_file`                    | Isolates one file's errors without full build output.                                                                                                                                  |
| Full server typechecking                       | `npm run typecheck`                                  | Direct compiler invocation; bypasses `rtk tsc` decoy package failure.                                                                                                                  |
| File symbol inventory / class members          | Serena `get_symbols_overview`, `find_symbol depth:1` | ~200 bytes output vs reading multiple kilobytes of source code.                                                                                                                        |
| Filter command output                          | `rtk` (safe filters only)                            | Compresses test and linter outputs; avoid filters that mask errors (`tsc`, `find`, `wc`, `vitest`).                                                                                    |
