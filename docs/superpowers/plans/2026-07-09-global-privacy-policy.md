# Global Privacy Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one editable global privacy policy, link it from public test pages, require explicit consent before test start, and snapshot the active policy on each new attempt.

**Architecture:** Store the global policy as one JSON value in the existing `AppSetting` table under `privacy.policy`. Expose it through a public read endpoint plus admin settings endpoints, then render it in the React app at `/privacy` and reuse one consent component in all public entry forms. Keep the existing per-link consent fields for compatibility and add attempt-level global policy snapshot fields.

**Tech Stack:** NestJS 11, Prisma 7, Zod/nestjs-zod DTOs, React 19, React Router 7, TanStack Query/Orval, Vitest, Jest, Docker Compose.

## Global Constraints

- One global privacy policy for the whole site.
- Public stable URL: `/privacy`.
- Public API: `GET /privacy-policy`.
- Admin API: `GET /admin/settings/privacy-policy` and `PATCH /admin/settings/privacy-policy`.
- Storage key: `privacy.policy` in `AppSetting`.
- No new frontend Markdown dependency; render normalized plain text safely.
- Public entry checkbox text: `Я ознакомлен(а) с Политикой обработки персональных данных и даю согласие на обработку персональных данных.`
- All `/t/*` pages must include a footer link to `/privacy`.
- Existing `TestPublicLink.consentVersion` and `TestPublicLink.consentTextSnapshot` remain unchanged.
- New attempts store global `policyVersionSnapshot` and `policyPublishedAtSnapshot`.
- Default seed comes from `C:\Users\lisitsyn\Downloads\Politika.docx`; do not publish the internal order appointing the responsible person by default.

---

## File Structure

- `server/src/app-settings/privacy-policy-settings.service.ts`: service that loads defaults, validates JSON from `AppSetting`, returns public/admin policy payloads, updates policy after admin access check, and exposes the active policy for attempt snapshots.
- `server/src/app-settings/privacy-policy-settings.service.spec.ts`: service tests for default fallback, malformed DB value fallback, admin access, update validation, and active snapshot payload.
- `server/src/app-settings/privacy-policy.default.ts`: bundled default policy text and default metadata.
- `server/src/privacy-policy.controller.ts`: unauthenticated `GET /privacy-policy` controller.
- `server/src/privacy-policy.controller.spec.ts`: controller test proving public policy read delegates to the service.
- `server/src/admin/admin-settings.controller.ts`: add admin get/update methods and inject `PrivacyPolicySettingsService`.
- `server/src/admin/admin-settings.controller.spec.ts`: extend constructor mock and add admin privacy policy tests.
- `server/src/admin/admin.module.ts` and `server/src/tests/tests-attempts.module.ts`: register `PrivacyPolicySettingsService`.
- `server/src/admin/dto/admin-settings.dto.ts`: add privacy policy response/update schemas and DTO classes.
- `server/src/tests/dto/tests-public.dto.ts`: add public privacy policy response schema and DTO class.
- `server/src/tests/tests-public-session.service.ts`: fetch active policy during new attempt allocation and save snapshot fields.
- `server/src/tests/tests-public-session.service.spec.ts`: add failing-then-passing test for attempt policy snapshot.
- `server/prisma/schema.prisma`: add nullable `policyVersionSnapshot String?` and `policyPublishedAtSnapshot DateTime?` to `TestStudentAttempt`.
- `server/prisma/migrations/20260709000000_add_attempt_privacy_policy_snapshot/migration.sql`: add nullable columns to `test_student_attempts`.
- `client/src/pages/privacy-page.tsx`: route page that fetches policy and renders content/error/loading states.
- `client/src/pages/privacy-page.test.tsx`: verifies page content rendering and retryable error state.
- `client/src/app/App.tsx`: lazy-load and register `/privacy`.
- `client/src/widgets/public-test-workspace/ui/public-privacy-consent.tsx`: shared checkbox/link component.
- `client/src/widgets/public-test-workspace/ui/public-privacy-consent.test.tsx`: verifies checkbox state and `/privacy` link.
- `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts`: change initial consent defaults to `false`.
- `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.test.ts`: update default consent expectations.
- `client/src/widgets/public-test-workspace/ui/public-test-registration-card.tsx`: render consent component before submit.
- `client/src/widgets/public-test-workspace/ui/public-test-registration-card.test.tsx`: replace old hidden-consent assertion with visible checkbox/link assertion.
- `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`: render consent component before submit.
- `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`: assert visible checkbox/link.
- `client/src/widgets/public-test-workspace/ui/polus/polus-public-entry.tsx`: render consent block for Polus entry forms.
- `client/src/features/tests/ui/public-theme-layout.tsx`: add footer link to `/privacy` for public `/t/*` pages.
- `client/src/features/tests/ui/public-theme-layout.test.tsx`: assert footer privacy link renders.
- `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.model.ts`: add `PrivacyPolicySettings` type and date formatting reuse if needed.
- `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.parts.tsx`: add privacy policy form fields.
- `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.tsx`: add `PrivacyPolicySettingsCard`.
- `client/src/widgets/admin-settings-workspace/ui/admin-settings-workspace.tsx`: fetch/update privacy policy and invalidate related queries.
- `client/src/shared/api/generated/**` and `client/src/shared/api/model/**`: regenerate with `npm run gen:api`.

### Task 1: Backend Policy API And Storage

**Files:**

- Create: `server/src/app-settings/privacy-policy.default.ts`
- Create: `server/src/app-settings/privacy-policy-settings.service.ts`
- Create: `server/src/app-settings/privacy-policy-settings.service.spec.ts`
- Create: `server/src/privacy-policy.controller.ts`
- Create: `server/src/privacy-policy.controller.spec.ts`
- Modify: `server/src/app.module.ts`
- Modify: `server/src/admin/admin.module.ts`
- Modify: `server/src/admin/admin-settings.controller.ts`
- Modify: `server/src/admin/admin-settings.controller.spec.ts`
- Modify: `server/src/admin/dto/admin-settings.dto.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`

**Interfaces:**

- Produces: `PrivacyPolicySettingsService.getPublicPrivacyPolicy(): Promise<PublicPrivacyPolicyResponse>`.
- Produces: `PrivacyPolicySettingsService.getAdminPrivacyPolicy(userId: number): Promise<AdminPrivacyPolicySettingsResponse>`.
- Produces: `PrivacyPolicySettingsService.updatePrivacyPolicy(userId: number, dto: UpdatePrivacyPolicyDto): Promise<AdminPrivacyPolicySettingsResponse>`.
- Produces: `PrivacyPolicySettingsService.getActivePolicySnapshot(): Promise<{ version: string; publishedAt: Date; content: string }>` for Task 2.
- Produces DTOs: `PublicPrivacyPolicyResponseDto`, `AdminPrivacyPolicySettingsResponseDto`, `UpdatePrivacyPolicyDto`.

- [ ] **Step 1: Add failing service tests**

Add tests that expect:

```ts
await expect(service.getPublicPrivacyPolicy()).resolves.toMatchObject({
  privacyPolicy: {
    version: '2026-07-09',
    content: expect.stringContaining('ПОЛИТИКА'),
  },
});
await expect(
  service.updatePrivacyPolicy(3, {
    version: ' 2026-07-10 ',
    publishedAt: '2026-07-10T00:00:00.000Z',
    content: ' Новая политика ',
  }),
).resolves.toMatchObject({
  privacyPolicy: {
    version: '2026-07-10',
    content: 'Новая политика',
  },
});
```

Run: `npm run test --prefix server -- privacy-policy-settings.service.spec.ts --runInBand`
Expected before implementation: FAIL because files/classes do not exist.

- [ ] **Step 2: Add DTO schemas**

In `server/src/tests/dto/tests-public.dto.ts` add `PublicPrivacyPolicySchema`:

```ts
export const PublicPrivacyPolicySchema = z.object({
  privacyPolicy: z.object({
    version: z.string(),
    publishedAt: z.string().datetime(),
    content: z.string(),
    updatedAt: z.string().datetime().nullable(),
  }),
});

export class PublicPrivacyPolicyResponseDto extends createZodDto(PublicPrivacyPolicySchema) {}
```

In `server/src/admin/dto/admin-settings.dto.ts` add matching admin schemas plus:

```ts
export const UpdatePrivacyPolicySchema = z.object({
  version: z.string().trim().min(1).max(64),
  publishedAt: z.string().datetime(),
  content: z.string().trim().min(1).max(160000),
});
```

- [ ] **Step 3: Add default policy and service implementation**

Create `privacy-policy.default.ts` exporting:

```ts
export const DEFAULT_PRIVACY_POLICY_VERSION = '2026-07-09';
export const DEFAULT_PRIVACY_POLICY_PUBLISHED_AT = '2026-07-09T00:00:00.000Z';
export const DEFAULT_PRIVACY_POLICY_CONTENT = `...normalized policy text without the internal order...`;
```

Create `privacy-policy-settings.service.ts` with `PRIVACY_POLICY_SETTING_KEY = 'privacy.policy'`. Parse stored JSON with Zod, return the default if missing or invalid, call `ensureAdminAccess(this.prisma, userId)` for admin reads and updates, and save JSON through `this.prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } })`.

- [ ] **Step 4: Add public and admin controllers**

Create `PrivacyPolicyController`:

```ts
@ApiTags('privacy-policy')
@ApiPublicErrorResponses()
@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicySettingsService: PrivacyPolicySettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public privacy policy' })
  @ApiResponse({ status: 200, type: PublicPrivacyPolicyResponseDto })
  getPrivacyPolicy() {
    return this.privacyPolicySettingsService.getPublicPrivacyPolicy();
  }
}
```

Register it in `AppModule.controllers`. Inject `PrivacyPolicySettingsService` into `AdminSettingsController` and add `GET/PATCH privacy-policy` methods. Register the service in `AdminModule.providers`.

- [ ] **Step 5: Verify Task 1**

Run:

```powershell
npm run test --prefix server -- privacy-policy-settings.service.spec.ts privacy-policy.controller.spec.ts admin-settings.controller.spec.ts --runInBand
npm run test:e2e --prefix server -- openapi.e2e-spec.ts --runInBand
```

Expected: all selected suites PASS.

### Task 2: Attempt Policy Snapshots

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260709000000_add_attempt_privacy_policy_snapshot/migration.sql`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`
- Modify: `server/src/tests/tests-attempts.module.ts`

**Interfaces:**

- Consumes: `PrivacyPolicySettingsService.getActivePolicySnapshot()`.
- Produces database columns `test_student_attempts."policyVersionSnapshot"` and `test_student_attempts."policyPublishedAtSnapshot"`.

- [ ] **Step 1: Add failing session service test**

In `tests-public-session.service.spec.ts`, add `getActivePolicySnapshotMock` to the service constructor mock and assert `createAttemptMock` receives:

```ts
policyVersionSnapshot: '2026-07-09',
policyPublishedAtSnapshot: new Date('2026-07-09T00:00:00.000Z'),
```

Run: `npm run test --prefix server -- tests-public-session.service.spec.ts --runInBand`
Expected before implementation: FAIL because the service does not call the new snapshot method.

- [ ] **Step 2: Add Prisma schema and migration**

In `TestStudentAttempt` add:

```prisma
policyVersionSnapshot     String?
policyPublishedAtSnapshot DateTime?
```

Create migration SQL:

```sql
ALTER TABLE "test_student_attempts"
  ADD COLUMN "policyVersionSnapshot" TEXT,
  ADD COLUMN "policyPublishedAtSnapshot" TIMESTAMP(3);
```

- [ ] **Step 3: Save snapshot during new attempt allocation**

Inject `PrivacyPolicySettingsService` into `TestsPublicSessionService`. In `allocateAttempt`, after determining a new attempt is needed and before `client.testStudentAttempt.create`, call `const activePolicy = await this.privacyPolicySettingsService.getActivePolicySnapshot();` and include the two snapshot fields in `data`.

- [ ] **Step 4: Verify Task 2**

Run:

```powershell
npm run prisma:generate
npm run verify:prisma-migrations
npm run test --prefix server -- tests-public-session.service.spec.ts --runInBand
```

Expected: Prisma generation exits 0, migration verifier exits 0, selected test suite PASS.

### Task 3: Public Frontend Page, Footer, And Consent UI

**Files:**

- Create: `client/src/pages/privacy-page.tsx`
- Create: `client/src/pages/privacy-page.test.tsx`
- Create: `client/src/widgets/public-test-workspace/ui/public-privacy-consent.tsx`
- Create: `client/src/widgets/public-test-workspace/ui/public-privacy-consent.test.tsx`
- Modify: `client/src/app/App.tsx`
- Modify: `client/src/features/tests/ui/public-theme-layout.tsx`
- Modify: `client/src/features/tests/ui/public-theme-layout.test.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.test.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-registration-card.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-registration-card.test.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-demographic-profile-card.test.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/polus/polus-public-entry.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts`

**Interfaces:**

- Consumes generated hook `usePrivacyPolicyControllerGetPrivacyPolicy`.
- Produces route `/privacy`.
- Produces component `PublicPrivacyConsent({ checked, onCheckedChange, className? })`.

- [ ] **Step 1: Add failing UI tests**

Update helper test to expect both `initialFormState.consentAccepted` and `initialDemographicFormState.consentAccepted` to be `false`. Update registration and demographic card tests to assert `screen.getByRole('checkbox', { name: /политик/i })` and `screen.getByRole('link', { name: /политик/i }).getAttribute('href') === '/privacy'`.

Run:

```powershell
npm run test:run --prefix client -- public-test-entry.helpers.test.ts public-test-registration-card.test.tsx public-test-demographic-profile-card.test.tsx
```

Expected before implementation: FAIL because defaults are `true` and checkboxes are absent.

- [ ] **Step 2: Implement shared consent component and initial defaults**

Create `PublicPrivacyConsent` using a native checkbox with a stable id, `checked`, `onChange`, and a normal `<a href="/privacy" target="_blank" rel="noreferrer">Политикой обработки персональных данных</a>`. Change both initial form states to `consentAccepted: false`.

- [ ] **Step 3: Render consent in standard and Polus entry forms**

In standard cards, render `PublicPrivacyConsent` before `SubmitButton` and call the existing field change handlers with `consentAccepted`. In `PolusPublicEntry`, render the same component before the submit button; for `DEMOGRAPHIC` update demographic state, otherwise update education state.

- [ ] **Step 4: Add public page and footer**

Add `/privacy` lazy route in `App.tsx`. `privacy-page.tsx` fetches the policy, renders `h1`, version/date metadata, paragraphs split by blank lines, and a retryable error state. Extend `PublicThemeLayout` to render a footer link to `/privacy` after `children`.

- [ ] **Step 5: Verify Task 3**

Run:

```powershell
npm run test:run --prefix client -- privacy-page.test.tsx public-privacy-consent.test.tsx public-theme-layout.test.tsx public-test-entry.helpers.test.ts public-test-registration-card.test.tsx public-test-demographic-profile-card.test.tsx public-test-entry-submit.test.ts
```

Expected: selected frontend suites PASS.

### Task 4: Admin Editing UI And Generated Client

**Files:**

- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-workspace.tsx`
- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.tsx`
- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.parts.tsx`
- Modify: `client/src/widgets/admin-settings-workspace/ui/admin-settings-cards.model.ts`
- Modify: `client/src/shared/api/generated/**`
- Modify: `client/src/shared/api/model/**`
- Modify: `server/openapi.json`

**Interfaces:**

- Consumes generated hooks `useAdminSettingsControllerGetPrivacyPolicySettings`, `useAdminSettingsControllerUpdatePrivacyPolicy`, and `getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey`.
- Produces admin card props: `privacyPolicy`, `version`, `publishedAt`, `content`, `isLoading`, `isError`, `isSaving`, `canSubmit`, `onSubmit`, `onRetry`, `onVersionChange`, `onPublishedAtChange`, `onContentChange`.

- [ ] **Step 1: Regenerate API client**

Run:

```powershell
npm run gen:api
```

Expected: exits 0 and creates privacy-policy/admin hooks and model types.

- [ ] **Step 2: Add failing admin UI coverage if a nearby test exists**

If no admin settings workspace test exists, rely on generated typecheck/build for this task. If adding a focused test is cheaper than the setup, assert the card contains `Политика персональных данных`, a version input, a publication date input, a textarea, and a save button.

- [ ] **Step 3: Implement admin card**

Add a card named `Политика персональных данных` with version input, `datetime-local` publication field converted to/from ISO, textarea for content, metadata showing last update, retry state, and save button. On success, invalidate the admin privacy query and show `Политика персональных данных сохранена`.

- [ ] **Step 4: Verify Task 4**

Run:

```powershell
npm run build --prefix client
npm run build --prefix server
```

Expected: both builds exit 0.

### Task 5: Docker Smoke And In-App Browser Visual Verification

**Files:**

- No code files expected beyond Tasks 1-4.

**Interfaces:**

- Verifies running Docker app on `http://127.0.0.1:8082`.

- [ ] **Step 1: Run full targeted checks**

Run:

```powershell
npm run lint --prefix server
npm run lint --prefix client
npm run test --prefix server -- privacy-policy-settings.service.spec.ts privacy-policy.controller.spec.ts admin-settings.controller.spec.ts tests-public-session.service.spec.ts --runInBand
npm run test:run --prefix client -- privacy-page.test.tsx public-privacy-consent.test.tsx public-theme-layout.test.tsx public-test-entry.helpers.test.ts public-test-registration-card.test.tsx public-test-demographic-profile-card.test.tsx public-test-entry-submit.test.ts
npm run build --prefix server
npm run build --prefix client
```

Expected: all commands exit 0.

- [ ] **Step 2: Rebuild and run Docker**

From the runnable compose directory or source deployment compose, rebuild backend/frontend images, apply migrations, and bring the app back on `APP_HTTP_PORT=8082`.

Run:

```powershell
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

Expected: backend, frontend, and postgres containers are `running` or `healthy`.

- [ ] **Step 3: Smoke HTTP endpoints**

Run:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8082/privacy
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8082/api/privacy-policy
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8082/t/KQZF5Q56
```

Expected: all return HTTP 200.

- [ ] **Step 4: In-app browser visual test**

Use the Browser plugin on `http://127.0.0.1:8082/t/KQZF5Q56` and verify:

```js
{
  checkboxCount: document.querySelectorAll('input[type="checkbox"]').length,
  privacyLinkCount: [...document.querySelectorAll('a')].filter((a) => a.href.includes('/privacy')).length
}
```

Expected: `checkboxCount >= 1`, `privacyLinkCount >= 1`. Attempting to submit with profile fields filled but checkbox unchecked must remain on `/t/KQZF5Q56` and show the consent error. Checking the box and submitting may start the test.

- [ ] **Step 5: Commit implementation**

Run:

```powershell
git status --short
git add server client docs/superpowers/plans/2026-07-09-global-privacy-policy.md
git commit -m "feat: publish global privacy policy"
```

Expected: commit succeeds and `git status --short --branch` shows a clean feature branch.
