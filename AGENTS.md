# Agent Instructions

Read `AI_GUIDE.md` first. It is the repository source of truth for implementation rules.
Claude Code additionally reads `CLAUDE.md`, which is the short form of the same rules.

## Architecture

Strict FSD on the frontend (`app → pages → widgets → features → entities → shared`, imports only
downward, cross-slice through `index.ts`). The machine-readable sources of truth are
`template/features.manifest.json` and `template/fsd.rules.json`, enforced by `scripts/verify-*.mjs`.
Read those files rather than descriptions of them.

The stack — NestJS 11, Prisma 7, React 19, Vite 8, Orval, Zustand, Tailwind 4, shadcn/ui — is
fixed on purpose: it keeps the architecture from drifting under AI-driven development. Version
bumps stay inside the current major; do not swap libraries and do not weaken a gate to make a
check pass.

Tailwind 4 uses the supported `@tailwindcss/postcss` pipeline and the existing HSL theme via
`@config`; preserve custom shadcn components and `tailwindcss-animate`. CSS support starts at
Safari 16.4, Chrome 111, and Firefox 128. Tailwind 5 requires a separately approved migration.
Existing `space-x-*`/`space-y-*` classes retain v3 visible-sibling margins through supported
CSS compatibility utilities; new flex/grid layouts should use `gap`. Keep existing gradients
in sRGB and preserve the legacy named palette shades used by privacy/status surfaces.

## Docker runtime

For normal startup, use only the root `docker-compose.yml`:

```powershell
docker compose up -d
```

The expected runtime topology is four separate containers:

- `ai_template_frontend`
- `ai_template_backend`
- `ai_template_postgres`
- `ai_template_adminer`

Do not use `.devcontainer/docker-compose.devcontainer.yml` to run the project. That compose file
exists only for the VS Code "Reopen in Container" workflow and is not the project runtime topology.

The project name is pinned in `docker-compose.yml` with `name: ai_template`, ensuring that any
checkout or worktree targets the exact same project and containers. Parallel compose stacks are
not possible because `container_name` values are fixed globally.

Browser-level gates (`verify:template`, `verify:e2e:critical`) build the client independently via
`vite preview` and do not use Docker. Rebuilding/recreating the frontend container is required
only for manual browser testing on `http://localhost:5173`:

```powershell
docker compose up -d --build --force-recreate frontend
```

Host-level checks — Vitest, ESLint, `tsc` — do not need a container rebuild.

## Gates

- `npm run verify:local` — daily loop, needs a running PostgreSQL.
- `npm run verify:template` — release gate, required before finalizing branch state.

## Tooling

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
`Get-ChildItem` instead. Consult `CLAUDE.md` and `docs/tooling-evidence.md` for measured failure
modes.

Install Serena once with `uv tool install serena-agent --from git+https://github.com/oraios/serena`.
The root `.mcp.json` calls the installed binary directly: running through `uvx --from git+…` executes
a network git fetch on every start (99s on warm cache, over 5 minutes on cold cache) and exceeds the
30-second MCP connection timeout, whereas the installed binary starts in 1.4s.

Run `npm run doctor:agent-tooling` once on a new machine to diagnose the RTK policy and hook
exclusions, Serena, root TypeScript, TypeScript Language Server, codebase-memory, Compose naming,
Orval lockfile alignment, and Prisma package alignment. It is not a gate and exits 0 even when it
reports problems, so inspect every status line and directly smoke-test critical tools.
