# Personal Data Processing Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить публичный и «по поручению учебного заведения» режимы обработки ПДн со стабильными snapshot-данными, корректным согласием и обратной совместимостью.

**Architecture:** Расширить существующий bounded context `tests`: типизированные Prisma-поля, один backend resolver оператора, DTO/OpenAPI-контракты и локальные UI-секции в текущих FSD widgets. Источником публичного отображения и попытки служит snapshot `TestPublicLink`, а не текущая карточка заведения.

**Tech Stack:** Prisma 7, NestJS 11, nestjs-zod, Jest, React 19, TanStack Query/Orval, Vitest, Tailwind/shadcn.

## Global Constraints

- Work on `main`; treat every `prod` reference in the supplied DOCX as `main`.
- Change classification: `existing-feature-change`.
- Owning feature/module: `tests`.
- Prisma owner/model: `EducationOrganization`, `TestPublicLink`, `TestStudentAttempt`.
- Route root: existing `/admin/tests/*` and `/t/*` routes only.
- Manifest impact: none.
- Generator decision: intentionally skip `gen:nest`; regenerate OpenAPI/Orval only.
- No `Organization` table, `ORG_ADMIN`, organization users, file uploads, or new dependencies.
- Preserve group/class validation, branding, entry profile modes, analytics, autosave, and old public links.

---

### Task 1: Lock schema and DTO contracts

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260710000000_add_personal_data_processing_modes/migration.sql`
- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Test: `server/src/tests/dto/tests-links.dto.spec.ts`
- Test: `server/src/tests/dto/tests-public.dto.spec.ts`
- Test: `server/src/tests/tests-prisma-schema.spec.ts`

**Interfaces:**

- Produces enum `PersonalDataProcessingMode` and nullable organization/link/attempt fields.
- Produces `PersonalDataSchema` used by public access responses and generated client types.

- [ ] **Step 1: Write failing contract tests**

```ts
expect(
  AdminCreatePublicLinkSchema.safeParse({
    ...validCreatePayload,
    personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
    educationOrganizationId: null,
  }).success,
).toBe(false);

expect(
  PublicLinkAccessResponseSchema.parse({
    ...validAccessPayload,
    personalData: {
      processingMode: 'PUBLIC',
      operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
      operatorShortName: null,
      privacyPolicyUrl: '/privacy',
      consentDocumentUrl: null,
      logoUrl: null,
    },
  }).personalData.processingMode,
).toBe('PUBLIC');
```

- [ ] **Step 2: Run RED**

Run: `npm test --prefix server -- dto/tests-links.dto.spec.ts dto/tests-public.dto.spec.ts tests-prisma-schema.spec.ts --runInBand`

Expected: failures because the enum, fields, and `personalData` response do not exist.

- [ ] **Step 3: Add the minimal Prisma schema, migration SQL, and Zod contracts**

Migration must add nullable legal/operator fields, set `personalDataProcessingMode` to `PUBLIC` for existing links, populate PUBLIC link snapshots, and add the attempt operator FK/index with `ON DELETE SET NULL`.

- [ ] **Step 4: Generate Prisma and run GREEN**

Run: `npm run prisma:generate`

Run: `npm run verify:prisma-migrations`

Run: `npm test --prefix server -- dto/tests-links.dto.spec.ts dto/tests-public.dto.spec.ts tests-prisma-schema.spec.ts --runInBand`

Expected: all targeted contract tests pass.

### Task 2: Resolve and snapshot the operator in backend services

**Files:**

- Create: `server/src/tests/tests-personal-data-operator.ts`
- Create: `server/src/tests/tests-personal-data-operator.spec.ts`
- Modify: `server/src/tests/tests-education-organization.service.ts`
- Modify: `server/src/tests/tests-education-organization.service.spec.ts`
- Modify: `server/src/tests/tests-public-link.query.ts`
- Modify: `server/src/tests/tests-public-link.mapper.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`

**Interfaces:**

- Produces `resolvePersonalDataOperator(mode, educationOrganizationId)` returning normalized operator snapshot data.
- Public-link create/update consumes the resolver and persists snapshots atomically with the link.

- [ ] **Step 1: Write failing resolver/service tests**

```ts
it('rejects an on-behalf link when the organization lacks privacy documents', async () => {
  prisma.educationOrganization.findUnique.mockResolvedValue({
    id: 7,
    isActive: true,
    fullName: 'Полное имя',
    shortName: 'Краткое имя',
    privacyPolicyUrl: null,
    consentDocumentUrl: null,
    logoUrl: null,
  });

  await expect(
    service.createPublicLink(1, {
      ...createDto,
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      educationOrganizationId: 7,
    }),
  ).rejects.toThrow('Политику обработки ПДн');
});

it('stores an immutable operator snapshot on an on-behalf link', async () => {
  await service.createPublicLink(1, onBehalfDto);
  expect(prisma.testPublicLink.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'ГБОУ Полное',
        operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
      }),
    }),
  );
});
```

- [ ] **Step 2: Run RED**

Run: `npm test --prefix server -- tests-personal-data-operator.spec.ts tests-education-organization.service.spec.ts tests-public-link.service.spec.ts --runInBand`

- [ ] **Step 3: Implement the resolver, organization field mapping, and link snapshot persistence**

Use one local helper/provider boundary; do not introduce a registry, JSON snapshot, or new module. Keep the existing education organization relation semantics for entry-profile locking.

- [ ] **Step 4: Run GREEN**

Run: `npm test --prefix server -- tests-personal-data-operator.spec.ts tests-education-organization.service.spec.ts tests-public-link.service.spec.ts --runInBand`

Expected: all targeted service tests pass.

### Task 3: Return operator metadata publicly and snapshot it on attempts

**Files:**

- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`
- Modify: `server/src/tests/tests.spec-fixtures.ts`

**Interfaces:**

- Public access always returns `personalData` from link snapshots.
- New attempts copy operator organization id/name/document URLs from the link snapshot.

- [ ] **Step 1: Write failing public/session tests**

```ts
expect(await service.getPublicLinkAccessByCode('ABC123')).toEqual(
  expect.objectContaining({
    personalData: expect.objectContaining({
      processingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullName: 'ГБОУ Полное',
      privacyPolicyUrl: 'https://school.example/privacy',
    }),
  }),
);

expect(prisma.testStudentAttempt.create).toHaveBeenCalledWith({
  data: expect.objectContaining({
    operatorEducationOrganizationId: 7,
    operatorFullNameSnapshot: 'ГБОУ Полное',
    operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
  }),
});
```

- [ ] **Step 2: Run RED**

Run: `npm test --prefix server -- tests-public-link.service.spec.ts tests-public-session.service.spec.ts --runInBand`

- [ ] **Step 3: Implement access mapping and attempt snapshot copy**

Do not change the existing `consentAccepted: z.literal(true)` requirement. Preserve global policy version snapshots for compatibility while adding operator-document snapshots.

- [ ] **Step 4: Run GREEN**

Run: `npm test --prefix server -- tests-public-link.service.spec.ts tests-public-session.service.spec.ts --runInBand`

### Task 4: Regenerate API and extend education organization admin UI

**Files:**

- Generated: `server/openapi.json`
- Generated: `client/src/shared/api/generated/tests/tests.ts`
- Generated: `client/src/shared/api/generated/tests-public/tests-public.ts`
- Generated: `client/src/shared/api/model/*`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/admin-education-organizations-workspace.helpers.ts`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/use-admin-education-organizations-workspace.ts`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`
- Modify: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-list-card.tsx`
- Create: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`
- Test: colocated Vitest files for helper/form/list behavior.

- [ ] **Step 1: Run backend contract generation**

Run: `npm run verify:api-mutator`

Run: `npm run gen:api`

- [ ] **Step 2: Write failing UI/helper tests**

```ts
expect(mapOrganizationToEditorValues(organization)).toEqual(
  expect.objectContaining({
    fullName: 'Полное имя',
    privacyPolicyUrl: 'https://school.example/privacy',
  }),
);
```

- [ ] **Step 3: Run RED**

Run: `npm run test:run --prefix client -- admin-education-organizations-workspace`

- [ ] **Step 4: Add the grouped legal/document/contact fields and readiness badge**

Reuse the same focused operator-fields component in create/edit cards. Keep group validation in its existing component and preserve the current two-column workspace.

- [ ] **Step 5: Rebuild frontend container and run GREEN**

Run: `docker compose up -d --build --force-recreate frontend`

Run: `npm run test:run --prefix client -- admin-education-organizations-workspace`

### Task 5: Add personal-data mode to public-link creation

**Files:**

- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.types.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.helpers.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/use-admin-public-links-actions.ts`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/admin-public-links-workspace.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-create-card.tsx`
- Modify: `client/src/widgets/admin-public-links-workspace/ui/public-link-organization-section.tsx`
- Test: existing public-link workspace/action/component tests.

- [ ] **Step 1: Write failing mode-validation and payload tests**

```ts
expect(
  validateCreatePublicLinkInput({
    publishedVersionId: 11,
    personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
    educationOrganizationId: null,
    maxAttemptsRaw: '1',
    timeLimitRaw: '',
  }),
).toEqual({ ok: false, error: 'Выберите учебное заведение для режима обработки по поручению' });
```

- [ ] **Step 2: Run RED**

Run: `npm run test:run --prefix client -- admin-public-links-workspace`

- [ ] **Step 3: Add mode state, radio controls, readiness warning, and generated API payload**

The organization selector remains optional for `PUBLIC` profile locking and becomes required/operator-defining only for the on-behalf mode.

- [ ] **Step 4: Rebuild frontend container and run GREEN**

Run: `docker compose up -d --build --force-recreate frontend`

Run: `npm run test:run --prefix client -- admin-public-links-workspace`

### Task 6: Render operator and operator-specific consent on `/t/:code`

**Files:**

- Create: `client/src/widgets/public-test-workspace/ui/public-personal-data-operator.tsx`
- Create: `client/src/widgets/public-test-workspace/ui/public-personal-data-operator.test.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-privacy-consent.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-privacy-consent.test.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-registration-card.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/polus/polus-public-entry.tsx`
- Test: `client/src/widgets/public-test-workspace/ui/public-test-entry-workspace.test.tsx`

- [ ] **Step 1: Write failing rendering tests**

```tsx
render(<PublicPersonalDataOperator personalData={onBehalfPersonalData} />);
expect(screen.getByText(/Тестирование проводится по поручению/)).toBeInTheDocument();
expect(screen.getByText('ГБОУ Полное')).toBeInTheDocument();

render(<PublicPrivacyConsent personalData={onBehalfPersonalData} {...handlers} />);
expect(screen.getByRole('link', { name: /Политикой/ })).toHaveAttribute(
  'href',
  'https://school.example/privacy',
);
```

- [ ] **Step 2: Run RED**

Run: `npm run test:run --prefix client -- public-personal-data-operator public-privacy-consent public-test-entry-workspace`

- [ ] **Step 3: Add persistent operator block and dynamic consent links to STANDARD and POLUS**

Keep the component inside the existing widget slice. Do not add modal disclosure or global CSS tokens.

- [ ] **Step 4: Rebuild frontend container and run GREEN**

Run: `docker compose up -d --build --force-recreate frontend`

Run: `npm run test:run --prefix client -- public-personal-data-operator public-privacy-consent public-test-entry-workspace`

### Task 7: Full verification and acceptance audit

**Files:**

- Review all files changed by Tasks 1-6.

- [ ] **Step 1: Inspect diff for scope and generated-file discipline**

Run: `git diff --check`

Run: `git status --short`

- [ ] **Step 2: Run targeted and core gates**

Run: `npm run verify:prisma-migrations`

Run: `npm run verify:architecture`

Run: `npm run verify:maintainability`

Run: `npm run lint`

Run: `npm run test --prefix server -- --runInBand`

Run: `npm run test:e2e --prefix server -- --runInBand`

Run: `npm run test:run --prefix client`

Run: `npm run build --prefix server`

Run: `npm run build --prefix client`

- [ ] **Step 3: Run release gate**

Run: `npm run verify:template`

Expected: exit code 0. If an external dependency or audit service blocks the command, report the exact failing subcommand and preserve evidence from the earlier local gates.

- [ ] **Step 4: Manually verify both modes**

PUBLIC: create a link without selecting an operator organization, open `/t/:code`, confirm the platform operator and `/privacy` link remain visible, and confirm unchecked consent blocks start.

ON_BEHALF: create/select a complete active organization, create the link, open `/t/:code`, confirm the snapshotted organization name and URLs are visible, then edit the organization and confirm the existing link still shows its previous snapshot until the link is explicitly updated.
