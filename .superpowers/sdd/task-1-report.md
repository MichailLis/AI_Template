# Task 1 report — schema and DTO contracts

## Status

`DONE_WITH_CONCERNS`

Task 1 and its requested review fixes are complete within the exact scoped schema/DTO/test files. Required targeted gates pass. The acknowledged downstream service implementation gap remains outside Task 1 and keeps the full server build red until Task 2 supplies `personalData`.

No files were staged or committed. Existing unrelated worktree changes were not edited.

## Delivered contracts

- Prisma enum `PersonalDataProcessingMode` with `PUBLIC` and `ON_BEHALF_OF_EDUCATION_ORGANIZATION`.
- Nullable legal/contact/document fields on `EducationOrganization`, without INN/OGRN uniqueness constraints.
- `TestPublicLink` processing mode defaulting to `PUBLIC` plus four nullable operator snapshots.
- Nullable `TestStudentAttempt.operatorEducationOrganizationId` relation with `onDelete: SetNull`, four nullable snapshots, and FK index.
- Forward migration preserving old rows, backfilling existing links to the platform `PUBLIC` operator, and leaving historical attempts nullable.
- Admin link create/update conditional mode validation.
- Admin link response exposes `personalDataProcessingMode` and all four stored operator snapshots for edit restoration/OpenAPI generation.
- Education organization create/update/response DTOs expose all new fields.
- One local reusable HTTP(S)-only URL schema is used by the policy, consent document, and logo fields in both write and response DTOs. It accepts `http`/`https` and rejects `javascript`, `data`, and `ftp`.
- Admin education organization response requires computed `personalDataReady`.
- Public access response requires reusable `PersonalDataSchema`.
- Personal-data migration assertions read only `20260710000000_add_personal_data_processing_modes/migration.sql`; prior migration assertions retain their aggregate migration source.

## Initial TDD cycle

### RED command

```powershell
npm test --prefix server -- --runInBand src/tests/dto/tests-links.dto.spec.ts src/tests/dto/tests-public.dto.spec.ts src/tests/tests-prisma-schema.spec.ts
```

Observed before initial implementation (exit 1):

```text
Test Suites: 3 failed, 3 total
Tests:       12 failed, 28 passed, 40 total
Snapshots:   0 total
Time:        3.334 s
```

Expected failures identified missing processing enum/fields, conditional DTO validation, organization URL fields, migration/FK/index/backfill, and public `personalData`.

### Initial GREEN

```text
Test Suites: 3 passed, 3 total
Tests:       40 passed, 40 total
Snapshots:   0 total
```

## Review-fix TDD cycle

### RED command

```powershell
npm test --prefix server -- --runInBand src/tests/dto/tests-links.dto.spec.ts src/tests/dto/tests-public.dto.spec.ts src/tests/tests-prisma-schema.spec.ts
```

Observed before review production changes (exit 1):

```text
FAIL src/tests/dto/tests-links.dto.spec.ts
  returns entry profile mode in admin public link response
    expected personalDataProcessingMode and four snapshots; received fields were stripped
  rejects non-HTTP organization URLs in input and response schemas: javascript:alert(1)
    Expected: false; Received: true
  rejects non-HTTP organization URLs in input and response schemas: data:text/plain,private
    Expected: false; Received: true
  rejects non-HTTP organization URLs in input and response schemas: ftp://example.edu/document
    Expected: false; Received: true
  returns the computed personal data readiness flag for an education organization
    Expected: true; Received: undefined

Test Suites: 1 failed, 2 passed, 3 total
Tests:       5 failed, 42 passed, 47 total
Snapshots:   0 total
Time:        1.914 s
```

These were the intended contract failures, not syntax/setup errors. The migration-source isolation refactor was behavior-neutral.

### Final GREEN command and output

```powershell
npm test --prefix server -- --runInBand src/tests/dto/tests-links.dto.spec.ts src/tests/dto/tests-public.dto.spec.ts src/tests/tests-prisma-schema.spec.ts
```

```text
Test Suites: 3 passed, 3 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        1.84 s, estimated 2 s
Ran all test suites matching src/tests/dto/tests-links.dto.spec.ts|src/tests/dto/tests-public.dto.spec.ts|src/tests/tests-prisma-schema.spec.ts.
```

## Required verification

### Prisma generation

Command:

```powershell
npm run prisma:generate
```

Output (exit 0):

```text
Prisma schema loaded from prisma\schema.prisma.
✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client in 418ms
```

### Migration verification

Command:

```powershell
npm run verify:prisma-migrations
```

Output (exit 0):

```text
Prisma migration verification passed.
```

### Prettier

Command:

```powershell
npx prettier --check server/src/tests/dto/tests-links.dto.ts server/src/tests/dto/tests-public.dto.ts server/src/tests/dto/tests-links.dto.spec.ts server/src/tests/dto/tests-public.dto.spec.ts server/src/tests/tests-prisma-schema.spec.ts
```

Output (exit 0):

```text
Checking formatting...
All matched files use Prettier code style!
```

## Accepted downstream concern

Command:

```powershell
npm run build --prefix server
```

Output (exit 1):

```text
src/tests/tests-public-link.service.ts:407:5 - error TS2741:
Property 'personalData' is missing ... but required in type 'PublicLinkAccessResponseDto'.

src/tests/dto/tests-public.dto.ts:172:3
  personalData: PersonalDataSchema,
  'personalData' is declared here.

Found 1 error(s).
```

The review explicitly accepts the temporary service build gap. `tests-public-link.service.ts` is outside Task 1 scope; weakening the required DTO would violate the contract. Task 2 must populate the new public response (and compute admin organization readiness downstream).

## Files changed for Task 1

- `server/prisma/schema.prisma`
- `server/prisma/migrations/20260710000000_add_personal_data_processing_modes/migration.sql`
- `server/src/tests/dto/tests-links.dto.ts`
- `server/src/tests/dto/tests-public.dto.ts`
- `server/src/tests/dto/tests-links.dto.spec.ts`
- `server/src/tests/dto/tests-public.dto.spec.ts`
- `server/src/tests/tests-prisma-schema.spec.ts`
- `.superpowers/sdd/task-1-report.md`
