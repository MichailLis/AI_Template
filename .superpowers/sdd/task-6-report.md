# Task 6 report — public operator and consent disclosure

## Status

`DONE`

Task 6 is implemented within the existing public-test workspace for both STANDARD and POLUS entry pages. Generated API/model files were used as read-only inputs. No files were staged or committed, and unrelated worktree changes were preserved.

## Implemented behavior

- Every pre-test entry form now renders a persistent operator block in STANDARD education, STANDARD demographic, and POLUS layouts.
- PUBLIC mode identifies the snapshotted platform operator by `operatorFullName` and uses the provided `/privacy` URL as a normal same-tab link.
- On-behalf mode explicitly says processing is performed on behalf of the education organization, always shows its full legal name, and also shows the short name when supplied.
- Optional organization logos have meaningful operator-specific alt text, compact non-dominant sizing, and are omitted when `logoUrl` is null.
- Privacy consent now receives the generated `personalData` snapshot and uses its policy URL without platform fallback.
- A separate consent-document link appears only when `consentDocumentUrl` is non-null.
- External HTTP(S) document links open with `target="_blank"` and `rel="noreferrer"`; local `/privacy` links stay in the current tab.
- Consent remains controlled, initially unchecked, and is now explicitly marked `required`. Existing submit-layer blocking and the `consentAccepted: true` request contract remain covered by their regression tests.
- No sensitive organization fields, modal, route, global CSS, dependency, or generated-file edit was added.

## TDD evidence

### RED

After adding the operator, consent, and STANDARD/POLUS wiring tests, the required frontend rebuild completed successfully:

```powershell
docker compose up -d --build --force-recreate frontend
```

Then the focused test command failed as expected (exit 1):

```powershell
npm run test:run -- src/widgets/public-test-workspace/ui/public-personal-data-operator.test.tsx src/widgets/public-test-workspace/ui/public-privacy-consent.test.tsx src/widgets/public-test-workspace/ui/public-test-entry-workspace.test.tsx src/widgets/public-test-workspace/ui/public-test-registration-card.test.tsx src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx
```

Observed before production edits:

```text
Test Files  3 failed | 2 passed (5)
Tests       4 failed | 4 passed (8)
```

Expected failures showed the missing operator component, missing required/dynamic consent behavior, and absent persistent operator disclosure in both STANDARD and POLUS.

### GREEN

After production edits, formatting-only adjustments, and the required final frontend rebuild:

```powershell
docker compose up -d --build --force-recreate frontend
```

The final focused suite, including submit-contract regressions, passed (exit 0):

```text
Test Files  7 passed (7)
Tests       20 passed (20)
Duration    17.49s
```

## Build and hygiene verification

### Client TypeScript and production build

```powershell
npm run build
```

Output: `tsc -b && vite build`, 2240 modules transformed, exit 0.

### Targeted lint

ESLint was run against the twelve Task 6 source/test files. Output: empty, exit 0.

### Prettier

Prettier was run against the same Task 6 file set:

```text
Checking formatting...
All matched files use Prettier code style!
```

### Diff check

`git diff --check` was run against the Task 6 public-workspace files. Output: empty, exit 0.

## Files changed for Task 6

- `client/src/widgets/public-test-workspace/ui/public-document-link.ts`
- `client/src/widgets/public-test-workspace/ui/public-personal-data-operator.tsx`
- `client/src/widgets/public-test-workspace/ui/public-personal-data-operator.test.tsx`
- `client/src/widgets/public-test-workspace/ui/public-privacy-consent.tsx`
- `client/src/widgets/public-test-workspace/ui/public-privacy-consent.test.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-registration-card.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-registration-card.test.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`
- `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.test.tsx`
- `client/src/widgets/public-test-workspace/ui/polus/polus-public-entry.tsx`
- `.superpowers/sdd/task-6-report.md`

## Concerns

No known Task 6 concerns remain.
