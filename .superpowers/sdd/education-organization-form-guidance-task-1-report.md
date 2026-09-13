# Task 1 report: UX contract tests for education-organization forms

## Status

DONE — RED phase only. No production code was modified, and no files were staged or committed.

## Changed file

- `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx`

The create-card test now specifies the required accessible labels, required semantics, optional-field labels, exact approved explanatory copy, and placeholders. It retains the three existing fieldset checks and the `type="url"` assertion using the new accessible name.

The edit-card test now specifies the required name semantics and placeholder, the full-name value and placeholder, the non-required privacy-policy field, and the logo placeholder. It retains the server-readiness badge assertion.

## Exact RED command

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Before running the focused test, the frontend container was rebuilt/recreated as required by the repository contract:

```powershell
docker compose up -d --build --force-recreate frontend
```

## RED result

- Test file: 1 failed.
- Tests: 2 failed, 0 passed.
- Create-card failure: Testing Library could not find a control labelled `Название *` at line 79.
- Edit-card failure: Testing Library could not find a control labelled `Название *` at line 147.

These are expected missing-feature assertion failures. The rendered DOM confirms the current implementation still exposes `Название` without the visible `*`; it also shows the old create placeholder `Например: Колледж №1` and old edit placeholder `Название учебного заведения`, with no requested `required` contract. Vitest completed normal transform, setup, import, render, and test execution, so there was no syntax, module-resolution, or environment/setup error.

## Self-review

- Scope is limited to the one test file named in the brief plus this required report.
- No production file, dependency, CSS token, route, Prisma model, or backend API was changed.
- Only `Название *` is asserted as HTML-required.
- `Полное наименование *`, `Сокращённое наименование *`, and `Политика обработки ПДн *` are explicitly asserted not required.
- All seven specified optional controls use the exact `— необязательно` accessible names and are asserted not required.
- All exact placeholder strings from the brief are covered in create/edit tests.
- Existing grouped-fieldset coverage, URL input-type coverage, and readiness-badge coverage remain present; the obsolete warning assertion was replaced by the exact approved helper sentence.
- No staging or commit was performed.

## Concerns

- The target test file was already untracked before this task, so Git cannot show a baseline diff for it; the existing assertions were preserved while adding the requested contract.
- Because each test stops at its first missing accessible label, later placeholder and required-semantic assertions will become observable incrementally during the GREEN implementation. This is expected for the requested RED phase.

## Review correction evidence

The blocking review issue was corrected in `education-organizations-cards.test.tsx`:

- Replaced the partial case-insensitive helper regex with an exact text assertion for `* — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить и заполнить позже.`
- Removed the obsolete assertion for `Неполную или неактивную организацию нельзя использовать...`.

After rebuilding/recreating the frontend container, the exact focused command was rerun unchanged:

```powershell
npm run test:run --prefix client -- src/widgets/admin-education-organizations-workspace/ui/education-organizations-cards.test.tsx
```

Corrected RED result on 2026-07-10:

- Test file: 1 failed.
- Tests: 2 failed, 0 passed.
- Create-card failure: missing accessible label `Название *` at line 79.
- Edit-card failure: missing accessible label `Название *` at line 146.
- The rendered DOM still exposes `Название` without `*` and the old placeholders, confirming missing UI behavior rather than a syntax, import, rendering, or test-environment error.
- No production file was touched; no staging or commit was performed.
