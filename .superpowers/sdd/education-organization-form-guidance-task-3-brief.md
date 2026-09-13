# Task 3A: Статическая и контейнерная проверка

## Global constraints

- Работать в текущей ветке `main`; новую ветку не создавать.
- Ничего не менять вне четырёх целевых клиентских файлов.
- Коммиты и staging не выполнять: рабочее дерево содержит незакоммиченные пользовательские изменения.
- После любого форматирования/изменения `client/` сначала пересобрать frontend-контейнер, только затем запускать frontend verification.
- Использовать только корневой `docker-compose.yml`.

## Target files

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`
- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`
- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`

## Steps

1. Format only target files:

```powershell
npx prettier --write client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

2. Rebuild/recreate frontend before all further frontend checks:

```powershell
docker compose up -d --build --force-recreate frontend
docker compose ps
```

Expected topology: `ai_template_frontend`, `ai_template_backend`, `ai_template_postgres`, `ai_template_adminer` are running; health states match configured healthchecks.

3. Run focused Vitest:

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: 1 file, 2 tests passed, no errors/warnings.

4. Run client lint, build, format check:

```powershell
npm run lint --prefix client
npm run build --prefix client
npx prettier --check client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Expected: exit code 0 for all. Report any warnings verbatim and identify whether pre-existing.

5. Check whitespace and working-tree scope:

```powershell
git diff --check
git status --short
```

Expected: no new whitespace errors; nothing staged/committed. Do not modify or clean unrelated files.

## Report

Write full evidence to `.superpowers/sdd/education-organization-form-guidance-task-3-report.md`: each command, exit code, concise result, container states, warnings, target files changed by formatter, and final `git status` scope. Return status `DONE` or `DONE_WITH_CONCERNS`, no commit, one-line summary, concerns, report path.
