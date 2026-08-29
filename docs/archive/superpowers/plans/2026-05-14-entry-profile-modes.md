# Entry Profile Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selectable public-test entry profile modes: `DEMOGRAPHIC` for the new profile questionnaire and `EDUCATION` for the current education-based questionnaire.

**Architecture:** Store the selected entry profile mode on each public link, keep `/t/:code` routes unchanged, and branch only inside the public entry form and session-start service. Store demographic profile fields directly on `TestStudentAttempt`; keep education-mode fields supported and nullable so existing records and new demographic records can coexist.

**Tech Stack:** NestJS, Prisma 7, PostgreSQL, nestjs-zod, Swagger/OpenAPI, Orval, React 19, Vite, TanStack Query, Vitest, Jest.

---

## Approved Decisions

- Use mode names exactly: `DEMOGRAPHIC` and `EDUCATION`.
- Use neutral wording in UI, DTO names, comments, and docs: `EDUCATION`, "анкета по учебным данным", and "текущая анкета по учебным данным".
- `DEMOGRAPHIC` profile fields:
  - `gender`: `MALE` or `FEMALE`
  - `age`: integer
  - `residence`: free text
  - `educationLevel`: one of:
    - `BASIC_GENERAL`
    - `SECONDARY_GENERAL`
    - `SECONDARY_SPECIAL`
    - `INCOMPLETE_HIGHER_FROM_YEAR_3`
    - `HIGHER`
- `EDUCATION` profile fields are the current fields:
  - `studentName`
  - `studentLastInitial`
  - `studentMiddleInitial`
  - `educationOrganization`
  - `groupOrClass`
- `DEMOGRAPHIC` public links must use `maxAttemptsPerStudent = 1`.
- Because `DEMOGRAPHIC` mode has no stable personal identifier, the implementation must not deduplicate different people by demographic fields. Each demographic session gets attempt number `1` and a random session-scoped key hash. This means "1 attempt" is a link setting and UI/API rule, not a strong anti-repeat identity check.

---

## File Structure

### Backend data model

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_entry_profile_modes/migration.sql`

### Backend DTOs and services

- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.mapper.ts`
- Modify: `server/src/tests/tests-domain.utils.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests-attempt.mapper.ts`
- Modify: `server/src/tests/tests.spec-fixtures.ts`

### Backend tests

- Create: `server/src/tests/dto/tests-public.dto.spec.ts`
- Modify: `server/src/tests/dto/tests-links.dto.spec.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`
- Modify: `server/src/tests/tests-admin-attempt.service.spec.ts`

### Generated API

- Regenerate under:
  - `server/openapi.json`
  - `client/src/shared/api/generated/tests-public/tests-public.ts`
  - `client/src/shared/api/generated/tests/tests.ts`
  - `client/src/shared/api/model/*`

### Frontend public test entry

- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.types.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-registration-card.tsx`
- Create: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`
- Modify tests:
  - `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts`
  - `client/src/widgets/public-test-workspace/ui/public-test-registration-card.test.tsx`
- Create test:
  - `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`

### Frontend admin public links

- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.types.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.types.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-access-settings-section.tsx`

### Frontend admin stats

- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`
- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx`

---

## Task 1: Add Prisma schema and migration

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_entry_profile_modes/migration.sql`

- [ ] **Step 1: Update Prisma enums and models**

In `server/prisma/schema.prisma`, add these enums near the existing test enums:

```prisma
enum TestEntryProfileMode {
  DEMOGRAPHIC
  EDUCATION
}

enum TestStudentGender {
  MALE
  FEMALE
}

enum TestStudentEducationLevel {
  BASIC_GENERAL
  SECONDARY_GENERAL
  SECONDARY_SPECIAL
  INCOMPLETE_HIGHER_FROM_YEAR_3
  HIGHER
}
```

In `TestPublicLink`, add:

```prisma
entryProfileMode       TestEntryProfileMode @default(EDUCATION)
```

In `TestStudentAttempt`, change the education-mode fields to nullable and add demographic fields:

```prisma
studentName           String?
studentLastInitial    String?
studentMiddleInitial  String?
educationOrganization String?
groupOrClass          String?
studentGender         TestStudentGender?
studentAge            Int?
studentResidence      String?
studentEducationLevel TestStudentEducationLevel?
```

- [ ] **Step 2: Generate the migration**

Run from repository root with the normal Docker stack or another configured local Postgres available:

```powershell
npm run prisma:generate
Set-Location server
npx prisma migrate dev --name entry_profile_modes --schema prisma/schema.prisma
Set-Location ..
```

Expected: a new directory appears under `server/prisma/migrations/` and Prisma Client generation succeeds.

- [ ] **Step 3: Verify migration content**

Open the generated migration and confirm it includes the equivalent of:

```sql
CREATE TYPE "TestEntryProfileMode" AS ENUM ('DEMOGRAPHIC', 'EDUCATION');
CREATE TYPE "TestStudentGender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "TestStudentEducationLevel" AS ENUM ('BASIC_GENERAL', 'SECONDARY_GENERAL', 'SECONDARY_SPECIAL', 'INCOMPLETE_HIGHER_FROM_YEAR_3', 'HIGHER');

ALTER TABLE "test_public_links" ADD COLUMN "entryProfileMode" "TestEntryProfileMode" NOT NULL DEFAULT 'EDUCATION';

ALTER TABLE "test_student_attempts"
  ALTER COLUMN "studentName" DROP NOT NULL,
  ALTER COLUMN "studentLastInitial" DROP NOT NULL,
  ALTER COLUMN "studentMiddleInitial" DROP NOT NULL,
  ALTER COLUMN "educationOrganization" DROP NOT NULL,
  ALTER COLUMN "groupOrClass" DROP NOT NULL,
  ADD COLUMN "studentGender" "TestStudentGender",
  ADD COLUMN "studentAge" INTEGER,
  ADD COLUMN "studentResidence" TEXT,
  ADD COLUMN "studentEducationLevel" "TestStudentEducationLevel";
```

- [ ] **Step 4: Run schema generation check**

Run:

```powershell
npm run prisma:generate
```

Expected: command exits with code `0`.

- [ ] **Step 5: Commit the schema/migration slice**

Run:

```powershell
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat: add public test entry profile schema"
```

---

## Task 2: Add backend DTO contracts and DTO tests

**Files:**

- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Create: `server/src/tests/dto/tests-public.dto.spec.ts`
- Modify: `server/src/tests/dto/tests-links.dto.spec.ts`

- [ ] **Step 1: Write public DTO tests**

Create `server/src/tests/dto/tests-public.dto.spec.ts`:

```ts
import {
  PublicLinkAccessResponseSchema,
  PublicSessionStartRequestSchema,
} from './tests-public.dto';

describe('tests public DTO schemas', () => {
  it('accepts a demographic start payload', () => {
    const result = PublicSessionStartRequestSchema.parse({
      entryProfileMode: 'DEMOGRAPHIC',
      gender: 'FEMALE',
      age: 17,
      residence: 'Казань',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    });

    expect(result).toMatchObject({
      entryProfileMode: 'DEMOGRAPHIC',
      gender: 'FEMALE',
      age: 17,
      residence: 'Казань',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    });
  });

  it('accepts an education start payload', () => {
    const result = PublicSessionStartRequestSchema.parse({
      entryProfileMode: 'EDUCATION',
      studentName: 'Иван',
      studentLastInitial: 'П',
      studentMiddleInitial: 'С',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      consentAccepted: true,
    });

    expect(result).toMatchObject({
      entryProfileMode: 'EDUCATION',
      studentName: 'Иван',
      studentLastInitial: 'П',
      studentMiddleInitial: 'С',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      consentAccepted: true,
    });
  });

  it('exposes entry profile mode in public link access response', () => {
    const result = PublicLinkAccessResponseSchema.parse({
      shortCode: 'DEMO2026',
      title: 'Профориентация',
      description: null,
      entryProfileMode: 'DEMOGRAPHIC',
      educationOrganization: null,
      groupValidationMode: 'NONE',
      groupValidationPattern: null,
      groupValidationExample: null,
      groupValidationHint: null,
      questionCount: 10,
      maxAttemptsPerStudent: 1,
      timeLimitMinutes: 30,
      allowResume: true,
      startsAt: null,
      endsAt: null,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
  });
});
```

- [ ] **Step 2: Extend `tests-public.dto.ts`**

In `server/src/tests/dto/tests-public.dto.ts`, add reusable schemas:

```ts
export const EntryProfileModeSchema = z.enum(['DEMOGRAPHIC', 'EDUCATION']);
export const PublicStudentGenderSchema = z.enum(['MALE', 'FEMALE']);
export const PublicStudentEducationLevelSchema = z.enum([
  'BASIC_GENERAL',
  'SECONDARY_GENERAL',
  'SECONDARY_SPECIAL',
  'INCOMPLETE_HIGHER_FROM_YEAR_3',
  'HIGHER',
]);
```

Replace `PublicStudentProfileSchema` with an optional-field contract that remains service-validated by mode:

```ts
export const PublicStudentProfileSchema = z.object({
  entryProfileMode: EntryProfileModeSchema.optional(),
  studentName: z.string().trim().min(1).max(200).optional(),
  studentLastInitial: z.string().trim().min(1).max(1).optional(),
  studentMiddleInitial: z.string().trim().min(1).max(1).optional(),
  educationOrganization: z.string().trim().min(1).max(300).optional(),
  groupOrClass: z.string().trim().min(1).max(120).optional(),
  gender: PublicStudentGenderSchema.optional(),
  age: z.number().int().min(1).max(120).optional(),
  residence: z.string().trim().min(1).max(300).optional(),
  educationLevel: PublicStudentEducationLevelSchema.optional(),
  consentAccepted: z.literal(true),
});
```

Add `entryProfileMode` to `PublicLinkAccessResponseSchema`:

```ts
  entryProfileMode: EntryProfileModeSchema,
```

- [ ] **Step 3: Extend admin link DTO schemas**

In `server/src/tests/dto/tests-links.dto.ts`, import or duplicate the mode schema from `tests-public.dto.ts`:

```ts
import {
  EntryProfileModeSchema,
  PublicSessionAnalysisProviderModeSchema,
  PublicSessionAnalysisStatusSchema,
  PublicSessionStatusSchema,
  PublicStudentEducationLevelSchema,
  PublicStudentGenderSchema,
} from './tests-public.dto';
```

Add `entryProfileMode` to create/update/admin response schemas:

```ts
entryProfileMode: EntryProfileModeSchema.optional(),
```

for create/update request schemas, and:

```ts
entryProfileMode: EntryProfileModeSchema,
```

for `AdminPublicLinkSchema`.

Update `AdminPublicAttemptSummarySchema` and `AdminPublicAttemptDetailResponseSchema` so education fields are nullable and demographic fields are included:

```ts
entryProfileMode: EntryProfileModeSchema,
studentName: z.string().nullable(),
studentLastInitial: z.string().nullable(),
studentMiddleInitial: z.string().nullable(),
educationOrganization: z.string().nullable(),
groupOrClass: z.string().nullable(),
studentGender: PublicStudentGenderSchema.nullable(),
studentAge: z.number().int().nullable(),
studentResidence: z.string().nullable(),
studentEducationLevel: PublicStudentEducationLevelSchema.nullable(),
```

- [ ] **Step 4: Add DTO tests for admin links**

In `server/src/tests/dto/tests-links.dto.spec.ts`, add:

```ts
import { AdminCreatePublicLinkSchema, AdminPublicLinkSchema } from './tests-links.dto';

describe('tests link DTO profile mode fields', () => {
  it('accepts DEMOGRAPHIC public link creation input', () => {
    const result = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
  });

  it('returns entry profile mode in admin public link response', () => {
    const result = AdminPublicLinkSchema.parse({
      id: 1,
      publishedVersionId: 10,
      topicId: 2,
      educationOrganizationId: null,
      educationOrganizationName: null,
      entryProfileMode: 'EDUCATION',
      shortCode: 'CODE2026',
      shortUrl: '/t/CODE2026',
      isActive: true,
      archivedAt: null,
      startsAt: null,
      endsAt: null,
      maxAttemptsPerStudent: 1,
      timeLimitMinutes: null,
      allowResume: true,
      consentVersion: 'v1',
      consentText: 'Согласие',
      title: 'Тест',
      updatedAt: '2026-05-14T10:00:00.000Z',
      createdAt: '2026-05-14T10:00:00.000Z',
    });

    expect(result.entryProfileMode).toBe('EDUCATION');
  });
});
```

If the file already imports these schemas, merge imports instead of duplicating them.

- [ ] **Step 5: Run DTO tests and verify the expected failure first**

Run:

```powershell
npm run test --prefix server -- tests-public.dto.spec.ts tests-links.dto.spec.ts
```

Expected before implementation: tests fail on missing schema fields. After Steps 2-3: tests pass.

- [ ] **Step 6: Commit DTO contracts**

Run:

```powershell
git add server/src/tests/dto/tests-public.dto.ts server/src/tests/dto/tests-links.dto.ts server/src/tests/dto/tests-public.dto.spec.ts server/src/tests/dto/tests-links.dto.spec.ts
git commit -m "feat: add public test entry profile DTOs"
```

---

## Task 3: Persist entry profile mode on public links

**Files:**

- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.mapper.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`

- [ ] **Step 1: Extend the public link service mock test for DEMOGRAPHIC attempts**

In `server/src/tests/tests-public-link.service.spec.ts`, extend `PrismaTestPublicLinkDelegate`:

```ts
type PrismaTestPublicLinkDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
};
```

Extend the `beforeEach` mock:

```ts
testPublicLink: {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
},
```

Add this test:

```ts
it('createPublicLink stores DEMOGRAPHIC mode with one allowed attempt', async () => {
  prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
  prismaMock.testPublicLink.create.mockResolvedValue({
    id: 100,
    topicVersion: {
      id: 50,
      topicId: 7,
      title: 'Профориентация',
    },
    educationOrganization: null,
    shortCode: 'DEMO2026',
    isActive: true,
    archivedAt: null,
    startsAt: null,
    endsAt: null,
    maxAttemptsPerStudent: 1,
    timeLimitMinutes: null,
    allowResume: true,
    entryProfileMode: 'DEMOGRAPHIC',
    consentVersion: 'v1',
    consentTextSnapshot: 'Согласие',
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
  });

  prismaMock.testTopicVersion = {
    findUnique: jest.fn().mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    }),
  } as never;

  const result = await service.createPublicLink(7, {
    publishedVersionId: 50,
    shortCode: 'DEMO2026',
    entryProfileMode: 'DEMOGRAPHIC',
    maxAttemptsPerStudent: 5,
    consentVersion: 'v1',
    consentText: 'Согласие',
  });

  expect(prismaMock.testPublicLink.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        entryProfileMode: 'DEMOGRAPHIC',
        maxAttemptsPerStudent: 1,
      }),
    }),
  );
  expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
  expect(result.maxAttemptsPerStudent).toBe(1);
});
```

If `prismaMock` is typed too narrowly for `testTopicVersion`, widen the local mock type only in this spec file.

- [ ] **Step 2: Add mapper field**

In `server/src/tests/tests-public-link.mapper.ts`, add:

```ts
entryProfileMode: link.entryProfileMode,
```

to the object returned by `mapAdminPublicLink`.

- [ ] **Step 3: Store mode and force one attempt for DEMOGRAPHIC creates**

In `server/src/tests/tests-public-link.service.ts`, add:

```ts
const DEFAULT_ENTRY_PROFILE_MODE = 'EDUCATION';

const resolveMaxAttemptsForEntryProfileMode = (
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION',
  requestedMaxAttempts: number | undefined,
) => {
  if (entryProfileMode === 'DEMOGRAPHIC') {
    return 1;
  }

  return requestedMaxAttempts ?? DEFAULT_MAX_ATTEMPTS;
};
```

In `createPublicLink`, before `create`:

```ts
const entryProfileMode = dto.entryProfileMode ?? DEFAULT_ENTRY_PROFILE_MODE;
const maxAttemptsPerStudent = resolveMaxAttemptsForEntryProfileMode(
  entryProfileMode,
  dto.maxAttemptsPerStudent,
);
```

In the `data` object:

```ts
entryProfileMode,
maxAttemptsPerStudent,
```

Replace the old direct `maxAttemptsPerStudent: dto.maxAttemptsPerStudent ?? DEFAULT_MAX_ATTEMPTS`.

- [ ] **Step 4: Preserve the one-attempt rule on updates**

In `updatePublicLink`, fetch `entryProfileMode` and `maxAttemptsPerStudent` with the existing link:

```ts
const existing = await this.prisma.testPublicLink.findUnique({
  where: { id: linkId },
  select: { id: true, archivedAt: true, entryProfileMode: true, maxAttemptsPerStudent: true },
});
```

After the existing not-found checks:

```ts
const entryProfileMode = dto.entryProfileMode ?? existing.entryProfileMode;
const maxAttemptsPerStudent =
  entryProfileMode === 'DEMOGRAPHIC'
    ? 1
    : (dto.maxAttemptsPerStudent ?? existing.maxAttemptsPerStudent);
```

In the update `data` object:

```ts
...(dto.entryProfileMode !== undefined ? { entryProfileMode } : {}),
maxAttemptsPerStudent,
```

Remove the old conditional `maxAttemptsPerStudent` spread.

- [ ] **Step 5: Include mode in public link access response**

In `getPublicLinkAccessByCode`, add:

```ts
entryProfileMode: link.entryProfileMode,
```

- [ ] **Step 6: Run public link tests**

Run:

```powershell
npm run test --prefix server -- tests-public-link.service.spec.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit public link service changes**

Run:

```powershell
git add server/src/tests/tests-public-link.service.ts server/src/tests/tests-public-link.mapper.ts server/src/tests/tests-public-link.service.spec.ts
git commit -m "feat: store public test entry profile mode"
```

---

## Task 4: Start sessions in DEMOGRAPHIC and EDUCATION modes

**Files:**

- Modify: `server/src/tests/tests-domain.utils.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests.spec-fixtures.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`

- [ ] **Step 1: Add a random-session key hash helper**

In `server/src/tests/tests-domain.utils.ts`, add:

```ts
export const buildAnonymousAttemptKeyHash = (resumeToken: string) => {
  return createHash('sha256').update(`anonymous-attempt|${resumeToken}`).digest('hex');
};
```

- [ ] **Step 2: Update fixtures**

In `server/src/tests/tests.spec-fixtures.ts`, add `entryProfileMode` to `AccessibleLinkFixture`:

```ts
entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION';
```

Set the default fixture to education mode:

```ts
  entryProfileMode: 'EDUCATION',
```

Extend `createPublicSessionStartDto` with the new optional request fields:

```ts
  entryProfileMode: 'EDUCATION',
```

Add a demographic fixture helper:

```ts
export const createPublicDemographicSessionStartDto = (
  overrides: Partial<PublicSessionStartRequestDto> = {},
): PublicSessionStartRequestDto => ({
  entryProfileMode: 'DEMOGRAPHIC',
  gender: 'FEMALE',
  age: 17,
  residence: 'Казань',
  educationLevel: 'SECONDARY_GENERAL',
  consentAccepted: true,
  ...overrides,
});
```

- [ ] **Step 3: Write service tests for DEMOGRAPHIC mode**

In `server/src/tests/tests-public-session.service.spec.ts`, import:

```ts
import {
  createAccessibleLinkFixture,
  createPublicDemographicSessionStartDto,
  createPublicSessionStartDto,
  createPublicSessionStateResponse,
  type AccessibleLinkFixture,
} from './tests.spec-fixtures';
```

Update `AttemptCreateInput` to allow demographic fields:

```ts
type AttemptCreateInput = {
  data: {
    attemptNumber: number;
    educationOrganization: string | null;
    groupOrClass: string | null;
    studentGender: string | null;
    studentAge: number | null;
    studentResidence: string | null;
    studentEducationLevel: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
```

Add this test:

```ts
it('startSessionByCode stores demographic profile and creates one anonymous attempt', async () => {
  getAccessiblePublicLinkByCodeMock.mockResolvedValue(
    createAccessibleLinkFixture({
      entryProfileMode: 'DEMOGRAPHIC',
      educationOrganization: null,
      maxAttemptsPerStudent: 1,
    }),
  );
  createAttemptMock.mockResolvedValue({ resumeToken: 'resume-demographic' });

  const getSessionByTokenSpy = jest
    .spyOn(service, 'getSessionByToken')
    .mockResolvedValue(createPublicSessionStateResponse('resume-demographic'));

  const result = await service.startSessionByCode(
    'ABC123',
    createPublicDemographicSessionStartDto({
      gender: 'MALE',
      age: 18,
      residence: ' Самара ',
      educationLevel: 'SECONDARY_SPECIAL',
    }),
  );

  expect(updateManyMock).not.toHaveBeenCalled();
  expect(findManyMock).not.toHaveBeenCalled();
  expect(createAttemptMock).toHaveBeenCalled();
  const createCall = createAttemptMock.mock.calls[0]?.[0];
  expect(createCall?.data).toMatchObject({
    attemptNumber: 1,
    studentName: null,
    studentLastInitial: null,
    studentMiddleInitial: null,
    educationOrganization: null,
    groupOrClass: null,
    studentGender: 'MALE',
    studentAge: 18,
    studentResidence: 'Самара',
    studentEducationLevel: 'SECONDARY_SPECIAL',
  });
  expect(typeof createCall?.data.studentKeyHash).toBe('string');
  expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-demographic');
  expect(result.session.sessionToken).toBe('resume-demographic');
});
```

Add this validation test:

```ts
it('startSessionByCode rejects incomplete demographic profile', async () => {
  getAccessiblePublicLinkByCodeMock.mockResolvedValue(
    createAccessibleLinkFixture({
      entryProfileMode: 'DEMOGRAPHIC',
      educationOrganization: null,
      maxAttemptsPerStudent: 1,
    }),
  );

  await expect(
    service.startSessionByCode(
      'ABC123',
      createPublicDemographicSessionStartDto({ residence: undefined }),
    ),
  ).rejects.toThrow(BadRequestException);
  expect(createAttemptMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 4: Implement mode-specific session start helpers**

In `server/src/tests/tests-public-session.service.ts`, update imports:

```ts
import {
  buildAnonymousAttemptKeyHash,
  buildStudentKeyHash,
  createRandomToken,
  toPrismaRequiredJsonInput,
} from './tests-domain.utils';
```

Add private helper methods inside `TestsPublicSessionService`:

```ts
  private normalizeRequiredString(value: string | undefined, message: string) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeEducationProfile(
    dto: PublicSessionStartRequestDto,
    link: Awaited<ReturnType<TestsPublicLinkService['getAccessiblePublicLinkByCode']>>,
  ) {
    const educationOrganization =
      link.educationOrganization?.name ??
      this.normalizeRequiredString(dto.educationOrganization, 'Учебное заведение обязательно');
    const groupOrClass = this.normalizeRequiredString(
      dto.groupOrClass,
      'Группа / класс обязательны',
    );

    this.validateGroupOrClassForLink(groupOrClass, link);

    return {
      studentName: this.normalizeRequiredString(dto.studentName, 'Имя обязательно'),
      studentLastInitial: this.normalizeRequiredString(
        dto.studentLastInitial,
        'Первая буква фамилии обязательна',
      ),
      studentMiddleInitial: this.normalizeRequiredString(
        dto.studentMiddleInitial,
        'Первая буква отчества обязательна',
      ),
      educationOrganization,
      groupOrClass,
    };
  }

  private normalizeDemographicProfile(dto: PublicSessionStartRequestDto) {
    if (!dto.gender) {
      throw new BadRequestException('Укажите пол');
    }

    if (!dto.age) {
      throw new BadRequestException('Укажите возраст');
    }

    if (!dto.educationLevel) {
      throw new BadRequestException('Укажите уровень образования');
    }

    return {
      studentGender: dto.gender,
      studentAge: dto.age,
      studentResidence: this.normalizeRequiredString(dto.residence, 'Укажите место жительства'),
      studentEducationLevel: dto.educationLevel,
    };
  }
```

Replace the start of `startSessionByCode` with a mode branch:

```ts
const link = await this.publicLinkService.getAccessiblePublicLinkByCode(shortCode);
const now = new Date();

if (link.entryProfileMode === 'DEMOGRAPHIC') {
  const demographicProfile = this.normalizeDemographicProfile(dto);
  const resumeToken = createRandomToken(24);
  const expiresAt =
    link.timeLimitMinutes !== null
      ? new Date(now.getTime() + link.timeLimitMinutes * 60 * 1000)
      : null;

  const createdAttempt = await this.prisma.testStudentAttempt.create({
    data: {
      publicLinkId: link.id,
      topicVersionId: link.topicVersionId,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      ...demographicProfile,
      studentKeyHash: buildAnonymousAttemptKeyHash(resumeToken),
      consentAcceptedAt: now,
      consentVersion: link.consentVersion,
      consentTextSnapshot: link.consentTextSnapshot,
      resumeToken,
      startedAt: now,
      expiresAt,
    },
  });

  return this.getSessionByToken(createdAttempt.resumeToken);
}

const educationProfile = this.normalizeEducationProfile(dto, link);
```

Then update the existing education code to use `educationProfile`:

```ts
const studentKeyHash = buildStudentKeyHash(educationProfile);
```

and in the education `create` data:

```ts
        studentName: educationProfile.studentName,
        studentLastInitial: educationProfile.studentLastInitial,
        studentMiddleInitial: educationProfile.studentMiddleInitial,
        educationOrganization: educationProfile.educationOrganization,
        groupOrClass: educationProfile.groupOrClass,
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
```

- [ ] **Step 5: Run session service tests**

Run:

```powershell
npm run test --prefix server -- tests-public-session.service.spec.ts tests-public-session-read.service.spec.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit session service changes**

Run:

```powershell
git add server/src/tests/tests-domain.utils.ts server/src/tests/tests-public-session.service.ts server/src/tests/tests.spec-fixtures.ts server/src/tests/tests-public-session.service.spec.ts
git commit -m "feat: start public sessions by entry profile mode"
```

---

## Task 5: Expose profile fields in admin attempt responses

**Files:**

- Modify: `server/src/tests/tests-attempt.mapper.ts`
- Modify: `server/src/tests/tests-admin-attempt.service.spec.ts`

- [ ] **Step 1: Update admin attempt service test**

In `server/src/tests/tests-admin-attempt.service.spec.ts`, add demographic fields to the mocked attempt:

```ts
entryProfileMode: 'DEMOGRAPHIC',
studentName: null,
studentLastInitial: null,
studentMiddleInitial: null,
educationOrganization: null,
groupOrClass: null,
studentGender: 'FEMALE',
studentAge: 17,
studentResidence: 'Казань',
studentEducationLevel: 'SECONDARY_GENERAL',
```

Update the expected response item with the same fields:

```ts
entryProfileMode: 'DEMOGRAPHIC',
studentName: null,
studentLastInitial: null,
studentMiddleInitial: null,
educationOrganization: null,
groupOrClass: null,
studentGender: 'FEMALE',
studentAge: 17,
studentResidence: 'Казань',
studentEducationLevel: 'SECONDARY_GENERAL',
```

- [ ] **Step 2: Update attempt mapper interfaces and output**

In `server/src/tests/tests-attempt.mapper.ts`, change the profile fields in `AttemptDetailRecord` and `AttemptListRecord` to:

```ts
entryProfileMode: string;
studentName: string | null;
studentLastInitial: string | null;
studentMiddleInitial: string | null;
educationOrganization: string | null;
groupOrClass: string | null;
studentGender: string | null;
studentAge: number | null;
studentResidence: string | null;
studentEducationLevel: string | null;
```

In both `mapAttemptListItem` and `mapAttemptDetail`, return:

```ts
    entryProfileMode: attempt.entryProfileMode,
    studentName: attempt.studentName,
    studentLastInitial: attempt.studentLastInitial,
    studentMiddleInitial: attempt.studentMiddleInitial,
    educationOrganization: attempt.educationOrganization,
    groupOrClass: attempt.groupOrClass,
    studentGender: attempt.studentGender,
    studentAge: attempt.studentAge,
    studentResidence: attempt.studentResidence,
    studentEducationLevel: attempt.studentEducationLevel,
```

- [ ] **Step 3: Run admin attempt tests**

Run:

```powershell
npm run test --prefix server -- tests-admin-attempt.service.spec.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit admin attempt mapping**

Run:

```powershell
git add server/src/tests/tests-attempt.mapper.ts server/src/tests/tests-admin-attempt.service.spec.ts
git commit -m "feat: expose entry profile in attempt stats"
```

---

## Task 6: Regenerate OpenAPI and Orval clients

**Files:**

- Modify: `server/openapi.json`
- Modify generated files under:
  - `client/src/shared/api/generated/tests-public/`
  - `client/src/shared/api/generated/tests/`
  - `client/src/shared/api/model/`

- [ ] **Step 1: Run mutator guard before API generation**

Run:

```powershell
npm run verify:api-mutator
```

Expected: command exits with code `0`.

- [ ] **Step 2: Regenerate API clients**

Run:

```powershell
npm run gen:api
```

Expected: `server/openapi.json` and client generated API files update.

- [ ] **Step 3: Inspect generated request model**

Open `client/src/shared/api/model/publicSessionStartRequestDto.ts` and confirm it includes:

```ts
entryProfileMode?: PublicSessionStartRequestDtoEntryProfileMode;
gender?: PublicSessionStartRequestDtoGender;
age?: number;
residence?: string;
educationLevel?: PublicSessionStartRequestDtoEducationLevel;
```

Open `client/src/shared/api/model/publicLinkAccessResponseDto.ts` and confirm it includes:

```ts
entryProfileMode: PublicLinkAccessResponseDtoEntryProfileMode;
```

- [ ] **Step 4: Commit generated contracts**

Run:

```powershell
git add server/openapi.json client/src/shared/api/generated client/src/shared/api/model
git commit -m "chore: regenerate API for entry profile modes"
```

---

## Task 7: Add public DEMOGRAPHIC entry form

**Files:**

- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.types.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts`
- Create: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`
- Create: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`

- [ ] **Step 1: Add frontend profile types**

In `client/src/widgets/public-test-workspace/ui/public-test-entry.types.ts`, add:

```ts
export type EntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION';
export type StudentGender = 'MALE' | 'FEMALE' | '';
export type StudentEducationLevel =
  | 'BASIC_GENERAL'
  | 'SECONDARY_GENERAL'
  | 'SECONDARY_SPECIAL'
  | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
  | 'HIGHER'
  | '';

export interface DemographicFormState {
  gender: StudentGender;
  age: string;
  residence: string;
  educationLevel: StudentEducationLevel;
  consentAccepted: boolean;
}
```

Keep the existing `StudentFormState` for `EDUCATION` mode.

- [ ] **Step 2: Add initial demographic state and labels**

In `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts`, add:

```ts
import type { DemographicFormState } from './public-test-entry.types';
```

Merge the import with the existing type import. Add:

```ts
export const initialDemographicFormState: DemographicFormState = {
  gender: '',
  age: '',
  residence: '',
  educationLevel: '',
  consentAccepted: true,
};

export const educationLevelLabels = {
  BASIC_GENERAL: 'Основное общее',
  SECONDARY_GENERAL: 'Среднее общее',
  SECONDARY_SPECIAL: 'Среднее специальное',
  INCOMPLETE_HIGHER_FROM_YEAR_3: 'Неоконченное высшее (начиная с 3 курса)',
  HIGHER: 'Высшее',
} as const;
```

- [ ] **Step 3: Create DEMOGRAPHIC form component**

Create `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`:

```tsx
import { Sparkles, UserRound } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { educationLevelLabels } from './public-test-entry.helpers';

import type { DemographicFormState } from './public-test-entry.types';
import type { FormEvent } from 'react';

type DemographicFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

interface PublicTestDemographicProfileCardProps {
  formState: DemographicFormState;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: DemographicFieldChangeHandler;
}

export function PublicTestDemographicProfileCard({
  formState,
  isSubmitting,
  onSubmit,
  onFieldChange,
}: PublicTestDemographicProfileCardProps) {
  return (
    <div className="order-1 lg:order-2">
      <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
        <CardHeader className="space-y-3 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-2xl font-bold text-transparent">
                Анкета участника
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Заполните данные и начните тест
              </CardDescription>
            </div>
            <div className="ml-4 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-md">
              <UserRound className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-gender" className="font-medium">
                  Укажите, пожалуйста, Ваш пол
                </Label>
                <select
                  id="student-gender"
                  value={formState.gender}
                  onChange={(event) =>
                    onFieldChange('gender', event.target.value as DemographicFormState['gender'])
                  }
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Выберите пол</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-age" className="font-medium">
                  Укажите Ваш возраст
                </Label>
                <Input
                  id="student-age"
                  type="number"
                  min={1}
                  max={120}
                  value={formState.age}
                  onChange={(event) => onFieldChange('age', event.target.value)}
                  required
                  className="h-11"
                  placeholder="17"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student-residence" className="font-medium">
                  Укажите Ваше место жительства
                </Label>
                <Input
                  id="student-residence"
                  value={formState.residence}
                  onChange={(event) => onFieldChange('residence', event.target.value)}
                  required
                  className="h-11"
                  placeholder="Город или населенный пункт"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student-education-level" className="font-medium">
                  Укажите уровень Вашего образования
                </Label>
                <select
                  id="student-education-level"
                  value={formState.educationLevel}
                  onChange={(event) =>
                    onFieldChange(
                      'educationLevel',
                      event.target.value as DemographicFormState['educationLevel'],
                    )
                  }
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Выберите уровень образования</option>
                  {Object.entries(educationLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full bg-gradient-to-r from-primary to-accent font-medium shadow-md transition-all hover:from-primary/90 hover:to-accent/90 hover:shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Запускаем тест...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Начать тестирование
                </span>
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              После нажатия кнопки вы перейдете к вопросам теста
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Add component test**

Create `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicTestDemographicProfileCard } from './public-test-demographic-profile-card';

describe('PublicTestDemographicProfileCard', () => {
  it('renders the demographic entry fields', () => {
    render(
      <PublicTestDemographicProfileCard
        formState={{
          gender: '',
          age: '',
          residence: '',
          educationLevel: '',
          consentAccepted: true,
        }}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Ваш пол/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ваш возраст/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/место жительства/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/уровень Вашего образования/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /начать тестирование/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run frontend component test**

Run:

```powershell
npm run test:run --prefix client -- public-test-demographic-profile-card.test.tsx
```

Expected: test passes.

- [ ] **Step 6: Commit demographic form component**

Run:

```powershell
git add client/src/widgets/public-test-workspace/ui/public-test-entry.types.ts client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx
git commit -m "feat: add demographic public test form"
```

---

## Task 8: Branch public entry submit by profile mode

**Files:**

- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`

- [ ] **Step 1: Update submit tests**

In `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts`, keep the current education-mode tests and update handler calls to pass:

```ts
entryProfileMode: 'EDUCATION',
educationFormState: validFormState,
demographicFormState: {
  gender: '',
  age: '',
  residence: '',
  educationLevel: '',
  consentAccepted: true,
},
```

Add this demographic test:

```ts
it('submits normalized demographic data and navigates to the returned session', async () => {
  const startSession = vi.fn().mockResolvedValue({
    session: {
      sessionToken: 'session-token',
    },
  });
  const navigate = vi.fn();
  const event = createSubmitEvent();

  await createPublicTestEntryStartHandler({
    code: 'CODE1',
    entryProfileMode: 'DEMOGRAPHIC',
    educationFormState: validFormState,
    demographicFormState: {
      gender: 'FEMALE',
      age: ' 17 ',
      residence: ' Казань ',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    },
    linkData: undefined,
    startSession,
    navigate,
  })(event);

  expect(startSession).toHaveBeenCalledWith({
    code: 'CODE1',
    data: {
      entryProfileMode: 'DEMOGRAPHIC',
      gender: 'FEMALE',
      age: 17,
      residence: 'Казань',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    },
  });
  expect(navigate).toHaveBeenCalledWith('/t/CODE1/session/session-token');
});
```

Add this validation test:

```ts
it('blocks incomplete demographic data before starting a session', async () => {
  const startSession = vi.fn();
  const navigate = vi.fn();

  await createPublicTestEntryStartHandler({
    code: 'CODE1',
    entryProfileMode: 'DEMOGRAPHIC',
    educationFormState: validFormState,
    demographicFormState: {
      gender: 'MALE',
      age: '',
      residence: 'Казань',
      educationLevel: 'HIGHER',
      consentAccepted: true,
    },
    linkData: undefined,
    startSession,
    navigate,
  })(createSubmitEvent());

  expect(startSession).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Update submit handler types and payloads**

In `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.ts`, update imports:

```ts
import type {
  DemographicFormState,
  EntryProfileMode,
  StudentFormState,
} from './public-test-entry.types';
```

Replace `StartSessionRequestData` with:

```ts
interface StartSessionRequestData {
  entryProfileMode?: EntryProfileMode;
  studentName?: string;
  studentLastInitial?: string;
  studentMiddleInitial?: string;
  educationOrganization?: string;
  groupOrClass?: string;
  gender?: 'MALE' | 'FEMALE';
  age?: number;
  residence?: string;
  educationLevel?:
    | 'BASIC_GENERAL'
    | 'SECONDARY_GENERAL'
    | 'SECONDARY_SPECIAL'
    | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
    | 'HIGHER';
  consentAccepted: true;
}
```

Update params:

```ts
entryProfileMode: EntryProfileMode;
educationFormState: StudentFormState;
demographicFormState: DemographicFormState;
```

Add a demographic payload builder:

```ts
const buildDemographicPayload = (
  formState: DemographicFormState,
): StartSessionRequestData | null => {
  if (!formState.gender) {
    toast.error('Укажите пол');
    return null;
  }

  const age = Number.parseInt(formState.age.trim(), 10);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    toast.error('Укажите корректный возраст');
    return null;
  }

  const residence = formState.residence.trim();
  if (!residence) {
    toast.error('Укажите место жительства');
    return null;
  }

  if (!formState.educationLevel) {
    toast.error('Укажите уровень образования');
    return null;
  }

  return {
    entryProfileMode: 'DEMOGRAPHIC',
    gender: formState.gender,
    age,
    residence,
    educationLevel: formState.educationLevel,
    consentAccepted: true,
  };
};
```

Move the current education validation into a helper:

```ts
const buildEducationPayload = (
  formState: StudentFormState,
  linkData: LinkAccessSnapshot | undefined,
): StartSessionRequestData | null => {
  if (!formState.consentAccepted) {
    toast.error('Необходимо согласие на обработку персональных данных');
    return null;
  }

  const effectiveEducationOrganization =
    linkData?.educationOrganization?.trim() ?? formState.educationOrganization.trim();

  if (!effectiveEducationOrganization) {
    toast.error('Укажите учебное заведение');
    return null;
  }

  const normalizedGroupOrClass = formState.groupOrClass.trim();
  const validationMode = linkData?.groupValidationMode ?? 'NONE';
  const groupValidationWarning = resolveGroupValidationWarning({
    groupValue: normalizedGroupOrClass,
    groupValidationMode: validationMode,
    groupValidationPattern: linkData?.groupValidationPattern ?? null,
    groupValidationHint: linkData?.groupValidationHint ?? null,
  });

  if (groupValidationWarning && validationMode === 'STRICT') {
    toast.error(groupValidationWarning);
    return null;
  }

  if (groupValidationWarning && validationMode === 'HINT') {
    toast.warning(groupValidationWarning);
  }

  return {
    entryProfileMode: 'EDUCATION',
    studentName: formState.studentName.trim(),
    studentLastInitial: normalizeInitial(formState.studentLastInitial),
    studentMiddleInitial: normalizeInitial(formState.studentMiddleInitial),
    educationOrganization: effectiveEducationOrganization,
    groupOrClass: normalizedGroupOrClass,
    consentAccepted: true,
  };
};
```

Inside the returned submit function:

```ts
const data =
  entryProfileMode === 'DEMOGRAPHIC'
    ? buildDemographicPayload(demographicFormState)
    : buildEducationPayload(educationFormState, linkData);

if (!data) {
  return;
}

try {
  const response = await startSession({ code, data });
  navigate(`/t/${code}/session/${response.session.sessionToken}`);
} catch {
  toast.error('Не удалось начать тест. Проверьте корректность данных и попробуйте снова.');
}
```

- [ ] **Step 3: Update entry workspace state and rendering**

In `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`, import:

```ts
import { PublicTestDemographicProfileCard } from './public-test-demographic-profile-card';
import {
  initialDemographicFormState,
  initialFormState,
  resolveGroupValidationWarning,
} from './public-test-entry.helpers';
```

Add state:

```ts
const [educationFormState, setEducationFormState] = useState<StudentFormState>(initialFormState);
const [demographicFormState, setDemographicFormState] = useState(initialDemographicFormState);
```

Replace old `formState` state with `educationFormState`.

Add update helpers:

```ts
const updateEducationField = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
) => {
  setEducationFormState((previousState) => ({
    ...previousState,
    [key]: value,
  }));
};

const updateDemographicField = <K extends keyof typeof demographicFormState>(
  key: K,
  value: (typeof demographicFormState)[K],
) => {
  setDemographicFormState((previousState) => ({
    ...previousState,
    [key]: value,
  }));
};
```

Derive mode after `const link = linkQuery.data;`:

```ts
const entryProfileMode = link.entryProfileMode;
```

Create handler with both states:

```ts
const handleStart = createPublicTestEntryStartHandler({
  code,
  entryProfileMode,
  educationFormState,
  demographicFormState,
  linkData:
    entryProfileMode === 'EDUCATION'
      ? {
          educationOrganization: link.educationOrganization,
          groupValidationMode: link.groupValidationMode,
          groupValidationPattern: link.groupValidationPattern,
          groupValidationHint: link.groupValidationHint,
        }
      : undefined,
  startSession: startMutation.mutateAsync,
  navigate,
});
```

Render:

```tsx
{
  entryProfileMode === 'DEMOGRAPHIC' ? (
    <PublicTestDemographicProfileCard
      formState={demographicFormState}
      isSubmitting={startMutation.isPending}
      onSubmit={handleStart}
      onFieldChange={updateDemographicField}
    />
  ) : (
    <PublicTestRegistrationCard
      formState={registrationFormState}
      lockedEducationOrganization={link.educationOrganization}
      groupValidationMode={link.groupValidationMode}
      groupValidationExample={link.groupValidationExample}
      groupValidationHint={link.groupValidationHint}
      groupValidationWarning={currentGroupValidationWarning}
      isSubmitting={startMutation.isPending}
      onSubmit={handleStart}
      onFieldChange={updateEducationField}
    />
  );
}
```

- [ ] **Step 4: Run public entry tests**

Run:

```powershell
npm run test:run --prefix client -- public-test-entry-submit.test.ts public-test-demographic-profile-card.test.tsx public-test-registration-card.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit public entry branching**

Run:

```powershell
git add client/src/widgets/public-test-workspace/ui/public-test-entry-submit.ts client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx
git commit -m "feat: branch public test entry by profile mode"
```

---

## Task 9: Add profile mode selector to admin public link creation

**Files:**

- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.types.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.types.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-access-settings-section.tsx`

- [ ] **Step 1: Add state and props for profile mode**

In `use-admin-public-links-form-state.ts`, add:

```ts
const [newPublicEntryProfileMode, setNewPublicEntryProfileMode] = useState<
  'DEMOGRAPHIC' | 'EDUCATION'
>('DEMOGRAPHIC');
```

Return both values:

```ts
newPublicEntryProfileMode,
setNewPublicEntryProfileMode,
```

In `use-admin-public-links-workspace.ts`, pass them into `useAdminPublicLinksActions` and `PublicLinkCreateDialog`.

In `public-link-create-card.types.ts`, add to `PublicLinkCreateCardProps` and `PublicLinkAccessSettingsSectionProps`:

```ts
newPublicEntryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION';
onEntryProfileModeChange: (value: 'DEMOGRAPHIC' | 'EDUCATION') => void;
```

- [ ] **Step 2: Pass mode through create dialog**

In `public-link-create-card.tsx`, destructure:

```ts
newPublicEntryProfileMode,
onEntryProfileModeChange,
```

Pass to `PublicLinkAccessSettingsSection`:

```tsx
newPublicEntryProfileMode = { newPublicEntryProfileMode };
onEntryProfileModeChange = { onEntryProfileModeChange };
```

- [ ] **Step 3: Render mode selector and lock attempts to 1**

In `public-link-access-settings-section.tsx`, add a native select before the attempts input:

```tsx
<div className="space-y-2">
  <Label htmlFor="public-entry-profile-mode">Анкета перед тестом</Label>
  <select
    id="public-entry-profile-mode"
    value={newPublicEntryProfileMode}
    onChange={(event) =>
      onEntryProfileModeChange(event.target.value as 'DEMOGRAPHIC' | 'EDUCATION')
    }
    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
  >
    <option value="DEMOGRAPHIC">Демографическая анкета</option>
    <option value="EDUCATION">Анкета по учебным данным</option>
  </select>
  <p className="text-xs text-muted-foreground">
    Для демографической анкеты лимит попыток устанавливается равным 1.
  </p>
</div>
```

For the attempts input, use:

```tsx
value={newPublicEntryProfileMode === 'DEMOGRAPHIC' ? '1' : newPublicMaxAttempts}
disabled={newPublicEntryProfileMode === 'DEMOGRAPHIC'}
```

- [ ] **Step 4: Include profile mode in create action**

In `use-admin-public-links-actions.types.ts`, add:

```ts
newPublicEntryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION';
```

In `use-admin-public-links-actions.ts`, destructure `newPublicEntryProfileMode` and change validation:

```ts
const validation = validateCreatePublicLinkInput({
  publishedVersionId,
  educationOrganizationId: newEducationOrganizationId,
  maxAttemptsRaw: newPublicEntryProfileMode === 'DEMOGRAPHIC' ? '1' : newPublicMaxAttempts,
  timeLimitRaw: newPublicTimeLimit,
});
```

Include in mutation data:

```ts
entryProfileMode: newPublicEntryProfileMode,
maxAttemptsPerStudent:
  newPublicEntryProfileMode === 'DEMOGRAPHIC' ? 1 : validation.maxAttemptsPerStudent,
```

- [ ] **Step 5: Run frontend build type check**

Run:

```powershell
npm run build --prefix client
```

Expected: build succeeds.

- [ ] **Step 6: Commit admin link UI**

Run:

```powershell
git add client/src/widgets/admin-public-links-workspace/ui
git commit -m "feat: configure public test entry profile mode"
```

---

## Task 10: Show the correct profile in admin stats

**Files:**

- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempts-table-card.tsx`
- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx`

- [ ] **Step 1: Update attempt row types**

In `public-links-attempts-table-card.tsx`, replace profile fields with nullable fields and demographic fields:

```ts
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION';
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: 'MALE' | 'FEMALE' | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel:
    | 'BASIC_GENERAL'
    | 'SECONDARY_GENERAL'
    | 'SECONDARY_SPECIAL'
    | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
    | 'HIGHER'
    | null;
```

- [ ] **Step 2: Add display helpers**

Add:

```ts
const educationLevelLabels = {
  BASIC_GENERAL: 'Основное общее',
  SECONDARY_GENERAL: 'Среднее общее',
  SECONDARY_SPECIAL: 'Среднее специальное',
  INCOMPLETE_HIGHER_FROM_YEAR_3: 'Неоконченное высшее',
  HIGHER: 'Высшее',
} as const;

const genderLabels = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
} as const;

const getAttemptProfilePrimary = (attempt: PublicAttemptRow) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return [
      attempt.studentGender ? genderLabels[attempt.studentGender] : null,
      attempt.studentAge ? `${attempt.studentAge} лет` : null,
    ]
      .filter(Boolean)
      .join(', ');
  }

  return attempt.studentName ?? '—';
};

const getAttemptProfileSecondary = (attempt: PublicAttemptRow) => {
  if (attempt.entryProfileMode === 'DEMOGRAPHIC') {
    return [
      attempt.studentResidence,
      attempt.studentEducationLevel ? educationLevelLabels[attempt.studentEducationLevel] : null,
    ]
      .filter(Boolean)
      .join(' • ');
  }

  return [
    attempt.studentLastInitial && attempt.studentMiddleInitial
      ? `${attempt.studentLastInitial}.${attempt.studentMiddleInitial}.`
      : null,
    attempt.educationOrganization,
    attempt.groupOrClass,
  ]
    .filter(Boolean)
    .join(' • ');
};
```

- [ ] **Step 3: Replace table profile cells**

Update column labels:

```ts
{ id: 'student', header: 'Профиль', className: 'min-w-56' },
{ id: 'profileDetails', header: 'Детали профиля', className: 'min-w-64' },
```

Remove the separate initials, organization, and group columns. Render:

```tsx
<TableCell className="min-w-56 max-w-72 truncate">
  {getAttemptProfilePrimary(attempt) || '—'}
</TableCell>
<TableCell className="min-w-64 max-w-96 truncate">
  {getAttemptProfileSecondary(attempt) || '—'}
</TableCell>
```

- [ ] **Step 4: Update detail dialog profile type**

In `public-links-attempt-detail-dialog.tsx`, extend `AttemptDetail` with the same nullable and demographic fields as `PublicAttemptRow`.

In the dialog description, replace:

```tsx
? `${detailAttempt.studentName} • прохождение #${detailAttempt.attemptNumber}`
```

with:

```tsx
? `${detailAttempt.entryProfileMode === 'DEMOGRAPHIC' ? 'Демографическая анкета' : detailAttempt.studentName ?? 'Анкета по учебным данным'} • прохождение #${detailAttempt.attemptNumber}`
```

Add a compact profile block before analysis/answers:

```tsx
{
  detailAttempt ? (
    <div className={adminClassNames.panel.compactCard}>
      <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Профиль участника</p>
      {detailAttempt.entryProfileMode === 'DEMOGRAPHIC' ? (
        <p className={`mt-1 text-sm ${adminClassNames.text.muted}`}>
          {[
            detailAttempt.studentGender,
            detailAttempt.studentAge,
            detailAttempt.studentResidence,
            detailAttempt.studentEducationLevel,
          ]
            .filter(Boolean)
            .join(' • ')}
        </p>
      ) : (
        <p className={`mt-1 text-sm ${adminClassNames.text.muted}`}>
          {[
            detailAttempt.studentName,
            detailAttempt.studentLastInitial && detailAttempt.studentMiddleInitial
              ? `${detailAttempt.studentLastInitial}.${detailAttempt.studentMiddleInitial}.`
              : null,
            detailAttempt.educationOrganization,
            detailAttempt.groupOrClass,
          ]
            .filter(Boolean)
            .join(' • ')}
        </p>
      )}
    </div>
  ) : null;
}
```

- [ ] **Step 5: Run client build**

Run:

```powershell
npm run build --prefix client
```

Expected: build succeeds.

- [ ] **Step 6: Commit admin stats display**

Run:

```powershell
git add client/src/widgets/admin-public-links-stats-workspace/ui
git commit -m "feat: show entry profiles in public link stats"
```

---

## Task 11: Full verification and database governance check

**Files:**

- No source edits expected in this task.

- [ ] **Step 1: Run targeted backend tests**

Run:

```powershell
npm run test --prefix server -- tests-public.dto.spec.ts tests-links.dto.spec.ts tests-public-link.service.spec.ts tests-public-session.service.spec.ts tests-admin-attempt.service.spec.ts
```

Expected: command exits with code `0`.

- [ ] **Step 2: Run targeted frontend tests**

Run:

```powershell
npm run test:run --prefix client -- public-test-entry-submit.test.ts public-test-demographic-profile-card.test.tsx public-test-registration-card.test.tsx
```

Expected: command exits with code `0`.

- [ ] **Step 3: Run architecture and maintainability checks**

Run:

```powershell
npm run verify:api-mutator
npm run verify:architecture
npm run verify:maintainability
```

Expected: each command exits with code `0`.

- [ ] **Step 4: Run full local gate**

Run:

```powershell
npm run verify:local
```

Expected: command exits with code `0`.

- [ ] **Step 5: Run migration deploy on a temporary empty Postgres before release**

Use the root Docker stack or a dedicated empty Postgres database. Then run from `server`:

```powershell
npx prisma migrate deploy --schema prisma/schema.prisma
```

Expected: migrations apply successfully to an empty database. This is mandatory before release, Docker Hub publication, or updating `prod`/`prod_ready`.

- [ ] **Step 6: Commit verification notes if a docs update was needed**

If no docs changed, skip this commit. If verification notes were added to project docs, run:

```powershell
git add docs
git commit -m "docs: record entry profile verification notes"
```

---

## Self-Review Checklist

- Requirements covered:
  - `DEMOGRAPHIC` and `EDUCATION` mode names are used.
  - New demographic fields are collected before the test.
  - Current education-based form remains available as `EDUCATION`.
  - Demographic links force `maxAttemptsPerStudent` to `1`.
  - Public routes remain unchanged.
  - API is regenerated after backend DTO changes.
  - Prisma schema changes include an explicit migration.
- Scope boundaries:
  - No unrelated route changes.
  - No direct `localStorage` or `sessionStorage`.
  - No new top-level frontend or backend architecture areas.
  - No LLM analysis prompt changes in this plan.
- Verification:
  - Targeted backend tests.
  - Targeted frontend tests.
  - `verify:api-mutator`, `verify:architecture`, `verify:maintainability`.
  - `verify:local`.
  - `prisma migrate deploy` on an empty Postgres before release.
