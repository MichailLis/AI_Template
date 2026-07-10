# Configurable Platform Operator Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow an administrator to edit the platform personal-data operator name next to the privacy policy and show it in both public templates for `PUBLIC` processing links.

**Architecture:** Extend the existing `privacy.policy` JSON payload with `operatorFullName`, keeping a backward-compatible default. Saving the setting updates `AppSetting` and all `PUBLIC` `TestPublicLink.operatorFullNameSnapshot` values in one Prisma transaction; existing attempt snapshots are never updated. Public links continue exposing the name through the existing `personalData` contract, so both templates keep using `PublicPersonalDataOperator`.

**Tech Stack:** NestJS 11, Prisma 7, Zod 4, Jest, React 19, TanStack Query, Vitest, Orval, Docker Compose.

## Global Constraints

- Default value: `АНО «Центр развития компьютерного спорта и цифровых технологий»`.
- Trim the value, reject empty values, and limit it to 512 characters.
- Apply the setting only to links whose processing mode is `PUBLIC`.
- Update existing public-link snapshots, but never mutate snapshots in existing attempts.
- Do not add a Prisma migration or a new dependency.

---

### Task 1: Privacy settings contract and atomic persistence

**Files:**

- Modify: `server/src/admin/dto/admin-settings.dto.ts`
- Modify: `server/src/app-settings/privacy-policy-settings.service.ts`
- Test: `server/src/app-settings/privacy-policy-settings.service.spec.ts`
- Test: `server/src/admin/admin-settings.controller.spec.ts`

**Interfaces:**

- Produces: `privacyPolicy.operatorFullName: string` in the admin response.
- Produces: `PrivacyPolicySettingsService.getPlatformOperatorFullName(): Promise<string>`.
- Persists: `{ version, publishedAt, content, operatorFullName }` under `privacy.policy`.

- [ ] **Step 1: Write failing service tests**

Add assertions that an old stored payload receives the default name, a saved name is trimmed, and saving invokes a transaction that performs:

```ts
expect(prismaMock.testPublicLink.updateMany).toHaveBeenCalledWith({
  where: { personalDataProcessingMode: 'PUBLIC' },
  data: { operatorFullNameSnapshot: 'ООО «Новый оператор»' },
});
```

Also assert that no attempt model is called and that invalid empty input throws `BadRequestException` before the transaction.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test --prefix server -- privacy-policy-settings.service.spec.ts admin-settings.controller.spec.ts --runInBand`

Expected: FAIL because `operatorFullName` is absent and no `testPublicLink.updateMany` call exists.

- [ ] **Step 3: Extend DTO and service**

Add the field to the admin schemas:

```ts
operatorFullName: z.string().trim().min(1).max(512),
```

Keep stored JSON backward compatible by defaulting a missing value to `PUBLIC_OPERATOR_FULL_NAME`. Update `updatePrivacyPolicy` to use an interactive Prisma transaction:

```ts
const setting = await this.prisma.$transaction(async (transaction) => {
  const saved = await transaction.appSetting.upsert({
    /* existing key/value data */
  });
  await transaction.testPublicLink.updateMany({
    where: { personalDataProcessingMode: 'PUBLIC' },
    data: { operatorFullNameSnapshot: payload.operatorFullName },
  });
  return saved;
});
```

Return `operatorFullName` only in the admin settings response and expose `getPlatformOperatorFullName()` for link creation/update.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test --prefix server -- privacy-policy-settings.service.spec.ts admin-settings.controller.spec.ts --runInBand`

Expected: PASS.

### Task 2: Use the current name for new and mode-changed public links

**Files:**

- Modify: `server/src/tests/tests-personal-data-operator.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-links.module.ts`
- Test: `server/src/tests/tests-personal-data-operator.spec.ts`
- Test: `server/src/tests/tests-public-link.service.spec.ts`

**Interfaces:**

- Consumes: `PrivacyPolicySettingsService.getPlatformOperatorFullName()`.
- Produces: `resolvePersonalDataOperator(..., platformOperatorFullName?: string)` using the supplied name only for `PUBLIC`.

- [ ] **Step 1: Write failing resolver and service tests**

Add a resolver assertion:

```ts
await expect(
  resolvePersonalDataOperator(prisma, 'PUBLIC', null, 'ООО «Новый оператор»'),
).resolves.toMatchObject({ operatorFullNameSnapshot: 'ООО «Новый оператор»' });
```

In the link service tests, add a settings-service mock and assert that creating a `PUBLIC` link and changing a link mode to `PUBLIC` persist the configured name. Assert that organization-operated links still use the organization name.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test --prefix server -- tests-personal-data-operator.spec.ts tests-public-link.service.spec.ts --runInBand`

Expected: FAIL because the resolver and service do not accept the configured name.

- [ ] **Step 3: Implement link integration**

Inject `PrivacyPolicySettingsService` into `TestsPublicLinkService` and register it in `TestsPublicLinksModule`. Before resolving a `PUBLIC` operator, read the effective global name and pass it to the resolver. Preserve the existing organization branch and fallback constant.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test --prefix server -- tests-personal-data-operator.spec.ts tests-public-link.service.spec.ts --runInBand`

Expected: PASS.

### Task 3: Generate the API and add the admin field

**Files:**

- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-privacy.parts.tsx`
- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.tsx`
- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-workspace.tsx`
- Create: `client/src/widgets/admin-settings-workspace/ui/admin-settings-privacy.parts.test.tsx`
- Create: `client/src/widgets/admin-settings-workspace/ui/admin-settings-workspace.test.tsx`
- Regenerate: `client/src/shared/api/generated/**`
- Regenerate: `client/src/shared/api/model/**`

**Interfaces:**

- Consumes: generated `privacyPolicy.operatorFullName` and update DTO.
- Produces: labeled input `Наименование оператора персональных данных`.

- [ ] **Step 1: Generate API models after backend DTO change**

Run: `npm run gen:api`

Expected: generated admin privacy response and update request contain required `operatorFullName: string`.

- [ ] **Step 2: Write failing frontend tests**

Test that `PrivacyPolicyForm` renders the labeled input and forwards changes. Test `AdminSettingsWorkspace` with mocked generated hooks and assert submission payload:

```ts
expect(mutate).toHaveBeenCalledWith({
  data: expect.objectContaining({ operatorFullName: 'ООО «Новый оператор»' }),
});
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm run test:run --prefix client -- admin-settings-privacy.parts.test.tsx admin-settings-workspace.test.tsx`

Expected: FAIL because the input and payload field do not exist.

- [ ] **Step 4: Implement the form and state wiring**

Add `operatorFullName` to the local dirty-state object, derived effective values, validation, reset path, card props, and mutation payload. Add a required input before the policy textarea with `maxLength={512}` and a hint that the value appears when the platform is the operator.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm run test:run --prefix client -- admin-settings-privacy.parts.test.tsx admin-settings-workspace.test.tsx public-personal-data-operator.test.tsx public-test-entry-workspace.test.tsx`

Expected: PASS and both existing public templates continue rendering the shared operator component.

### Task 4: Regression, Docker, and browser acceptance

**Files:**

- Verify only: all files changed by Tasks 1-3.

**Interfaces:**

- Proves: admin persistence, public-link propagation, historical-attempt isolation, and both template renders.

- [ ] **Step 1: Run targeted and project checks**

Run:

```powershell
npm test --prefix server -- privacy-policy-settings.service.spec.ts admin-settings.controller.spec.ts tests-personal-data-operator.spec.ts tests-public-link.service.spec.ts --runInBand
npm run test:run --prefix client -- admin-settings-privacy.parts.test.tsx admin-settings-workspace.test.tsx public-personal-data-operator.test.tsx public-test-entry-workspace.test.tsx
npm run lint
npm run build --prefix server
npm run build --prefix client
git diff --check
```

Expected: all commands exit 0; any pre-existing warning is reported explicitly.

- [ ] **Step 2: Rebuild and restart Docker services**

Build `backend` and `frontend` with `docker-compose.deploy.yml` plus `docker-compose.build.yml`, then recreate only those services in project `ai_template_from_git_prod_ready`. Confirm backend, frontend, and PostgreSQL are healthy.

- [ ] **Step 3: Verify through the in-app browser**

In `/admin/settings`, change the operator name and save. Open existing `PUBLIC` links using `STANDARD` and `POLUS` and confirm the new name appears. Open an organization-operated link and confirm its own name remains. Check browser errors/warnings.

- [ ] **Step 4: Restore acceptance-test data if needed**

Restore the original operator name after the browser check unless the user explicitly wants the temporary value retained.
