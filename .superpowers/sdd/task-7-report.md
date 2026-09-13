# Task 7 report — integration hardening and acceptance fixtures

## Status

`DONE`

Task 7 is complete as a behavior-preserving test split plus acceptance-fixture hardening. No production or generated files were edited. No files were staged or committed, and unrelated worktree changes were preserved.

## Implemented changes

- Moved the two newly added public-session personal-data snapshot tests into `tests-public-session.personal-data.spec.ts` without weakening or removing their assertions.
- Kept the remaining `tests-public-session.service.spec.ts` behavior unchanged; its pre-existing unrelated assertions remain intact.
- Extended the existing public-session E2E lifecycle to require the exact default PUBLIC `personalData` response:
  - `processingMode: 'PUBLIC'`
  - the exact platform full legal name
  - null short name, consent document, and logo
  - local `/privacy` policy URL
- Added a database assertion that a started default PUBLIC attempt persists a null operator organization FK and the exact platform operator snapshots.
- Updated the critical-flow public-link mock with the required `personalData` object.
- Updated the public browser smoke to explicitly check the required consent checkbox before starting the session.
- Did not touch the unrelated architecture manifest/privacy-page issues, unrelated client test failure, or generated sources listed in the brief.

## Baseline and targeted verification

### Baseline targeted session spec

Before the split:

```text
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
```

### Targeted split specs

```powershell
npm test --prefix server -- --runInBand tests-public-session.service.spec.ts tests-public-session.personal-data.spec.ts
```

Result (exit 0):

```text
Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
```

The same total of 23 session-service assertions remains after the split.

## Full verification

### Server unit suite

```powershell
npm test --prefix server -- --runInBand
```

Result (exit 0):

```text
Test Suites: 47 passed, 47 total
Tests:       306 passed, 306 total
```

### Server E2E suite

```powershell
npm run test:e2e --prefix server -- --runInBand
```

Result (exit 0):

```text
Test Suites: 5 passed, 5 total
Tests:       37 passed, 37 total
```

### Critical browser flow

```powershell
npm run verify:e2e:critical
```

Result (exit 0): client build completed with 2240 transformed modules, and all three browser smoke flows passed, including `/t/:code -> /t/:code/session/:sessionToken`.

The standalone static check also passed:

```powershell
node --check scripts/e2e-critical-flows.mjs
```

### Maintainability

```powershell
npm run verify:maintainability
```

The command still exits 1 only for the two permitted, pre-existing unrelated violations:

```text
client/src/widgets/public-test-workspace/ui/public-test-result-workspace.test.tsx: 638 effective lines (max 420)
client/src/features/tests/ui/polus/polus-public-theme.css: 2019 effective lines (max 2000)
```

`server/src/tests/tests-public-session.service.spec.ts` is no longer reported as a violation. The file is 967 physical lines; its effective non-comment/non-blank count is now below the server-spec limit of 900.

### Formatting and whitespace

- Prettier check on all four owned source/test files: exit 0, all matched files formatted.
- `git diff --check` on all owned source/test files: exit 0, no output.

## Files changed for Task 7

- `server/src/tests/tests-public-session.service.spec.ts`
- `server/src/tests/tests-public-session.personal-data.spec.ts`
- `server/test/tests-public-session.e2e-spec.ts`
- `scripts/e2e-critical-flows.mjs`
- `.superpowers/sdd/task-7-report.md`

## Remaining concerns

Only the two unrelated maintainability baseline violations listed above remain. They were intentionally left untouched per the Task 7 brief. No Task 7 regression or verification gap is known.
