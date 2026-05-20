# Technical Debt Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the high-risk issues from `docs/technical-debt-audit-2026-05-21.md` without turning the remediation into one unsafe mega-refactor.

**Architecture:** Treat this as a sequence of small, reviewable remediation branches. Protect production data and public test lifecycle first, then harden auth/runtime behavior, then make verification authoritative, then clean up hygiene and docs. Backend changes stay inside Nest services/controllers/DTOs with Prisma migrations where needed; frontend changes stay inside existing FSD boundaries; generated API changes are isolated and followed by `npm run gen:api`.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL, React 19, Vite, TanStack Query, Orval, Jest/Supertest, Vitest, Playwright, Docker Compose.

---

## Progress

- Completed in commit `ca36e23 chore: remediate technical debt audit`: Tasks 0.1, 0.2, 1.1, 1.2, 2.1-2.4, 3.1-3.3, 4.1, 4.2.
- Still open from the earlier phases: Task 1.3.
- Next recommended task: Task 4.3.

## Source Audit

- Audit: `docs/technical-debt-audit-2026-05-21.md`
- Repository rules: `AI_GUIDE.md`, `AGENTS.md`
- Normal Docker stack: root `docker-compose.yml`
- Frontend rule: after changing `client/`, rebuild frontend container before frontend verification:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  ```

## Assumptions And Decisions

- Business modules are treated as real product modules for this plan. If the repository must return to auth-only template baseline, stop after Phase 0 and replace this plan with a template cleanup plan.
- Public links should remain valid for historical published snapshots. A republish must not break already issued `/t/:code` links unless a link is explicitly archived by an admin.
- Topic delete should become safe refusal/archive behavior once published versions, public links, attempts, answers, analyses, or consent snapshots exist.
- DEMOGRAPHIC one-attempt enforcement needs a product decision: either anonymous unlimited attempts with honest UI copy, or stable privacy-preserving dedupe. This plan chooses stable dedupe because current admin copy promises one attempt.
- Public session/result URLs are bearer-style links. This plan documents and tightens that model first; separate result tokens can be a later privacy improvement.
- OpenRouter secret encryption-at-rest needs a server-held key. If no key management is available, prefer environment-only secrets and disable saving API keys as app settings.

## Global Execution Rules

- [ ] Before every task, run:

  ```powershell
  git status --short
  ```

  Do not overwrite unrelated user changes or untracked prototype/branding work.

- [ ] Keep each task commit-sized. If a task creates generated client or Prisma migration diffs, isolate those diffs in the same task.

- [ ] After backend DTO/controller/schema changes, run:

  ```powershell
  npm run gen:api
  ```

- [ ] After any `client/` change and before frontend checks, run:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  ```

- [ ] Default local verification after a task:

  ```powershell
  npm run verify:local
  ```

- [ ] Release verification after a phase:

  ```powershell
  npm run verify:template
  npm run test:run --prefix client
  npm run format:check
  npm run audit:all
  npm run verify:e2e:critical
  ```

## Phase 0 - Baseline And Product Decisions

### Task 0.1 - Create a remediation branch and capture current failures

**Files:**

- Read: `docs/technical-debt-audit-2026-05-21.md`
- Read: `AI_GUIDE.md`
- Read: `package.json`
- Read: `template/features.manifest.json`

- [x] Create branch:

  ```powershell
  git switch -c codex/technical-debt-remediation
  ```

- [x] Capture baseline checks:

  ```powershell
  npm run verify:local
  npm run test:run --prefix client
  npm run format:check
  npm run audit:all
  npm run gen:openapi
  npm run verify:architecture
  ```

- [x] Record results in implementation notes or PR description. Expected baseline from audit: `verify:local`, client tests, audits, OpenAPI, and architecture pass; `format:check` fails.

### Task 0.2 - Set the repository source of truth

**Files:**

- Modify: `AI_GUIDE.md`
- Modify: `README.md`
- Modify or replace with pointers: `AGENT.md`, `CLAUDE.md`
- Verify: `scripts/verify-ai-guide.mjs`

- [x] Decide one of two explicit baselines:
  - Product template with tests/public links/OpenRouter/Polus/admin modules.
  - Auth-only template with business modules moved out of `main`.

- [x] If product template is chosen, update `AI_GUIDE.md` and `README.md` so they no longer describe the branch as auth-only.

- [x] Convert duplicated agent instruction files into pointers to `AGENTS.md` and `AI_GUIDE.md`, or remove them if the repo owner confirms they are obsolete.

- [x] Verify:

  ```powershell
  npm run verify:ai-guide
  ```

## Phase 1 - Protect Public Links, Versions, And Student History

### Task 1.1 - Make topic deletion safe

**Audit items:** P1.2

**Files:**

- Modify: `server/src/tests/tests.service.ts`
- Modify: `server/src/tests/tests.service.spec.ts`
- Consider: `server/src/tests/dto/tests.dto.ts`

- [x] Add a failing unit test: deleting a topic with any published version, public link, attempt, answer, or analysis throws `BadRequestException`.

- [x] Implement refusal in `TestsService.deleteTopic()` before `prisma.testTopic.delete`.

- [x] Keep hard delete only for never-published, never-used draft-only topics.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests.service.spec.ts
  npm run test:e2e --prefix server
  ```

### Task 1.2 - Keep existing public links valid after republish

**Audit items:** P1.1, P2.14

**Files:**

- Modify: `server/src/tests/tests.service.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests.service.spec.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`
- Add or modify e2e: `server/test/*.e2e-spec.ts`

- [x] Add an e2e test: create topic v1, publish v1, create public link, publish v2, then `GET /tests/public/links/:code` still succeeds.

- [x] Stop rejecting public links solely because their immutable `topicVersion.status` became `ARCHIVED` after republish.

- [x] Keep explicit link archive/delete behavior unchanged: archived/inactive links must still be inaccessible.

- [x] Document archive semantics for prompt versions referenced by published test versions: archiving hides library/editor use, but does not invalidate already published versions.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests-public-link.service.spec.ts
  npm run test:e2e --prefix server
  npm run gen:api
  ```

### Task 1.3 - Fix public attempt allocation and DEMOGRAPHIC enforcement

**Audit items:** P2.2, P2.13

**Files:**

- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`
- Modify if needed: `server/src/tests/tests-attempt-access.ts`

- [ ] Add tests for concurrent starts against the same public link/student key. Expected: no duplicate attempt number leaks; either one request resumes or one request gets a clean limit/retry response.

- [ ] For DEMOGRAPHIC mode, derive a stable privacy-preserving key from normalized demographic fields and link id, not from `resumeToken`.

- [ ] Wrap attempt allocation in a transaction and retry once on Prisma unique constraint `P2002` for `[publicLinkId, studentKeyHash, attemptNumber]`.

- [ ] Verify:

  ```powershell
  npm run test --prefix server -- tests-public-session.service.spec.ts
  npm run test:e2e --prefix server
  ```

## Phase 2 - Validate Public Answers And Results Server-Side

### Task 2.1 - Add type-specific answer validation

**Audit items:** P2.1, P2.15

**Files:**

- Create: `server/src/tests/tests-answer-validation.ts`
- Create: `server/src/tests/tests-answer-validation.spec.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`

- [x] Implement a pure validator for each question type:
  - required unanswered values are rejected at finish.
  - choice values must exist in `question.options`.
  - multi-choice values must be unique, must exist in `question.options`, and must respect `settings.maxChoices`.
  - slider answers must be numeric and inside configured min/max/step.
  - free-text answers must be bounded strings if the UI supports them.

- [x] Validate `saveAnswers()` payload shape before upsert.

- [x] Validate all required questions in `finishSession()` before marking an attempt `COMPLETED`.

- [x] Narrow DTOs where OpenAPI can represent the shape. Keep a safe JSON boundary only where the question-type union cannot be expressed cleanly.

- [x] Regenerate API after DTO changes:

  ```powershell
  npm run gen:api
  ```

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests-answer-validation.spec.ts
  npm run test --prefix server -- tests-public-session.service.spec.ts
  npm run test:e2e --prefix server
  npm run test:run --prefix client
  ```

### Task 2.2 - Apply stored scoring config consistently

**Audit items:** P2.16

**Files:**

- Modify: `server/src/tests/tests-analysis.service.ts`
- Modify: `server/src/tests/prof-orientation-v3-plus.scoring.ts`
- Modify: `server/src/tests/prof-orientation-v3-plus.scoring.spec.ts`
- Modify: `server/src/tests/tests-analysis.service.spec.ts`

- [x] Add a test with a non-default `TestTopicVersion.scoringConfig` and known answers.

- [x] Ensure `upsertProfOrientationV3PlusAnalysis()` passes the version-specific config into deterministic scoring.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- prof-orientation-v3-plus.scoring.spec.ts
  npm run test --prefix server -- tests-analysis.service.spec.ts
  ```

### Task 2.3 - Separate public analysis DTO from internal analysis

**Audit items:** P2.8, P2.7

**Files:**

- Modify: `server/src/tests/tests-analysis.service.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Modify: `server/src/tests/dto/tests-analysis.dto.ts`
- Modify: `client/src/widgets/public-test-workspace/ui/public-test-result-workspace.tsx`
- Modify: `client/src/widgets/public-test-workspace/ui/polus/*`

- [x] Define the student-facing analysis fields that are allowed: status, provider mode if needed, generatedAt, safe summary blocks, user-facing error state.

- [x] Remove `rawText`, prompt internals, method internals, and debug-only fields from public session/result responses.

- [x] Keep admin analytics/attempt-detail DTOs able to access internal fields only behind admin guards.

- [x] Document tokenized public result URL behavior in `README.md` or a dedicated docs file.

- [x] Rebuild frontend container before frontend checks:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  ```

- [x] Verify:

  ```powershell
  npm run gen:api
  npm run test --prefix server
  npm run test:run --prefix client
  npm run build --prefix client
  ```

### Task 2.4 - Reconcile public answer draft after save

**Audit items:** P2.6

**Files:**

- Modify: `client/src/widgets/public-test-workspace/ui/use-public-test-run-workspace.ts`
- Modify or add: `client/src/widgets/public-test-workspace/ui/*.test.tsx`

- [x] Add a Vitest case where the server returns a canonical saved answer different from the local draft.

- [x] Clear saved draft entries or replace them with canonical response values after successful save.

- [x] Rebuild frontend container before verification:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  ```

- [x] Verify:

  ```powershell
  npm run test:run --prefix client
  npm run build --prefix client
  ```

## Phase 3 - Durable Async Analysis And Analytics Integrity

### Task 3.1 - Recover stale pending LLM analysis

**Audit items:** P2.4

**Files:**

- Modify: `server/src/tests/tests-analysis.service.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Add or modify: `server/src/tests/tests-analysis.service.spec.ts`

- [x] Add a service method that finds stale `PENDING` LLM analyses and re-enqueues them.

- [x] Invoke recovery on startup or expose an explicit admin-safe maintenance path. Prefer a small service hook over a new queue system unless product load requires a queue.

- [x] Preserve cap/retry rules from `AI_GUIDE.md` for OpenRouter timeouts.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests-analysis.service.spec.ts
  npm run test:e2e --prefix server
  ```

### Task 3.2 - Validate effective public-link date windows

**Audit items:** P3.1

**Files:**

- Modify: `server/src/tests/dto/tests-links.dto.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`

- [x] Add tests for updating only `startsAt` and only `endsAt` where the stored effective interval would become invalid.

- [x] In `updatePublicLink()`, load existing dates and validate `effectiveStartsAt < effectiveEndsAt` before writing.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests-public-link.service.spec.ts
  ```

### Task 3.3 - Add indexes for attempts and stats queries

**Audit items:** P3.2

**Files:**

- Modify: `server/prisma/schema.prisma`
- Add migration: `server/prisma/migrations/<timestamp>_add_attempt_public_link_started_at_index/migration.sql`
- Modify: `server/src/tests/tests-prisma-schema.spec.ts`

- [x] Add `@@index([publicLinkId, startedAt])` to `TestStudentAttempt`.

- [x] Generate/apply migration in the normal Prisma workflow:

  ```powershell
  npm run prisma:generate
  npm run prisma:push
  ```

- [x] Add schema test coverage for the new index.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- tests-prisma-schema.spec.ts
  npm run verify:template
  ```

## Phase 4 - Auth, Runtime API, Secrets, And Admin Authorization

### Task 4.1 - Validate runtime API discovery before configuring Axios

**Audit items:** P1.3, P2.19

**Files:**

- Modify: `client/src/shared/api/runtime-api-base-url.ts`
- Modify: `client/src/shared/api/runtime-api-base-url.test.ts`
- Modify if needed: `scripts/smoke-server.mjs`

- [x] Replace the current "accept any HTTP(S) origin" behavior with probing required routes before `configureApiBaseUrl(...)`.

- [x] Required probes should include enough API surface to reject unrelated local Swagger/services, for example `/api-json` plus known auth/public route paths.

- [x] Verify:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  npm run test:run --prefix client
  npm run verify:runtime-config
  ```

### Task 4.2 - Fix refresh redirect latch and token rotation

**Audit items:** P2.3, P2.5

**Files:**

- Modify: `client/src/shared/api/interceptors.ts`
- Modify or add: `client/src/shared/api/interceptors.test.ts`
- Modify: `server/src/auth/auth.service.ts`
- Modify: `server/src/auth/auth.service.spec.ts`
- Consider migration: `server/prisma/schema.prisma`

- [x] Add client test for two separate refresh-failure cycles. Expected: each cycle clears storage and calls logout/redirect hook.

- [x] Reset or remove `isAuthRefreshRedirecting` after navigation/auth state is handled.

- [x] Add server test for parallel refresh attempts with the same old refresh token.

- [x] Implement atomic single-use refresh behavior. Prefer a refresh-token table with `jti`/revocation for a durable fix; use optimistic concurrency only if schema churn must stay minimal.

- [x] Verify:

  ```powershell
  npm run test --prefix server -- auth.service.spec.ts
  docker compose up -d --build --force-recreate frontend
  npm run test:run --prefix client
  npm run gen:api
  ```

### Task 4.3 - Decide refresh-token storage model

**Audit items:** P1.9

**Files:**

- Modify: `server/src/auth/auth.controller.ts`
- Modify: `server/src/auth/auth.service.ts`
- Modify: `client/src/entities/session/model/store.ts`
- Modify: `client/src/shared/api/interceptors.ts`
- Modify: `client/src/features/auth/ui/login-form.tsx`
- Modify: `client/src/features/auth/ui/protected-route.tsx`

- [ ] Move refresh tokens out of JS-readable storage. Preferred target: `HttpOnly`, `Secure`, `SameSite` cookie.

- [ ] Keep access tokens short-lived. Do not store refresh tokens via `safeStorage`.

- [ ] Update login, refresh, and logout flows as one coherent change.

- [ ] Verify:

  ```powershell
  npm run test --prefix server
  docker compose up -d --build --force-recreate frontend
  npm run test:run --prefix client
  npm run verify:e2e:critical
  ```

### Task 4.4 - Harden CORS and local/deploy secrets

**Audit items:** P1.10, P2.9, P2.11, P3.10

**Files:**

- Modify: `server/src/setup-app.ts`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.deploy.yml`
- Modify: `.env.deploy.example`
- Modify: `server/.env.example`
- Modify: `AI_GUIDE.md`
- Modify: `docs/server-admin-deploy.md`
- Modify: `docs/deployment-dockerhub.md`
- Modify or add: `scripts/verify-runtime-config.mjs`

- [ ] Restrict CORS origins by environment. Local defaults may allow `http://localhost:5173`; non-local environments must require explicit origins.

- [ ] Fail fast in non-local `NODE_ENV` if JWT secrets or database credentials match dev placeholders.

- [ ] Synchronize all OpenRouter/prof-orientation env vars across examples, compose files, and docs.

- [ ] Add static verification for the env contract.

- [ ] Verify:

  ```powershell
  npm run verify:runtime-config
  npm run verify:template
  ```

### Task 4.5 - Centralize admin authorization

**Audit items:** P2.12, P3.15

**Files:**

- Create: `server/src/authz/admin-access.service.ts` or `server/src/common/authz/admin-access.utils.ts`
- Modify: `server/src/admin/admin-access.utils.ts`
- Modify: `server/src/tests/tests-admin-access.utils.ts`
- Modify: `server/src/openrouter/openrouter-api-key.service.ts`
- Modify: `server/src/app-settings/profession-atlas-settings.service.ts`
- Modify: `server/src/admin/analysis-prompts.service.ts`
- Modify related specs that mock old utilities

- [ ] Extract one shared admin access boundary.

- [ ] Replace cross-module imports from `../admin/admin-access.utils`.

- [ ] Verify:

  ```powershell
  npm run test --prefix server
  npm run lint --prefix server
  ```

### Task 4.6 - Normalize identities and narrow JSON boundaries

**Audit items:** P2.10, P2.15, P3.3, P3.4, P3.11

**Files:**

- Modify: `server/src/auth/dto/auth.dto.ts`
- Modify: `server/src/auth/auth.service.ts`
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/tests/tests-education-organization.service.ts`
- Modify: `server/src/tests/dto/tests.dto.ts`
- Modify: `server/src/tests/dto/tests-public.dto.ts`
- Modify: `server/src/tests/dto/tests-analysis.dto.ts`
- Modify: `server/src/common/filters/all-exceptions.filter.ts`
- Modify: `client/src/features/tests/lib/tests-utils.ts`

- [ ] Normalize emails to lowercase on signup/signin and enforce DB-level protection with `citext` or a lower-case unique index.

- [ ] Normalize education organization names or enforce case-insensitive uniqueness at the DB level.

- [ ] Prefer environment-only OpenRouter secrets or encrypt saved app setting values with a server-held key. Do not return raw secret values to clients.

- [ ] Add contract tests for unified error shape:

  ```json
  { "success": false, "error": { "code": "SOME_CODE", "message": "Human message" } }
  ```

- [ ] Verify:

  ```powershell
  npm run prisma:generate
  npm run prisma:push
  npm run gen:api
  npm run test --prefix server
  docker compose up -d --build --force-recreate frontend
  npm run test:run --prefix client
  ```

## Phase 5 - Verification, CI, Architecture, And Build Determinism

### Task 5.1 - Add migration drift verification

**Audit items:** P1.4

**Files:**

- Create or modify: `scripts/verify-prisma-migrations.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml` when CI is added

- [ ] Add a clean workflow that compares committed migrations to `server/prisma/schema.prisma`.

- [ ] Use this check before future Prisma schema changes are accepted.

- [ ] Verify:

  ```powershell
  npm run verify:prisma-migrations
  ```

### Task 5.2 - Expand manifest/OpenAPI ownership and strict FSD verification

**Audit items:** P1.6, P2.17, P2.18

**Files:**

- Modify: `template/features.manifest.json`
- Modify: `scripts/verify-architecture.mjs`
- Modify or move: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx`
- Modify generated API only through `npm run gen:api`

- [ ] Add inventory coverage for admin users, prompts, settings, analytics summary/export, and other admin paths listed in the audit.

- [ ] Make `verify-architecture` enforce `template/fsd.rules.json` exactly: widgets must not import other widget slices unless explicitly allowed.

- [ ] Move shared UI/details used by multiple widgets down to `features`, `entities`, or `shared` according to existing FSD rules.

- [ ] Verify:

  ```powershell
  npm run gen:api
  npm run verify:architecture
  npm run lint --prefix client
  ```

### Task 5.3 - Make verification gates authoritative

**Audit items:** P1.7, P1.8, P2.20, P2.25, P2.27

**Files:**

- Modify: `package.json`
- Modify: `scripts/verify-package-scripts.mjs`
- Add: `.github/workflows/ci.yml`
- Modify: `README.md`

- [ ] Switch deterministic setup guidance from `npm install` to `npm ci` for root/client/server.

- [ ] Add client Vitest, `format:check`, `audit:all`, and `verify:e2e:critical` to the release gate.

- [ ] Keep a fast local gate that remains practical for daily work, but make release CI stricter.

- [ ] Add GitHub Actions CI on clean checkout:

  ```powershell
  npm ci
  npm ci --prefix client
  npm ci --prefix server
  npm run gen:api
  npm run verify:template
  npm run test:run --prefix client
  npm run format:check
  npm run audit:all
  npm run verify:e2e:critical
  ```

- [ ] Verify locally before pushing:

  ```powershell
  npm run verify:package-scripts
  npm run verify:template
  npm run test:run --prefix client
  npm run format:check
  npm run audit:all
  ```

### Task 5.4 - Make smoke/e2e runners isolated and cross-platform

**Audit items:** P2.19, P2.26, P3.8, P3.9

**Files:**

- Modify: `scripts/smoke-server.mjs`
- Modify: `scripts/e2e-critical-flows.mjs`
- Modify: `server/package.json`
- Create: `server/scripts/copy-schematics-assets.mjs`
- Modify: `client/vite.config.ts`
- Modify: `scripts/verify-runtime-config.mjs`

- [ ] Make release smoke start an isolated server or require a build/version marker before accepting an existing process.

- [ ] Replace Windows-specific npm resolution with a cross-platform runner helper.

- [ ] Replace `powershell -Command` in `build:schematics` with a Node script.

- [ ] Remove legacy `VITE_PUBLIC_API_BASE_URL` fallback or add an explicit deprecation warning and verification.

- [ ] Verify:

  ```powershell
  npm run verify:smoke:server
  npm run verify:e2e:critical
  npm run build:schematics --prefix server
  npm run verify:runtime-config
  ```

## Phase 6 - Hygiene, Formatting, Assets, And Maintainability

### Task 6.1 - Fix ignore rules, formatting, and tracked artifacts

**Audit items:** P2.20, P2.21, P3.13

**Files:**

- Modify: `.gitignore`
- Modify: `.prettierignore`
- Remove from tracking: `server/tsconfig.build.tsbuildinfo`
- Modify: `server/tsconfig.json`
- Format intended tracked files only

- [ ] Ignore local tool state: `.omx/`, `.playwright-cli/`, `.playwright-mcp/`.

- [ ] Ignore or move `client/public/prototypes/` according to the asset decision in Task 6.2.

- [ ] Move `tsBuildInfoFile` under ignored `dist` or another ignored path, then remove tracked `server/tsconfig.build.tsbuildinfo`.

- [ ] Run formatting after ignore rules are fixed:

  ```powershell
  npm run format:check
  npm run format
  npm run format:check
  ```

### Task 6.2 - Move prototype assets out of public runtime

**Audit items:** P2.22, P3.12

**Files:**

- Move or ignore: `client/public/prototypes/`
- Modify if references exist: `client/src/**`
- Modify docs if needed: `README.md`, `AI_GUIDE.md`

- [ ] Search for references:

  ```powershell
  rg "prototypes|client/public/prototypes|\\.gif|polus" client/src docs README.md AI_GUIDE.md
  ```

- [ ] Move prototype-only assets outside `client/public` or add them to ignore rules if they are local design scratch files.

- [ ] Optimize or replace large public assets that are actually used by the Polus runtime.

- [ ] Verify:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  npm run build --prefix client
  npm run test:run --prefix client
  ```

### Task 6.3 - Extend maintainability checks and fix slow regex warning

**Audit items:** P2.23, P2.24, P3.16

**Files:**

- Modify: `scripts/verify-maintainability.mjs`
- Modify: `client/src/widgets/public-test-workspace/ui/polus/polus-prof-orientation-llm-data.ts`
- Modify or add: `client/src/widgets/public-test-workspace/ui/polus/*.test.ts`
- Consider splitting: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`

- [ ] Replace the slow regex in `polus-prof-orientation-llm-data.ts` with a bounded parser or safer expression.

- [ ] Add a regression test with long LLM-controlled text.

- [ ] Decide whether lint warnings fail release CI. If yes, update scripts and fix oversized frontend files in separate small tasks.

- [ ] Verify:

  ```powershell
  docker compose up -d --build --force-recreate frontend
  npm run lint --prefix client
  npm run test:run --prefix client
  npm run verify:maintainability
  ```

### Task 6.4 - Synchronize README and operational docs

**Audit items:** P3.6, P3.10, P3.14

**Files:**

- Modify: `README.md`
- Modify: `docs/server-admin-deploy.md`
- Modify: `docs/deployment-dockerhub.md`
- Modify: `AI_GUIDE.md` only when it remains the source of truth

- [ ] Align README with the actual Polus hybrid initials requirement.

- [ ] Update quality gate docs to include client Vitest, format check, audit, and critical e2e.

- [ ] Keep deploy env docs synchronized with Task 4.4.

- [ ] Verify:

  ```powershell
  npm run verify:ai-guide
  npm run format:check
  ```

## Suggested Branch/PR Breakdown

1. `codex/debt-public-data-lifecycle`
   - Tasks 1.1, 1.2.
   - Goal: no data loss, no broken public links.

2. `codex/debt-public-answer-validation`
   - Tasks 1.3, 2.1, 2.2, 2.3, 2.4.
   - Goal: public sessions cannot complete with invalid data and public DTOs are safe.

3. `codex/debt-async-analytics`
   - Tasks 3.1, 3.2, 3.3.
   - Goal: pending analysis recovery and analytics data/index correctness.

4. `codex/debt-auth-runtime-security`
   - Tasks 4.1, 4.2, 4.3, 4.4.
   - Goal: safe API discovery, refresh flow, CORS, secrets, env contract.

5. `codex/debt-authz-contracts`
   - Tasks 4.5, 4.6.
   - Goal: shared admin authz, identity normalization, consistent errors, narrower JSON.

6. `codex/debt-ci-architecture`
   - Tasks 5.1, 5.2, 5.3, 5.4.
   - Goal: CI and verification gates match the real project contract.

7. `codex/debt-hygiene-docs`
   - Tasks 6.1, 6.2, 6.3, 6.4.
   - Goal: format, artifacts, assets, maintainability, and docs are clean.

## Final Release Gate

Run this after the last remediation branch is integrated:

```powershell
docker compose up -d --build --force-recreate frontend
npm run prisma:generate
npm run prisma:push
npm run gen:api
npm run verify:template
npm run test:run --prefix client
npm run format:check
npm run audit:all
npm run verify:e2e:critical
```

Expected final state:

- Public links keep working across republish unless explicitly archived.
- Topic deletion cannot erase historical student data by accident.
- Public sessions reject missing or invalid required answers.
- DEMOGRAPHIC attempt policy is honest and enforceable.
- Auth refresh and runtime API discovery are deterministic and safer.
- OpenRouter/env/deploy docs match runtime behavior.
- CI blocks stale generated contracts, architecture drift, format drift, audit regressions, and critical flow failures.
- Prototype/local artifacts do not leak into public runtime or formatting noise.
