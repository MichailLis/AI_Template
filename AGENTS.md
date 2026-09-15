# Agent Instructions

Read `AI_GUIDE.md` first. It is the repository source of truth for implementation rules.
Claude Code additionally reads `CLAUDE.md`, which is the short form of the same rules.

## Architecture

Strict FSD on the frontend (`app → pages → widgets → features → entities → shared`, imports only
downward, cross-slice through `index.ts`). The machine-readable sources of truth are
`template/features.manifest.json` and `template/fsd.rules.json`, enforced by `scripts/verify-*.mjs`.
Read those files rather than descriptions of them.

The stack — NestJS 11, Prisma 7, React 19, Vite 7, Orval, Zustand, Tailwind 3, shadcn/ui — is
fixed on purpose: it keeps the architecture from drifting under AI-driven development. Version
bumps stay inside the current major; do not swap libraries and do not weaken a gate to make a
check pass.

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

Use raw `rg` for exact function names, error codes, config keys, constants, regexes, TODOs, and
literals. `mcp-ripgrep` is not configured: its shell quoting is broken on native Windows. Use
`npm run find:symbol -- <name>` before a rename. For consequential TypeScript references, warm the
language server with the lightweight `typescript.tsserverRequest/projectInfo` request, then use LSP
references/call hierarchy. Use Serena for symbol-bounded reads and edits. Probe and codebase-memory
are discovery aids only; confirm their results in source or with LSP before changing code.

`rtk` compresses shell output, but correctness gates and searches run directly. The fixed safe set
in `template/rtk-filters.json` is `rtk run`, `rtk err`, `rtk json`, `rtk prisma`, `rtk npm`, `rtk ls`,
and `rtk read`. Consult `CLAUDE.md` and `docs/tooling-evidence.md` for measured failure modes.

Install Serena once with `uv tool install serena-agent --from git+https://github.com/oraios/serena`.
The root `.mcp.json` calls the installed binary directly: running through `uvx --from git+…` executes
a network git fetch on every start (99s on warm cache, over 5 minutes on cold cache) and exceeds the
30-second MCP connection timeout, whereas the installed binary starts in 1.4s.

Run `npm run doctor:agent-tooling` once on a new machine to verify local tooling prerequisites,
including Serena, TypeScript language server, codebase-memory, RTK exclusions, Compose naming, and
Orval lockfile alignment.
