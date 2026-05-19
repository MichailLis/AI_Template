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
