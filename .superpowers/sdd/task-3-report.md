# Task 3 report — expose and persist personal-data snapshots

## Status

`DONE`

Task 3 is implemented within its public-link access and public-session attempt scope. The targeted tests, server build, Prettier check, and owned-file diff check pass. No files were staged or committed, and unrelated worktree changes were preserved.

## Implemented behavior

- Public-link access always includes the required `personalData` object.
- Operator names and document URLs come from immutable link snapshots, never mutable organization legal/contact fields.
- Legacy `PUBLIC` links fall back to the exact platform operator name and `/privacy`; their logo is always null.
- On-behalf links may expose the organization's current logo while retaining stored names and document URLs.
- The public response does not expose INN, OGRN, legal address, email, or phone.
- New on-behalf attempts copy the organization FK and all four stored operator snapshots.
- New `PUBLIC` attempts store a null operator FK and exact platform snapshots, including legacy fallback values.
- Attempt creation continues to store the link consent snapshot and active global policy version/date snapshot.
- Resuming an existing attempt performs no attempt update and therefore does not rewrite operator snapshots.
- The prior server TypeScript build gap for required `personalData` is closed.

## TDD evidence

### RED

Command:

```powershell
npm test --prefix server -- --runInBand src/tests/tests-public-link.service.spec.ts src/tests/tests-public-session.service.spec.ts
```

Observed before production edits (exit 1):

```text
Test Suites: 2 failed, 2 total
Tests:       4 failed, 43 passed, 47 total

Public access returned personalData: undefined for on-behalf and legacy PUBLIC links.
New attempts omitted the operator organization FK and all four operator snapshot fields.
```

The resume no-rewrite assertion already passed, confirming the existing resume branch did not mutate the attempt.

### GREEN

Final command after implementation and formatting:

```powershell
npm test --prefix server -- --runInBand src/tests/tests-public-link.service.spec.ts src/tests/tests-public-session.service.spec.ts
```

Output (exit 0):

```text
Test Suites: 2 passed, 2 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        2.275 s, estimated 3 s
```

## Build and hygiene verification

### Server build

```powershell
npm run build --prefix server
```

Output: `nest build`, exit 0.

### Prettier

```powershell
npm exec prettier -- --check src/tests/tests-public-link.service.ts src/tests/tests-public-link.service.spec.ts src/tests/tests-public-session.service.ts src/tests/tests-public-session.service.spec.ts src/tests/tests.spec-fixtures.ts
```

Output (exit 0):

```text
Checking formatting...
All matched files use Prettier code style!
```

### Owned-file diff check

```powershell
git diff --check -- server/src/tests/tests-public-link.service.ts server/src/tests/tests-public-link.service.spec.ts server/src/tests/tests-public-session.service.ts server/src/tests/tests-public-session.service.spec.ts server/src/tests/tests.spec-fixtures.ts
```

Output: empty, exit 0.

## Files changed for Task 3

- `server/src/tests/tests-public-link.service.ts`
- `server/src/tests/tests-public-link.service.spec.ts`
- `server/src/tests/tests-public-session.service.ts`
- `server/src/tests/tests-public-session.service.spec.ts`
- `server/src/tests/tests.spec-fixtures.ts`
- `.superpowers/sdd/task-3-report.md`

`server/src/tests/tests-public-link.query.ts` required no Task 3 change because its existing safe select already includes the snapshot-adjacent organization fields needed by mapping and excludes sensitive legal/contact fields.

## Concerns

No known Task 3 concerns remain.
