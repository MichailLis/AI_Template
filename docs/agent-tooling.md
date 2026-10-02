# Agent tooling on this machine

Loaded on demand. `AGENTS.md` is the rule body every agent reads in full; this document holds
what is specific to the tools installed on a development machine. Probe and codebase-memory are
machine-local MCP servers; `.mcp.json` ships only Serena. Measurements behind every statement
here live in `docs/tooling-evidence.md`.

## Choosing a tool

Without waiting for the user to name a tool, select one from the task's evidence need:

- For a bounded implementation search when the symbol name is unknown, call Probe `search_code`
  once to find candidates. For broader architecture or relationship discovery in the indexed tree,
  use codebase-memory `search_graph` / `trace_path` instead; call `list_projects` before its first
  use, pass `include_tests: true` to traces, and check coverage for cited files. Graph negatives
  and stale coverage are not proof of absence.
- For complete TypeScript symbol bodies use Serena `find_symbol`; for usages, callers, or a
  rename/move/delete impact claim, use the direct TypeScript LSP if available, otherwise call
  Serena `find_referencing_symbols` scoped to the declaration before claiming completeness.
  Inspect the returned references: imports and type mentions are not calls. Verify consequential
  conclusions in source. Plain exact-name lookups do not require a structural call.
- For token usage or savings questions, run codeburn (`status` for totals, `context` / `optimize`
  for attribution) rather than estimating from shell output. Check the latest covered date against
  the requested period: its summary cache can lag raw Codex logs. Report cached input separately
  and do not attribute aggregate savings to one tool without comparable per-call evidence.

Use raw `rg` for exact function names, error codes, config keys, constants, regexes, TODOs, and
literals. `mcp-ripgrep` is not configured: its shell quoting is broken on native Windows. Use
`npm run find:symbol -- <name>` before a rename. When a direct TypeScript LSP tool is available, warm
it with the lightweight `typescript.tsserverRequest/projectInfo` request before consequential
references/call-hierarchy work. In Codex sessions without that direct tool, use Serena references
and implementations, then confirm consequential results in source with raw `rg`. Use Serena for
symbol-bounded reads and edits. Probe and codebase-memory are discovery aids only; confirm their
results in source or with an available LSP before changing code.

`rtk` compresses shell output, but correctness gates and searches run directly. The fixed safe set
in `template/rtk-filters.json` is `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, and
`rtk read`. On native Windows, `rtk ls` fails without a Unix `ls`; use `rg --files` or
`Get-ChildItem` instead. Consult `docs/tooling-evidence.md` for measured failure
modes.

Install Serena once with `uv tool install serena-agent --from git+https://github.com/oraios/serena`.
The root `.mcp.json` calls the installed binary directly: running through `uvx --from git+…` executes
a network git fetch on every start (99s on warm cache, over 5 minutes on cold cache) and exceeds the
30-second MCP connection timeout, whereas the installed binary starts in 1.4s.

Run `npm run doctor:agent-tooling` once on a new machine to diagnose the RTK policy and hook
exclusions, Serena, root TypeScript, TypeScript Language Server, codebase-memory, Compose naming,
Orval lockfile alignment, and Prisma package alignment. It is not a gate and exits 0 even when it
reports problems, so inspect every status line and directly smoke-test critical tools.

## Tool reference

- **Tool selection:**

  | Question                                      | Reach for                                         | Why                                                                   |
  | --------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
  | Is the symbol name unique (first step)        | **`npm run find:symbol -- <name>`**               | Fast, no binaries, flags client/server drift, routes to Serena or rg. |
  | Who uses it — before a rename, move or delete | **TypeScript LSP** (`references`, call hierarchy) | Warm with lightweight `projectInfo`; finds callers the graph misses.  |
  | How deep does the call chain go               | **graph** `trace_path` with `include_tests: true` | Only tool that ranks by hop. Absence proves nothing.                  |
  | One implementation, name unknown              | **Probe** `search_code`                           | Bounded discovery; verify in source.                                  |
  | Where is X handled across modules             | **graph** `search_graph query=`                   | Ranked discovery in the indexed tree; check coverage.                 |
  | A property of the whole tree                  | **graph** `query_graph`                           | Grep and Serena cannot express it.                                    |
  | Exact names, codes, keys, constants, regexes  | **raw `rg --with-filename`**                      | Cheapest exact evidence; native Windows MCP wrapper is unreliable.    |
  | Literals, UI strings, config, non-code files  | **`rg`**                                          | Not in the graph.                                                     |
  | Read/edit a located function                  | **Serena**                                        | Symbol-bounded and preserves CRLF.                                    |
  | Compiler errors in one file                   | **Serena** `get_diagnostics_for_file`             | `npm run typecheck` is faster for the whole server.                   |
  | Typecheck the whole server                    | **`npm run typecheck`**                           | Correctness gate; do not put a compression parser in the path.        |
  | File structure / CRLF-safe symbol edit        | **Serena** (`replace_*`, `get_symbols_overview`)  | Avoids `\r\r\n` corruption.                                           |
  | Command output                                | **rtk**, safe filters only                        | Several filters report failure as success (below).                    |
  | Agent token use or savings                    | **codeburn** `status` / `context` / `optimize`    | Check freshness; separate cache; do not infer per-tool savings.       |

- **TypeScript language server:** answers "who uses this symbol" locally. A blind cold query can be incomplete. When a direct TypeScript LSP tool is available, call `workspace/executeCommand` with `typescript.tsserverRequest`, command `projectInfo`, and `needFileNameList: false`; then query references/call hierarchy. In Codex without that direct tool, use Serena references/implementations and confirm consequential results in source with raw `rg`. The direct warm-up produced 11/11 references in three fresh processes without the 114 KB file list.

- **Serena** (MCP over TypeScript LSP):
  - `find_symbol` and `safe_delete_symbol` take `name_path_pattern`; `find_referencing_symbols` takes `name_path`.
  - Its editing tools (`replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`, `replace_in_files`, `replace_content`) preserve CRLF; scripts that guess line endings can write `\r\r\n`.
  - Its line numbers are 0-based: add 1 before using them with `rg` or `sed -n`.
  - Evidence: `docs/tooling-evidence.md#1-serena`.

- **Probe:** for bounded unknown-name discovery, call `search_code` once; use `extract_code` when Serena cannot read a located block. The configured rc339 MCP lacks the documented `query`/`symbols` tools, its `grep` wrapper rejects supported-looking context flags, and fuzzy searches can be noisy. Exact claims require raw `rg`; reference claims require LSP/Serena.

- **codebase-memory** (MCP knowledge graph):
  - Always pass `include_tests: true` to `trace_path`: the indexer treats every `tests` path as test code, and here `tests` is product code.
  - `DECORATES` points method → decorator: `(m:Method)-[:DECORATES]->(d:Decorator)`.
  - Bare callbacks (`.map(fn)`) get no inbound `CALLS` edges, so caller traces and dead-code detection miss them.
  - `Route` nodes are not the route table; use `template/features.manifest.json` and `server/openapi.json`.
  - No client-to-server edges: `cross_service` tracing stops at `customInstance`.
  - Graph results are derived evidence. `check_index_coverage` can report `metadata_changed` even after a successful reindex, while the watcher may already contain the edit. Confirm consequential positives in source; treat every negative as unproven and force reindex when needed.
  - Evidence: `docs/tooling-evidence.md#2-codebase-memory`.

- **rtk** (compresses command output):
  - Historical versions masked failures in several parsers. In 0.48.0, most tested exit codes propagated, but `rtk vitest` hung on a zero-match filter and `rtk tree` returned success on an argument error. Do not use RTK for gates or evidence-producing searches.
  - The complete denylist remains explicit for the documentation gate: `rtk tsc`; `rtk vitest` and `rtk jest`; `rtk playwright`; `rtk find`; `rtk wc`; `rtk tree`; and `rtk read -l aggressive`.
  - **Use with care:** `rtk git diff` (strips context, breaks `git apply`), `rtk lint` (crashes on ESLint syntax errors).
  - **Safe filters:** `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, `rtk read` (without `-l aggressive`). On native Windows, `rtk ls` fails without Unix `ls`; use `rg --files` or PowerShell `Get-ChildItem`.
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

- **Codex/Beads hooks:** `bd prime` context was observed in both a fresh and resumed Codex task. Hook exit zero alone is not proof; inspect injected context when validating lifecycle behavior.
