# Task 2 report: маркировка и placeholders

## Status

DONE. Production UI changes are implemented and the focused card test is GREEN. No files were staged and no commit was created.

## Files changed

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`
  - Added the required `placeholder` and optional `operatorRequired` configuration fields.
  - Added the approved labels, placeholders, and helper copy for all operator fields.
  - Required-looking operator labels use a visible `*`; optional labels use `— необязательно`.
- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
  - Updated the name label and placeholder; added HTML `required` to the name input only.
- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`
  - Updated the name label and placeholder; added HTML `required` to the name input only.

The covering test was not modified in this task.

## Formatting

Command:

```powershell
npx prettier --write client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx
```

Output:

```text
client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx 138ms
client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx 27ms
client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx 41ms
```

## GREEN verification

The required frontend container rebuild completed successfully before frontend verification:

```powershell
docker compose up -d --build --force-recreate frontend
```

Focused test command, run after Prettier:

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Exact result:

```text
Test Files  1 passed (1)
     Tests  2 passed (2)
  Duration  2.95s
```

Exit code: `0`. No warnings or errors were emitted.

## Required-semantics confirmation

- The create and edit `Название *` inputs are the only inputs in the three scoped production files with the HTML `required` attribute.
- No input rendered by `EducationOrganizationOperatorFields` has the HTML `required` attribute.
- `Полное наименование *`, `Сокращённое наименование *`, and `Политика обработки ПДн *` are visible operator-required labels only.

## Self-review

- Checked every configured field against the brief: exact label spelling, exact placeholder, field order, group titles, autocomplete values, URL types, and layout classes are preserved.
- Confirmed existing IDs, names, values, event handlers, disabled behavior, fieldsets, legends, buttons, readiness badges, and validation fields were not changed by Task 2.
- Confirmed the implementation adds no dependencies, routes, CSS tokens, backend/API changes, Prisma changes, staging, or commits.
- Concerns: none within Task 2 scope. The shared worktree remains dirty with pre-existing user and sibling-task changes, which were preserved.
