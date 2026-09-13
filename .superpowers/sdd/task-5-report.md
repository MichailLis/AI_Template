# Task 5 report — public-link personal-data mode

## Status

`DONE`

Task 5 is implemented within the existing admin public-links workspace. Generated API/model files were used as read-only inputs. No files were staged or committed, and unrelated worktree changes were preserved.

## Implemented behavior

- New public-link form state defaults personal-data processing to `PUBLIC`.
- Resetting the new-link form restores `PUBLIC`, and successful creation explicitly restores that mode.
- The organization section now contains an accessible radio fieldset with Russian choices for the platform operator and processing on behalf of an education organization.
- Visible guidance explains that operator identity and document links are snapshotted when the link is saved.
- In `PUBLIC` mode, the education-organization selector remains optional for participant profile locking and group validation; copy explicitly says this does not change the operator.
- On-behalf mode requires a selected active organization whose server `personalDataReady` flag is true.
- Client validation blocks missing, inactive, or incomplete on-behalf operators with clear Russian guidance to complete legal fields in “Учебные заведения”.
- Organization options display ready/incomplete status directly from `personalDataReady`; inactive organizations are visible but disabled.
- Inline quick-create remains basic and now explains that the legal fields must be completed in “Учебные заведения” before the organization can be used as operator.
- Create payloads include `personalDataProcessingMode` and preserve the selected `educationOrganizationId` plus all existing link, consent, template, profile, attempt, and time-limit fields.

## TDD evidence

### RED

After test changes, the required frontend rebuild completed successfully:

```powershell
docker compose up -d --build --force-recreate frontend
```

Then:

```powershell
npm test --prefix client -- --run src/widgets/admin-public-links-workspace/ui
```

Observed before production edits (exit 1):

```text
Test Files  4 failed | 4 passed (8)
Tests       6 failed | 10 passed (16)
```

Expected failures showed undefined mode state/reset, ignored on-behalf eligibility, a missing payload field, invalid operator submission, and absent radio/readiness/guidance UI.

### GREEN

After production changes and the required frontend rebuild:

```powershell
npm test --prefix client -- --run src/widgets/admin-public-links-workspace/ui
```

Final output (exit 0):

```text
Test Files  8 passed (8)
Tests       16 passed (16)
Duration    9.05s
```

## Build and hygiene verification

### Client TypeScript and production build

```powershell
npm run build --prefix client
```

Output: `tsc -b && vite build`, 2238 modules transformed, exit 0.

### Targeted lint

```powershell
npm exec eslint -- src/widgets/admin-public-links-workspace/ui
```

Output: empty, exit 0.

### Prettier

```powershell
npm exec prettier -- --check src/widgets/admin-public-links-workspace/ui
```

Output (exit 0):

```text
Checking formatting...
All matched files use Prettier code style!
```

### Diff check

```powershell
git diff --check -- client/src/widgets/admin-public-links-workspace/ui
```

Output: empty, exit 0.

## Files changed for Task 5

- `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.types.ts`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.ts`
- `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.helpers.ts`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.types.ts`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-workspace.ts`
- `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`
- `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.tsx`
- `client/src/widgets/admin-public-links-workspace/ui/public-link-organization-section.tsx`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.test.tsx`
- `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.test.tsx`
- `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.helpers.test.ts`
- `client/src/widgets/admin-public-links-workspace/ui/public-link-organization-section.test.tsx`
- `.superpowers/sdd/task-5-report.md`

## Concerns

No known Task 5 concerns remain.
