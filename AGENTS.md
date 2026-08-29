# Agent Instructions

Read `AI_GUIDE.md` first. It is the repository source of truth for implementation rules.

For normal Docker startup, use only the root `docker-compose.yml`:

```powershell
docker compose up -d
```

The expected runtime topology is four separate containers:

- `ai_template_frontend`
- `ai_template_backend`
- `ai_template_postgres`
- `ai_template_adminer`

Do not use `.devcontainer/docker-compose.devcontainer.yml` to run the project for the user. The devcontainer compose file is only for VS Code "Reopen in Container" workflows and should not replace the normal project Docker stack.

After changing files under `client/`, rebuild/recreate the frontend container before frontend-related verification:

```powershell
docker compose up -d --build --force-recreate frontend
```

The project Codex hook in `.codex/hooks.json` enforces this before frontend-related tests.

<!-- RTK_START -->

## RTK - Rust Token Killer

Use RTK for verbose shell commands when compact output is useful.

This project has a Codex PreToolUse hook that rewrites supported shell commands through RTK automatically.

Prefer explicit `rtk` prefixes for commands that often produce large output, especially if the hook is unavailable:

```powershell
rtk git status
rtk git diff
rtk npm test
rtk docker compose ps
rtk find "pattern" .
```

Use raw commands when exact, unfiltered output is required, or when RTK does not support the command well on native Windows.

RTK is a CLI helper, not an MCP server. If no dedicated RTK tool appears in the tool list, use it through the shell command tool.

<!-- RTK_END -->

@RTK.md
