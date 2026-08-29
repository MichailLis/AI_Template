# Project Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить проблемы, найденные аудитом проекта: локальные секреты и нестабильный Docker runtime, мутирующий lint-gate, несогласованный error/API contract, слабую обработку refresh-token, сайд-эффекты в публичном чтении сессий, пробелы в e2e/frontend coverage, drift в architecture manifest/OpenAPI checks, отсутствие DB-level уникальности порядка и dependency audit риски.

**Architecture:** Работать строго по `AI_GUIDE.md`: backend через Nest modules/controllers/services/DTO, frontend через FSD boundaries, API client только через generated Orval client и shared API runtime, Docker запуск только через root `docker-compose.yml`. Изменения идут слоями: сначала воспроизводимость и gates, затем backend contract/security, затем tests/API generation, затем frontend checks, затем dependency upgrades и финальная smoke-верификация.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL 16, React 19, TypeScript 5.9, Vite 7, Orval, Jest/Supertest, Docker Compose.

---

## Review Notes Incorporated

- Backend/security review: security/env cleanup, shared app setup before e2e contract changes, strict refresh parsing, read-only public session access, DB unique order constraints with two-phase writes, public session e2e.
- Frontend/FSD review: unify frontend API URL env contract, run `gen:api` after backend contract changes, add Vitest/RTL plus browser-level smoke for public/admin routes.
- Infra/DB review: remove `server/.env` compose dependency, switch Docker installs to `npm ci`, add backend/frontend healthchecks, make lint read-only before verification, strengthen OpenAPI checks beyond route-only validation.
- Plan adjustment: dependency upgrades remain a separate late phase after deterministic gates exist, except for lockfile/install-script changes required for Docker reproducibility.

---

## Assumptions

- The remediation branch will be `codex/audit-remediation`.
- Ignored local env files may be edited locally during implementation, but they must not be committed.
- Real secret rotation cannot be completed by code alone. The repository change must remove secret coupling and document placeholders; the account owner must rotate any exposed `OPENROUTER_API_KEY` and JWT secrets in the real environment.
- API contract changes require `npm run gen:api` before client lint/build.
- `verify:template` intentionally mutates generated API and Prisma state, so run it only after the corresponding schema/API changes are ready.
- Do not use `.devcontainer/docker-compose.devcontainer.yml` for this work.

---

## Success Criteria

- Tracked runtime config files contain no hardcoded runtime secrets or legacy dev JWT placeholders.
- Root `docker-compose.yml` starts the expected four containers: `ai_template_frontend`, `ai_template_backend`, `ai_template_postgres`, `ai_template_adminer`.
- Server lint is read-only; auto-fix is available only through an explicit `lint:fix` script.
- Backend e2e bootstrap uses the same global filter/CORS/Swagger setup as production bootstrap.
- Swagger/OpenAPI documents shared error responses and the refresh response contract accurately.
- Refresh token parsing accepts only a valid `Bearer <token>` header.
- Public session read routes do not update DB state as a side effect.
- Test question/option/slider-band ordering has DB uniqueness and service code that can reorder safely under those constraints.
- Public test session e2e covers start, answer save, finish, result, expired session, and invalid token cases.
- Frontend has a minimal Vitest/Testing Library harness and browser-level smoke for critical public/admin routes.
- Architecture verification checks feature-owned files and OpenAPI operations/responses, not only a base route.
- Dependency audit state is measured with explicit scripts; remaining vulnerabilities are either fixed or documented with package, severity, path, and reason.

---

## Execution Rules

- [ ] Before every task, run:

  ```powershell
  git status --short
  ```

  If there are unrelated user changes, do not overwrite them.

- [ ] Keep each task in a small commit-sized slice. If a task causes broad generated diff, isolate it in that task.

- [ ] After backend controller/DTO/schema changes, run API generation before client verification:

  ```powershell
  npm run gen:api
  ```

- [ ] Use read-only checks for investigation. Do not run root `npm run lint` until server lint is made non-mutating.

- [ ] For implementation subtasks that are independent, use agents on `gpt-5.3-codex-spark` for quick focused review or small file-scoped patches.

---

## Phase 0 - Baseline And Branch

### Task 0.1 - Create the working branch

- [x] Create or switch to:

  ```powershell
  git switch -c codex/audit-remediation
  ```

  If the branch already exists, use:

  ```powershell
  git switch codex/audit-remediation
  ```

- [x] Capture baseline read-only checks:

  ```powershell
  npm run verify:ai-guide
  npm run verify:api-mutator
  npm run verify:architecture
  npm run verify:maintainability
  npm run lint --prefix client
  Push-Location server
  npx eslint "src/**/*.ts"
  Pop-Location
  npm run test --prefix server
  npm run test:e2e --prefix server
  npm run build --prefix server
  npm run build --prefix client
  ```

- [x] Record known baseline audit output without changing lockfiles:
  ```powershell
  npm audit --json
  npm --prefix client audit --json
  npm --prefix server audit --json
  ```

### Verify

- [x] Baseline results are captured in the PR/implementation notes.
- [x] No generated or lint-fix diff appears after the baseline commands.

---

## Phase 1 - Runtime Secrets, Env Contract, Docker Determinism

### Task 1.1 - Remove compose dependency on `server/.env`

Modify:

- `docker-compose.yml`
- `.env.deploy.example`
- `docs/deployment-dockerhub.md`
- `docs/server-admin-deploy.md`
- create `server/.env.example` if it does not exist
- create root `.env.example` only if root compose needs documented local overrides

Steps:

- [x] Remove this block from backend service:

  ```yaml
  env_file:
    - ./server/.env
  ```

- [x] Replace hardcoded backend runtime secrets with Compose interpolation and non-secret local defaults:

  ```yaml
  environment:
    DATABASE_URL: ${DATABASE_URL:-postgresql://user:password@postgres:5432/my_app_db?schema=public}
    JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-dev-access-secret-change-me}
    JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev-refresh-secret-change-me}
    OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
  ```

- [x] Ensure examples contain placeholders only. Do not write real values to tracked files.

- [x] Add a note to deployment docs: rotate any key that was present in local `.env` files and never paste secrets into compose or committed examples.

### Verify

- [x] Run:
  ```powershell
  git grep -n -E "OPENROUTER_API_KEY=.{20,}" -- docker-compose.yml .env.example server/.env.example .env.deploy.example
  docker compose config
  ```
- [x] `git grep` must not find tracked hardcoded runtime secrets. Placeholder examples are allowed only when they are clearly non-secret values.
- [x] `docker compose config` must not require `server/.env`.

### Task 1.2 - Unify frontend API URL env contract

Modify:

- `docker-compose.yml`
- `client/vite.config.ts`
- `client/src/app/App.tsx`
- `client/src/shared/api/runtime-api-base-url.ts`
- `client/.env.production` if the production value needs to stay documented

Steps:

- [x] Choose `VITE_API_URL` as the primary frontend env key because `App.tsx` already reads `import.meta.env.VITE_API_URL`.
- [x] Change frontend compose env from `VITE_PUBLIC_API_BASE_URL` to:
  ```yaml
  environment:
    VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
  ```
- [x] In `client/vite.config.ts`, make discovery read `VITE_API_URL` first and optionally keep `VITE_PUBLIC_API_BASE_URL` as a legacy fallback for one release.
- [x] Keep runtime discovery at `/__api-base-url` for local runs where `VITE_API_URL` is absent.

### Verify

- [x] Run:
  ```powershell
  npm run lint --prefix client
  npm run build --prefix client
  docker compose config
  ```
- [x] `docker compose config` shows `VITE_API_URL`, not `VITE_PUBLIC_API_BASE_URL`, for frontend.

### Task 1.3 - Use lockfile-driven installs and healthchecks in root Docker runtime

Modify:

- `docker-compose.yml`
- `server/Dockerfile`
- `client/Dockerfile`

Steps:

- [x] Replace `npm install` with `npm ci` in `server/Dockerfile` and `client/Dockerfile`.
- [x] Replace compose startup commands:
  ```yaml
  command: >
    sh -lc "npm ci &&
    npm run prisma:generate &&
    npm run prisma:push &&
    npm run start:dev"
  ```
  and:
  ```yaml
  command: >
    sh -lc "npm ci &&
    npm run dev:container"
  ```
- [x] Add backend healthcheck against `http://localhost:3000/api-json` using Node 22 `fetch`.
- [x] Add frontend healthcheck against `http://localhost:5173/`.
- [x] Change frontend `depends_on` to wait for backend `service_healthy`.

### Verify

- [x] Run:
  ```powershell
  docker compose config
  docker compose up -d
  docker compose ps
  ```
- [x] Confirm all four expected containers are present and healthy/running.
- [ ] If startup fails because old named volumes contain incompatible dependencies, remove only the named node_modules volumes after confirming scope:
  ```powershell
  docker compose down
  docker volume rm ai_template_backend_node_modules ai_template_frontend_node_modules
  docker compose up -d
  ```

---

## Phase 2 - Read-Only Verification Gates

### Task 2.1 - Make server lint non-mutating

Modify:

- `server/package.json`
- root `package.json`

Steps:

- [x] Change server scripts to:
  ```json
  "lint": "eslint \"src/**/*.ts\"",
  "lint:fix": "eslint \"src/**/*.ts\" --fix"
  ```
- [x] Keep root `lint` as `npm run lint --prefix client && npm run lint --prefix server`.
- [x] Do not add `test/**/*.ts` to lint unless `server/eslint.config.mjs` is also intentionally changed to stop ignoring tests.

### Verify

- [x] Run:
  ```powershell
  git status --short
  npm run lint --prefix server
  git status --short
  npm run lint
  git status --short
  ```
- [x] The two `git status --short` outputs after lint must be identical.

### Task 2.2 - Add audit scripts without enforcing them yet

Modify:

- root `package.json`

Steps:

- [x] Add scripts:
  ```json
  "audit:all": "npm audit && npm --prefix client audit && npm --prefix server audit",
  "audit:prod": "npm audit --omit=dev && npm --prefix client audit --omit=dev && npm --prefix server audit --omit=dev"
  ```
- [x] Do not insert them into `verify:local` or `verify:template` until dependency remediation is complete.

### Verify

- [x] Run:
  ```powershell
  npm run audit:prod -- --json
  ```
- [x] If npm does not forward `--json` cleanly through scripts on this platform, use direct commands:
  ```powershell
  npm audit --omit=dev --json
  npm --prefix client audit --omit=dev --json
  npm --prefix server audit --omit=dev --json
  ```

---

## Phase 3 - Shared Backend Bootstrap And Error Contract

### Task 3.1 - Share production app setup with e2e tests

Modify:

- `server/src/main.ts`
- create `server/src/setup-app.ts`
- `server/test/*.e2e-spec.ts`
- `server/src/scripts/generate-openapi.ts`

Steps:

- [x] Extract global setup into `setupApp(app: INestApplication)`:
  - `app.useGlobalFilters(new AllExceptionsFilter())`
  - CORS setup that currently lives in `main.ts`
  - Swagger setup through existing `setupSwagger(app)`
- [x] Keep `main.ts` responsible for `NestFactory.create`, `setupApp(app)`, and `app.listen`.
- [x] Update every e2e bootstrap to call `setupApp(app)` before `app.init()`.
- [x] Update OpenAPI generation script to call the same setup if it currently builds a document without global metadata/decorators.

### Verify

- [x] Run:
  ```powershell
  npm run test:e2e --prefix server
  npm run openapi:generate --prefix server
  ```
- [x] E2E tests may fail only where they still expect default Nest error shape; update those in Task 3.3.

### Task 3.2 - Add explicit shared error DTO and Swagger decorators

Modify/create:

- `server/src/common/filters/all-exceptions.filter.ts`
- `server/src/common/dto/error-response.dto.ts`
- `server/src/common/decorators/api-error-responses.decorator.ts`
- controllers under `server/src/auth/**`
- controllers under `server/src/admin/**`
- controllers under `server/src/tests/**`

Steps:

- [x] Create `ErrorResponseDto` matching the real filter shape:
  ```ts
  {
    success: false,
    error: {
      statusCode: number,
      code: string,
      message: string,
      details: unknown[]
    },
    timestamp: string,
    path: string
  }
  ```
- [x] Keep the filter shape stable unless a controller/client test proves it must change.
- [x] Add a reusable decorator with the common `400`, `401`, `403`, `404`, `409`, `500` response DTOs.
- [x] Apply the decorator to auth/admin/tests/public controllers where those responses are possible.

### Verify

- [x] Run:
  ```powershell
  npm run openapi:generate --prefix server
  npm run gen:api
  npm run verify:api-mutator
  npm run test:e2e --prefix server
  npm run build --prefix client
  ```
- [x] Generated OpenAPI contains `ErrorResponseDto`.

### Task 3.3 - Update error expectations in e2e and client-facing helpers

Modify:

- `server/test/auth.e2e-spec.ts`
- `server/test/admin*.e2e-spec.ts`
- any new public session e2e from Phase 6 after it is added
- client helper code only if it currently reads Nest default `message` shape

Steps:

- [x] Replace default Nest error expectations with normalized filter shape:
  ```ts
  expect(response.body.success).toBe(false);
  expect(response.body.error.message).toBe(...);
  ```
- [x] Do not add a parallel second error format in client code unless required for backward compatibility with already-deployed APIs.

### Verify

- [x] Run:
  ```powershell
  npm run test:e2e --prefix server
  npm run build --prefix client
  ```

---

## Phase 4 - Auth Refresh Contract And Coverage

### Task 4.1 - Fix refresh response OpenAPI contract

Modify/create:

- `server/src/auth/auth.controller.ts`
- `server/src/auth/auth.service.ts` only if service return shape is intentionally changed
- create `server/src/auth/dto/refresh-response.dto.ts`
- generated client files after `npm run gen:api`

Steps:

- [x] Keep refresh service behavior minimal: if it returns only tokens today, document it with a dedicated `RefreshResponseDto`.
- [x] Do not reuse `AuthResponseDto` for refresh unless refresh also returns `user`.
- [x] Update Swagger decorators for refresh endpoint to use the correct DTO.

### Verify

- [x] Run:
  ```powershell
  npm run openapi:generate --prefix server
  npm run gen:api
  npm run verify:api-mutator
  npm run test --prefix server
  npm run build --prefix client
  ```

### Task 4.2 - Strict refresh token extraction

Modify:

- `server/src/auth/strategies/rt.strategy.ts`
- auth unit/e2e tests under `server/src/auth/**` or `server/test/auth.e2e-spec.ts`

Steps:

- [x] Replace manual header parsing with Passport JWT extractor output:
  ```ts
  const extractBearerToken = ExtractJwt.fromAuthHeaderAsBearerToken();
  const refreshToken = extractBearerToken(req);
  ```
- [x] Reject missing/malformed/empty bearer tokens with `UnauthorizedException`.
- [x] Add tests for:
  - valid refresh succeeds
  - malformed `Authorization` header fails
  - missing bearer value fails
  - reused/invalidated refresh token fails after logout or refresh rotation

### Verify

- [x] Run:
  ```powershell
  npm --prefix server run test -- auth
  npm run test:e2e --prefix server
  ```

---

## Phase 5 - Public Session Read Purity And Expiry Semantics

### Task 5.1 - Make session lookup read-only

Modify:

- `server/src/tests/tests-attempt-access.ts`
- `server/src/tests/tests-public-session.service.ts`
- `server/src/tests/tests-analysis.service.ts`
- focused Jest specs under `server/src/tests/**`

Steps:

- [x] Change `getSessionAttemptByTokenOrThrow` so it only reads and throws. It must not call `prisma.testStudentAttempt.update`.
- [x] Move expiry interpretation into a pure helper or status mapper.
- [x] Update `TestsAnalysisService.toAttemptStatus` to consider `expiresAt` when `status === 'IN_PROGRESS'`.
- [x] Keep actual writes to expired/finished state only in explicit mutating flows such as start, save answers, finish, or a dedicated cleanup job.

### Verify

- [x] Add a test that spies on Prisma update and confirms `getSession`/read path does not update an expired attempt.
- [x] Run:
  ```powershell
  npm --prefix server run test -- tests-attempt-access
  npm --prefix server run test -- tests-analysis
  npm run test:e2e --prefix server
  ```

### Task 5.2 - Preserve answer/finish behavior for expired sessions

Modify:

- `server/src/tests/tests-public-session.service.ts`
- `server/src/tests/tests-public-session.service.spec.ts` or equivalent focused spec

Steps:

- [x] Ensure `saveAnswer` rejects expired attempts.
- [x] Ensure `finishSession` rejects expired attempts.
- [x] Ensure `getSession` can return an expired status without mutating the attempt.

### Verify

- [x] Run:
  ```powershell
  npm --prefix server run test -- tests-public-session
  ```

---

## Phase 6 - DB Ordering Integrity

### Task 6.1 - Add safe two-phase question reorder

Modify:

- `server/src/tests/tests-question.service.ts`
- focused tests under `server/src/tests/**`

Steps:

- [x] Add a regression test for swapping two questions in the same version.
- [x] Update `reorderQuestions` to use a two-phase transaction:
  - phase 1: set each affected question to a unique temporary negative order
  - phase 2: set final positive order values
- [x] Keep authorization/version ownership checks unchanged.

### Verify

- [x] Run:
  ```powershell
  npm --prefix server run test -- tests-question
  ```

### Task 6.2 - Add DB uniqueness for ordered child collections

Modify:

- `server/prisma/schema.prisma`
- services/DTOs that create or update options and slider bands if tests show duplicate order can enter through API

Steps:

- [x] Add uniqueness for question order within a version:
  ```prisma
  @@unique([versionId, order])
  ```
- [x] Add uniqueness for option order within a question:
  ```prisma
  @@unique([questionId, order])
  ```
- [x] Add uniqueness for slider-band order within a question:
  ```prisma
  @@unique([questionId, order])
  ```
- [x] Before applying to an existing non-empty DB, run a duplicate-order check. If duplicates exist, normalize them in a one-time data fix before `prisma:push`.

### Verify

- [x] Run:
  ```powershell
  npm run prisma:generate --prefix server
  npm run prisma:push --prefix server
  npm --prefix server run test -- tests-question
  npm run test --prefix server
  ```

---

## Phase 7 - Public Session E2E Coverage

### Task 7.1 - Add public session e2e suite

Create:

- `server/test/tests-public-session.e2e-spec.ts`

Modify only if needed:

- `server/test/jest-e2e.json`
- shared test factories/helpers if they already exist

Scenarios:

- [x] Create admin user and sign in.
- [x] Create or seed a test topic with a published version and at least one public link.
- [x] `GET /tests/public/links/{code}` returns public test metadata.
- [x] `POST /tests/public/links/{code}/start` creates a session.
- [x] `GET /tests/public/sessions/{sessionToken}` returns questions and current status.
- [x] `PUT /tests/public/sessions/{sessionToken}/answers` saves answers.
- [x] `POST /tests/public/sessions/{sessionToken}/finish` finishes session.
- [x] `GET /tests/public/sessions/{sessionToken}/result` returns result/analysis state.
- [x] Invalid code/token returns normalized `ErrorResponseDto` shape.
- [x] Expired session read returns expired status without DB mutation.
- [x] Expired session finish returns a normalized error without DB mutation.

### Verify

- [x] Run:
  ```powershell
  npm --prefix server run test:e2e -- tests-public-session
  npm run test:e2e --prefix server
  npm run verify:local
  ```

---

## Phase 8 - Frontend Unit Tests And Browser Smoke

### Task 8.1 - Add minimal Vitest and Testing Library harness

Modify/create:

- `client/package.json`
- `client/vitest.config.ts`
- `client/src/test/setup.ts`
- `client/eslint.config.js` only if tests need lint env/globals

Steps:

- [x] Install dev dependencies:
  ```powershell
  npm install --prefix client -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [x] Add scripts:
  ```json
  "test": "vitest",
  "test:run": "vitest run"
  ```
- [x] Configure alias `@` in `vitest.config.ts`.
- [x] Keep generated API folders excluded from test coverage.

### Verify

- [x] Run:
  ```powershell
  npm run test:run --prefix client
  npm run lint --prefix client
  npm run build --prefix client
  ```

### Task 8.2 - Add focused frontend tests

Create tests next to the relevant modules:

- `client/src/shared/lib/storage.test.ts`
- `client/src/shared/api/runtime-api-base-url.test.ts`
- `client/src/widgets/public-test-workspace/ui/public-test-entry.helpers.test.ts`
- `client/src/widgets/public-test-workspace/ui/public-test-entry-submit.test.ts`
- `client/src/widgets/public-test-workspace/ui/public-test-run-answer.helpers.test.ts`
- `client/src/widgets/admin-prompts-workspace/ui/admin-prompts-workspace.helpers.test.ts`
- `client/src/features/tests/model/use-ai-test-generation.helpers.test.ts`
- optional smoke: auth `LoginForm` and `ProtectedRoute` if their dependencies can be isolated cleanly

Coverage goals:

- [x] `safeStorage` fallback does not throw when browser storage is unavailable.
- [x] Runtime API discovery accepts valid HTTP(S) base URLs and ignores malformed values.
- [x] Public test entry validation preserves existing UX behavior.
- [x] Public answer payload helpers format choice/slider answers correctly.
- [x] Admin prompt/test AI parsing helpers reject invalid model output safely.

### Verify

- [x] Run:
  ```powershell
  npm run test:run --prefix client
  npm run lint --prefix client
  npm run build --prefix client
  ```

### Task 8.3 - Promote browser-level smoke for critical flows

Modify/create:

- `scripts/e2e-admin-tests-ia.mjs` if it can be stabilized
- or create `scripts/e2e-critical-flows.mjs`
- root `package.json`

Steps:

- [x] Add a script such as:
  ```json
  "verify:e2e:critical": "node scripts/e2e-critical-flows.mjs"
  ```
- [x] Cover at least:
  - `/login`
  - protected `/admin/tests`
  - public `/t/:code`
  - public `/t/:code/session/:sessionToken`
- [x] Use root `docker-compose.yml` or existing smoke server scripts. Do not require `.devcontainer` compose.
- [x] Keep this out of `verify:local` until it is stable on clean workstations; document the command in the PR.

### Verify

- [x] Run:
  ```powershell
  npm run verify:e2e:critical
  ```

---

## Phase 9 - Architecture Manifest And OpenAPI Verification

### Task 9.1 - Bring `tests` feature ownership up to date

Modify:

- `template/features.manifest.json`
- `scripts/verify-architecture.mjs`

Steps:

- [x] Expand the `tests` feature entry to cover the current owned backend roots:
  - `server/src/tests`
- [x] Expand the `tests` feature entry to cover the current owned frontend roots:
  - `client/src/features/tests`
  - `client/src/widgets/admin-tests-workspace`
  - `client/src/widgets/admin-public-links-workspace`
  - `client/src/widgets/admin-public-links-stats-workspace`
  - `client/src/widgets/admin-education-organizations-workspace`
  - `client/src/widgets/public-test-workspace`
  - `client/src/pages/t`
  - `client/src/pages/admin/admin-tests-page.tsx`
  - `client/src/pages/admin/admin-public-links-page.tsx`
  - `client/src/pages/admin/admin-public-links-stats-page.tsx`
  - `client/src/pages/admin/admin-public-links-organizations-page.tsx`
- [x] Avoid a catch-all such as `client/src/widgets/**`.
- [x] If the verifier currently supports only exact file arrays, either enumerate these files with `rg --files` or add a narrow `ownedRoots` field and validate it explicitly.

### Verify

- [x] Run:
  ```powershell
  npm run verify:architecture
  ```
- [x] Temporarily add a throwaway file under an owned root during local testing and confirm the verifier catches or accounts for it, then remove the throwaway file.

### Task 9.2 - Verify OpenAPI operations and response codes

Modify:

- `template/features.manifest.json`
- `scripts/verify-architecture.mjs`

Steps:

- [x] Extend manifest support for OpenAPI operations. For `tests`, include these path families:
  - `/admin/tests`
  - `/admin/tests/{topicId}`
  - `/admin/tests/{topicId}/archive`
  - `/admin/tests/{topicId}/restore`
  - `/admin/tests/ai/create`
  - `/admin/tests/{topicId}/draft`
  - `/admin/tests/{topicId}/draft/questions`
  - `/admin/tests/{topicId}/draft/questions/reorder`
  - `/admin/tests/{topicId}/draft/questions/{questionId}`
  - `/admin/tests/{topicId}/publish`
  - `/admin/tests/public-links`
  - `/admin/tests/public-links/archived`
  - `/admin/tests/public-links/{linkId}`
  - `/admin/tests/public-links/{linkId}/regenerate`
  - `/admin/tests/public-links/{linkId}/restore`
  - `/admin/tests/education-organizations`
  - `/admin/tests/education-organizations/{organizationId}`
  - `/admin/tests/public-links/{linkId}/attempts`
  - `/admin/tests/attempts/{attemptId}`
  - `/tests/public/links/{code}`
  - `/tests/public/links/{code}/start`
  - `/tests/public/sessions/{sessionToken}`
  - `/tests/public/sessions/{sessionToken}/answers`
  - `/tests/public/sessions/{sessionToken}/finish`
  - `/tests/public/sessions/{sessionToken}/result`
- [x] For each operation, verify the expected HTTP method exists.
- [x] For protected routes, verify `401` or shared error response documentation exists.
- [x] For public not-found/invalid-token routes, verify documented error responses exist.

### Verify

- [x] Run:
  ```powershell
  npm run gen:api
  npm run verify:architecture
  npm run verify:api-mutator
  ```

---

## Phase 10 - Dependency Audit Remediation

### Task 10.1 - Update safely in three scopes

Modify:

- `package-lock.json`
- `client/package-lock.json`
- `server/package-lock.json`
- `package.json`, `client/package.json`, `server/package.json` only for direct dependency changes

Steps:

- [x] Re-run audit and outdated snapshots:
  ```powershell
  npm audit --json
  npm outdated
  npm --prefix client audit --json
  npm --prefix client outdated
  npm --prefix server audit --json
  npm --prefix server outdated
  ```
- [x] Apply patch/minor lockfile-safe updates first:
  ```powershell
  npm update
  npm --prefix client update
  npm --prefix server update
  ```
- [x] For remaining direct vulnerable packages, update one ecosystem at a time and run that ecosystem's gates before moving on.
- [x] Treat major updates to Nest, Prisma, Vite, Orval, Jest, and Angular Devkit as separate sub-slices with explicit test/build verification.
- [x] Do not run a broad `npm audit fix --force` unless a human approves the breaking upgrade plan.

### Verify

- [x] After each scope, run:
  ```powershell
  npm run verify:ai-guide
  npm run verify:api-mutator
  npm run verify:architecture
  npm run verify:maintainability
  npm run lint
  npm run test --prefix server
  npm run test:e2e --prefix server
  npm run test:run --prefix client
  npm run build --prefix server
  npm run build --prefix client
  ```

### Task 10.2 - Document residual audit risk

Modify/create:

- `docs/security-audit-remediation.md`

Steps:

- [x] For every remaining vulnerability, document:
  - package name
  - severity
  - direct or transitive dependency path
  - whether it affects production runtime or dev tooling only
  - why it cannot be fixed in this branch
  - follow-up owner/action

### Verify

- [x] Run:
  ```powershell
  npm run audit:prod
  npm run audit:all
  ```
- [x] If `audit:all` still fails, `docs/security-audit-remediation.md` explains every remaining item.

---

## Phase 11 - Final Verification And Runtime Smoke

### Task 11.1 - Regenerate contracts and run full local gates

- [x] Run:

  ```powershell
  npm run prisma:generate
  npm run prisma:push
  npm run gen:api
  npm run verify:local
  ```

- [x] Then run the template gate:

  ```powershell
  npm run verify:template
  ```

- [x] Confirm generated client diffs are expected and no unrelated files changed.

### Task 11.2 - Docker smoke using the supported root compose

- [x] Run:

  ```powershell
  docker compose down
  docker compose up -d
  docker compose ps
  npm run verify:smoke:server
  npm run verify:smoke:client
  ```

- [x] Confirm the expected runtime topology:
  - `ai_template_frontend`
  - `ai_template_backend`
  - `ai_template_postgres`
  - `ai_template_adminer`

### Task 11.3 - Final review checklist

- [x] Run:
  ```powershell
  git status --short
  git diff --check
  git grep -n -E "OPENROUTER_API_KEY=.{20,}" -- docker-compose.yml .env.example server/.env.example .env.deploy.example
  ```
- [x] Request a final code review focused on:
  - env/compose reproducibility
  - error/OpenAPI contract
  - auth refresh parsing
  - public session side effects
  - DB reorder safety
  - frontend test harness
  - dependency residual risk

Review follow-up:

- [x] Added `verify:package-scripts` and `verify:runtime-config` to `verify:local` and `verify:template`.
- [x] Added Orval Prettier formatting so `npm run gen:api` does not leave generated EOF whitespace.
- [x] Re-ran `npm run verify:local`, `npm run verify:template`, root Docker smoke checks, `git diff --check`, and secret greps after the review fixes.

---

## Parallelization Map

- Worker A: Phase 1 and Phase 2 infra/gates. Owns `docker-compose.yml`, Dockerfiles, package scripts, env examples, deployment docs.
- Worker B: Phase 3 and Phase 4 backend contract/auth. Owns `server/src/main.ts`, `server/src/setup-app.ts`, common error DTO/decorators, auth controller/service/strategy, auth e2e.
- Worker C: Phase 5, Phase 6, Phase 7 tests/public session/DB ordering. Owns `server/src/tests/**`, `server/prisma/schema.prisma`, public session e2e.
- Worker D: Phase 8 frontend tests/browser smoke. Owns client test config, focused frontend tests, critical browser smoke script.
- Worker E: Phase 9 and Phase 10 architecture/dependency audit. Owns manifest/verifier, audit scripts, lockfile update notes.

Workers must not edit another worker's owned files without syncing first. Generated API/Prisma files should be regenerated in an integration pass after backend/schema work lands.

---

## Known Risk Areas

- `prisma:push` can fail if an existing local database already has duplicate order values. Run duplicate checks and normalize data before applying uniqueness constraints.
- `npm ci` in bind-mounted compose services can make first startup slower, but it keeps runtime aligned with lockfiles.
- Dependency remediation may require major upgrades. Keep those changes separate from behavior fixes so regressions are easy to isolate.
- Error contract normalization can break tests that implicitly relied on default Nest errors. Update expectations deliberately and avoid supporting multiple server error shapes unless needed for deployed backwards compatibility.
