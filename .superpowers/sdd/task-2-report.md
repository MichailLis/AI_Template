# Task 2 report — resolve and snapshot personal-data operators

## Status

`DONE_WITH_CONCERNS`

Task 2 is implemented within its exact backend service/query/mapper/test scope. The required targeted tests, Prettier check, and owned-file diff check pass. The only broader server build failure is the explicitly accepted Task 3 gap: the public access response does not yet populate required `personalData`.

No files were staged or committed. Existing unrelated worktree changes were preserved.

## Classification and scope

- Change classification: `existing-feature-change`
- Owning feature/module: `tests`
- Prisma owners consumed: `EducationOrganization`, `TestPublicLink`
- Manifest impact: none
- Generator decision: no Nest generator and no generated client edits
- Branch: `main`

## Implemented behavior

- Added one local `resolvePersonalDataOperator` boundary.
- `PUBLIC` resolves to the exact platform full name, `/privacy`, null short name/consent/logo/operator organization ID, and does not query an organization.
- `ON_BEHALF_OF_EDUCATION_ORGANIZATION` requires an existing active organization with nonblank trimmed `fullName`, `shortName`, and `privacyPolicyUrl`.
- Missing, inactive, and incomplete organizations return clear Russian `NotFoundException`/`BadRequestException` messages.
- Optional consent-document and logo URLs are normalized when present.
- Education organization create persists all ten nullable fields after trimming and converts blank values to null.
- Education organization update trims only provided fields and preserves omitted fields.
- Education organization list/create/update mapping returns all fields and computes `personalDataReady` from active + nonblank full/short/policy values.
- Public-link create defaults to `PUBLIC`, preserves an optional profile-lock organization, and atomically stores mode plus four snapshots.
- Public-link create in on-behalf mode resolves the selected organization and stores its immutable snapshot.
- Public-link update loads existing mode, organization ID, and four snapshots.
- Operator snapshots refresh only when the effective processing mode or organization actually changes; unrelated updates leave snapshot columns untouched.
- Switching to `PUBLIC` writes platform snapshots; switching/changing on-behalf mode resolves the effective selected organization.
- Admin link mapping returns mode and all four snapshots.
- Internal organization includes contain the legal/document fields needed by subsequent mapping without adding them to the current public response.
- Public `personalData` response and attempt snapshot copying remain untouched for Task 3.

## TDD evidence

### RED

Command:

```powershell
npm test --prefix server -- --runInBand src/tests/tests-personal-data-operator.spec.ts src/tests/tests-education-organization.service.spec.ts src/tests/tests-public-link.service.spec.ts
```

Observed before production edits (exit 1):

```text
FAIL src/tests/tests-personal-data-operator.spec.ts
  Cannot find module './tests-personal-data-operator'

FAIL src/tests/tests-education-organization.service.spec.ts
  list response omitted legal/contact/document fields and personalDataReady
  create did not persist normalized nullable fields
  update did not persist provided normalized fields

FAIL src/tests/tests-public-link.service.spec.ts
  organization create omitted new nullable fields
  PUBLIC and on-behalf link creation omitted mode/snapshots
  incomplete on-behalf operator was not rejected before persistence
  update did not refresh snapshots on mode/organization changes

Test Suites: 3 failed, 3 total
Tests:       9 failed, 18 passed, 27 total
Snapshots:   0 total
Time:        2.547 s
```

The failures were the expected missing Task 2 contracts, not unrelated infrastructure errors.

### GREEN

Final command after implementation and formatting:

```powershell
npm test --prefix server -- --runInBand src/tests/tests-personal-data-operator.spec.ts src/tests/tests-education-organization.service.spec.ts src/tests/tests-public-link.service.spec.ts
```

Output (exit 0):

```text
Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        1.93 s, estimated 2 s
Ran all test suites matching src/tests/tests-personal-data-operator.spec.ts|src/tests/tests-education-organization.service.spec.ts|src/tests/tests-public-link.service.spec.ts.
```

## Required hygiene verification

### Prettier

Command:

```powershell
npx prettier --check server/src/tests/tests-personal-data-operator.ts server/src/tests/tests-personal-data-operator.spec.ts server/src/tests/tests-education-organization.service.ts server/src/tests/tests-education-organization.service.spec.ts server/src/tests/tests-public-link.query.ts server/src/tests/tests-public-link.mapper.ts server/src/tests/tests-public-link.service.ts server/src/tests/tests-public-link.service.spec.ts server/src/tests/tests.spec-fixtures.ts
```

Output (exit 0):

```text
Checking formatting...
All matched files use Prettier code style!
```

### Owned-file diff check

Command:

```powershell
git diff --check -- server/src/tests/tests-personal-data-operator.ts server/src/tests/tests-personal-data-operator.spec.ts server/src/tests/tests-education-organization.service.ts server/src/tests/tests-education-organization.service.spec.ts server/src/tests/tests-public-link.query.ts server/src/tests/tests-public-link.mapper.ts server/src/tests/tests-public-link.service.ts server/src/tests/tests-public-link.service.spec.ts server/src/tests/tests.spec-fixtures.ts
```

Output: empty, exit 0.

## Accepted concern

Command:

```powershell
npm run build --prefix server
```

Output (exit 1):

```text
src/tests/tests-public-link.service.ts:464:5 - error TS2741:
Property 'personalData' is missing ... but required in type 'PublicLinkAccessResponseDto'.

src/tests/dto/tests-public.dto.ts:172:3
  personalData: PersonalDataSchema,
  'personalData' is declared here.

Found 1 error(s).
```

This is the explicitly accepted temporary Task 3 integration gap. Task 2 was instructed not to implement public `personalData` or attempt snapshot copying.

## Files changed for Task 2

- `server/src/tests/tests-personal-data-operator.ts`
- `server/src/tests/tests-personal-data-operator.spec.ts`
- `server/src/tests/tests-education-organization.service.ts`
- `server/src/tests/tests-education-organization.service.spec.ts`
- `server/src/tests/tests-public-link.query.ts`
- `server/src/tests/tests-public-link.mapper.ts`
- `server/src/tests/tests-public-link.service.ts`
- `server/src/tests/tests-public-link.service.spec.ts`
- `server/src/tests/tests.spec-fixtures.ts`
- `.superpowers/sdd/task-2-report.md`
