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

After changing files under `client/`, rebuild/recreate the frontend container before any
browser-level verification (`verify:template`, `verify:smoke:client`, `verify:e2e:critical`):

```powershell
docker compose up -d --build --force-recreate frontend
```

Host-level checks — Vitest, ESLint, `tsc` — do not need a container rebuild.

## Gates

- `npm run verify:local` — daily loop, needs a running PostgreSQL.
- `npm run verify:template` — release gate, required before finalizing branch state.

## Tooling

Use `rtk` to keep shell output small: `rtk test <cmd>`, `rtk lint`, `rtk tsc`, `rtk vitest`,
`rtk prisma`, `rtk git diff`, `rtk grep`.

Codex is not used in this repository.
