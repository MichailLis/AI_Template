# Technical Debt Audit - 2026-05-21

Scope: consolidated read-only audit of the project after recent feature work.

This document merges all issues found across the manual review and delegated agent audits. It is intended to be used as a remediation backlog, not as an implementation plan. No source files were changed during the audit.

## Verification Snapshot

Last observed checks:

- `npm run verify:local` passed, but with lint warnings.
- `npm run test:run --prefix client` passed: 22 test files, 61 tests.
- `npm run audit:prod` passed with 0 vulnerabilities.
- `npm run audit:all` passed with 0 vulnerabilities.
- `npm run gen:openapi` passed.
- `npm run verify:architecture` passed.
- `npm run format:check` failed with roughly 35 formatting warnings.

Important interpretation: the main local gate can be green while real product, data, security, documentation, and architecture issues remain.

## Executive Summary

Highest-risk themes:

1. Public test lifecycle has data-loss and link-breakage risks.
2. Public session completion is not enforced server-side against required/type-valid answers.
3. Verification gates are incomplete and can pass stale or under-validated states.
4. Architecture rules and manifest/OpenAPI inventory do not fully match the project contract.
5. Auth/session and OpenRouter handling have several security and durability weaknesses.
6. Docs and operational examples have drifted from actual behavior.

Recommended remediation order:

1. Protect public-link/version lifecycle and historical student data.
2. Add durable backend validation for public answers and completion.
3. Fix runtime API discovery, auth refresh recovery, and refresh-token rotation.
4. Make CI/verification authoritative: client tests, format, audit, e2e, architecture/OpenAPI checks.
5. Clean up tracked/generated artifacts, ignore rules, docs drift, and portability issues.

## P1 - Critical / High-Risk

### P1.1 - Republishing A Test Can Break Existing Public Links

Evidence:

- `server/src/tests/tests.service.ts:542` archives the previous published version.
- `server/src/tests/tests.service.ts:575` points the topic at the new published version.
- `server/prisma/schema.prisma:207` stores public links against a fixed `topicVersionId`.
- `server/src/tests/tests-public-link.service.ts:344` rejects public links whose version is not `PUBLISHED`.

Impact:

An active `/t/:code` link can remain unarchived and visible to admins, but stop working after a normal publish flow.

Fix direction:

Define the product rule explicitly: either public links remain bound to immutable published snapshots, or publish migrates/repoints links. Add an e2e test: create link to v1, publish v2, then assert the link still behaves according to the chosen rule.

### P1.2 - Hard Topic Delete Cascades Through Student History

Evidence:

- `server/src/tests/tests.controller.ts:108` exposes topic delete.
- `server/src/tests/tests.service.ts:396` hard-deletes `testTopic`.
- Cascades continue through `server/prisma/schema.prisma:139`, `:225`, `:282`, `:304`, `:325`.

Impact:

One admin delete can erase published versions, public links, attempts, answers, analyses, consent snapshots, and analytics history.

Fix direction:

Block hard delete once a topic has published versions, public links, or attempts. Prefer archive/restore semantics for production data. Add a test that deleting a topic with completed attempts is refused.

### P1.3 - Runtime API Discovery Can Bind To An Arbitrary HTTP(S) Origin

Evidence:

- `client/src/shared/api/runtime-api-base-url.ts:32` accepts any discovered HTTP(S) `baseUrl`.
- `client/src/shared/api/runtime-api-base-url.ts:54` configures the shared API client with it.
- `client/src/shared/api/runtime-api-base-url.test.ts:34` explicitly locks this behavior in.
- `AI_GUIDE.md:398` requires validation of mandatory API routes before accepting a discovered origin.

Impact:

The frontend can bind to an unrelated local service and send auth/refresh traffic to the wrong origin.

Fix direction:

Probe mandatory routes before `configureApiBaseUrl(...)`. Replace the current "accept any HTTP(S)" test with one that rejects origins missing the expected API surface.

### P1.4 - Database Migration Drift

Evidence:

- Previously observed drift between Prisma schema/current runtime expectations and committed migration state.
- Relevant files: `server/prisma/schema.prisma`, `server/prisma/migrations/*`.

Impact:

Fresh environments can diverge from local development DB state. Data model assumptions may work locally but fail after deploy or reset.

Fix direction:

Run a migration diff from committed migrations to `schema.prisma` in a clean DB workflow, then either add missing migrations or explicitly reset the migration baseline. Add this check to CI.

### P1.5 - Template Baseline Has Drifted Far From Auth-Only Source Of Truth

Evidence:

- `AI_GUIDE.md` says the final template baseline is auth-only.
- The current branch includes tests, public links, prompt studio, analytics, Polus public template, OpenRouter settings, and deployment docs.

Impact:

Agents and maintainers receive contradictory signals: the repo calls itself a minimal auth template while production-like business modules are now first-class.

Fix direction:

Choose the actual baseline. Either update `AI_GUIDE.md` to describe the current product template, or isolate business modules into a feature branch and restore auth-only.

### P1.6 - Architecture / Manifest Verification Gives False Confidence

Evidence:

- `npm run verify:architecture` passes.
- Many admin OpenAPI paths are not represented by feature manifest checks, including `/admin/users`, `/admin/prompts/*`, `/admin/settings/*`, and `/admin/tests/topics/{topicId}/analytics/*`.
- Relevant file: `template/features.manifest.json`.

Impact:

Routes can be added or changed without manifest ownership, generated-client expectations, or route inventory checks catching drift.

Fix direction:

Add explicit manifest coverage for admin modules and analytics/settings routes, or introduce a separate admin API inventory checked against generated OpenAPI.

### P1.7 - No Repository CI Gate

Evidence:

- No root `.github` workflow directory was found.
- All main verification currently depends on local/manual execution.

Impact:

Regressions in architecture, lint, tests, format, audit, build, and generated contracts can land without automated enforcement.

Fix direction:

Add CI that runs the agreed release gate on clean checkout: install with `npm ci`, generate/check OpenAPI/API client as needed, run lint/tests/build/format/audit/e2e.

### P1.8 - Verification Scripts Omit Important Checks

Evidence:

- `package.json` `verify:local` / `verify:template` omit client Vitest tests, `format:check`, dependency audits, and `verify:e2e:critical`.
- `scripts/verify-package-scripts.mjs` still treats audit enforcement as something to avoid, despite audits now passing.

Impact:

The default "green" state does not mean the frontend tests, formatting, audit state, or critical browser flows are healthy.

Fix direction:

Define fast and release gates explicitly. At minimum, release-level CI should include client tests, format check, audit, server unit/e2e, client/server builds, architecture, and critical e2e.

### P1.9 - Auth Tokens Are Stored In JavaScript-Readable Storage

Evidence:

- `client/src/entities/session/model/store.ts` writes `accessToken` and `refreshToken` via `safeStorage`.
- `client/src/shared/api/interceptors.ts` reads both tokens from storage and sends refresh via bearer header.

Impact:

Any XSS or browser extension compromise can read the refresh token and keep a session alive.

Fix direction:

Move refresh tokens to `HttpOnly`, `Secure`, `SameSite` cookies or another server-managed session mechanism. Keep access token lifetime short and avoid storing refresh tokens in JS-readable storage.

### P1.10 - Root Docker Compose Provides Default Database And JWT Secrets

Evidence:

- `docker-compose.yml:36` defaults `DATABASE_URL` to `postgresql://user:password@postgres:5432/my_app_db?schema=public`.
- `docker-compose.yml:37` defaults `JWT_ACCESS_SECRET` to `dev-access-secret-change-me`.
- `docker-compose.yml:38` defaults `JWT_REFRESH_SECRET` to `dev-refresh-secret-change-me`.

Impact:

The normal project runtime can start with predictable credentials and JWT secrets. That is useful for local onboarding, but risky if the root compose file is reused for shared, staging, production-like, or copied deployment automation.

Fix direction:

Keep dev defaults explicitly local-only, require strong secrets for non-local `NODE_ENV`, and make deploy/runtime checks fail fast on `dev-*` JWT secrets or default database credentials.

## P2 - Significant Risk / Should Fix Soon

### P2.1 - Public Sessions Can Complete Without Required Or Type-Valid Answers

Evidence:

- `server/src/tests/dto/tests-public.dto.ts:121` uses `z.unknown()` for `answerPayload`.
- `server/src/tests/tests-public-session.service.ts:329` checks only that the question belongs to the session.
- `server/src/tests/tests-public-session.service.ts:405` marks the attempt `COMPLETED`.
- `server/src/tests/tests-public-session.service.ts:410` only counts answers.

Impact:

Clients can submit empty, partial, invalid-option, invalid-slider, or over-limit multi-choice payloads and still generate completed analytics/results.

Fix direction:

Validate save and finish against question type/settings/options: required answers, option membership, slider range/step, `maxChoices`, and payload shape. Add e2e tests for missing required answer and invalid payloads.

### P2.2 - DEMOGRAPHIC Links Force One Attempt But Cannot Enforce It

Evidence:

- `server/src/tests/tests-public-link.service.ts:31` forces DEMOGRAPHIC `maxAttemptsPerStudent` to `1`.
- `server/src/tests/tests-public-session.service.ts:137` routes DEMOGRAPHIC starts to a separate path.
- `server/src/tests/tests-public-session.service.ts:277` creates a random token.
- `server/src/tests/tests-public-session.service.ts:298` hashes that random token as the student key.

Impact:

The same respondent can create unlimited attempts for a link that the admin UI describes as one-attempt.

Fix direction:

Either define demographic links as anonymous/unlimited in copy and analytics, or derive a stable privacy-preserving key from demographic fields and enforce the limit.

### P2.3 - Refresh-Token Rotation Is Not Atomic

Evidence:

- `server/src/auth/auth.service.ts:79` reads the user.
- `server/src/auth/auth.service.ts:85` verifies the old refresh hash.
- `server/src/auth/auth.service.ts:89` writes a new hash.

Impact:

Concurrent refresh requests can both verify the same old token. Rotation becomes nondeterministic and not truly single-use.

Fix direction:

Use a refresh-token table with `jti` and revocation, or optimistic concurrency/versioned update. Add a parallel refresh test.

### P2.4 - LLM Analysis Jobs Can Remain Permanently Pending

Evidence:

- `server/src/tests/tests-public-session.service.ts:424` creates pending LLM analysis.
- `server/src/tests/tests-public-session.service.ts:442` enqueues only after the transaction.
- `server/src/tests/tests-analysis.service.ts:348` uses in-memory fire-and-forget and swallows enqueue errors.

Impact:

A crash or deploy between commit and enqueue can leave `PENDING` analysis rows forever.

Fix direction:

Persist jobs or add a startup/cron sweeper for stale `PENDING` rows. Do not rely only on in-process fire-and-forget.

### P2.5 - Auth Refresh Redirect Latch Never Resets

Evidence:

- `client/src/shared/api/interceptors.ts:18` defines `isAuthRefreshRedirecting`.
- `client/src/shared/api/interceptors.ts:85` exits early on later failures.
- `client/src/shared/api/interceptors.ts:89` sets the latch to `true`.

Impact:

After one refresh failure in a SPA lifetime, later refresh failures may not clear storage, call logout hooks, or redirect to `/login`.

Fix direction:

Reset the latch after auth is re-established or remove the global latch. Add a test covering two separate refresh-failure cycles.

### P2.6 - Public Test Run Keeps A Permanent Local Answer Overlay

Evidence:

- `client/src/widgets/public-test-workspace/ui/use-public-test-run-workspace.ts:28` keeps `answerDraft`.
- `client/src/widgets/public-test-workspace/ui/use-public-test-run-workspace.ts:54` lets draft values win over server answers.
- `client/src/widgets/public-test-workspace/ui/use-public-test-run-workspace.ts:85` saves but does not clear/reconcile the draft.

Impact:

Server normalization, validation, or resumed-state updates can be invisible to the user. The UI can keep displaying and resubmitting stale local payloads while polling is active.

Fix direction:

Clear saved draft entries from mutation results, reconcile with canonical server response, or force refetch after successful save.

### P2.7 - Public Session Tokens Expose Access To Results

Evidence:

- Public routes use `/t/:code/session/:sessionToken` and `/t/:code/result/:sessionToken`.
- Backend reads sessions by `resumeToken`.

Impact:

Anyone with the tokenized URL can access the session/result. This may be acceptable for anonymous flows but should be explicitly documented and controlled.

Fix direction:

Document the security model, shorten token lifetime if needed, avoid leaking URLs in logs/referrers, and consider separate result tokens or one-time handoff.

### P2.8 - Public Result Can Expose Raw Analysis Internals

Evidence:

- Analysis responses include raw/result fields.
- Prior audit observed raw analysis/methodology internals exposed to public UI paths.

Impact:

Students may see implementation details, method internals, or raw LLM output that should remain admin/debug-only.

Fix direction:

Separate public analysis DTO from admin/internal analysis DTO. Keep only student-safe fields in public result responses.

### P2.9 - CORS Configuration Is Too Open

Evidence:

- Prior audit observed permissive CORS/runtime behavior.
- Relevant file: `server/src/main.ts`.

Impact:

Open CORS combined with bearer tokens and public endpoints broadens cross-origin abuse potential.

Fix direction:

Restrict origins per environment. Add deploy env documentation and tests/verification for CORS defaults.

### P2.10 - OpenRouter API Key Stored As Plain App Setting

Evidence:

- OpenRouter key can be saved through admin settings.
- Relevant files: `server/src/openrouter/openrouter-api-key.service.ts`, `server/src/admin/admin-settings.controller.ts`, `server/prisma/schema.prisma` `AppSetting`.

Impact:

Secrets are persisted as plaintext application data, increasing blast radius of DB access or dumps.

Fix direction:

Prefer environment-only secrets or encrypt at rest with a server-held key. Avoid returning secret values to clients.

### P2.11 - OpenRouter Env Contract Drift

Evidence:

- `AI_GUIDE.md:210-217` lists `OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS` and `OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES`.
- `server/.env.example` includes them.
- `.env.deploy.example` and `docker-compose.deploy.yml` are missing some prof-orientation OpenRouter vars.
- Root `docker-compose.yml` exposes only the base OpenRouter key.

Impact:

Local and deploy environments behave differently. Prof-orientation LLM timeout/retry behavior can be missing after deployment.

Fix direction:

Synchronize `.env.example`, `server/.env.example`, `.env.deploy.example`, root/deploy compose, and docs. Add runtime config verification for the full OpenRouter contract.

### P2.12 - OpenRouter / App Settings Depend On Admin Utilities Across Boundaries

Evidence:

- `server/src/openrouter/openrouter-api-key.service.ts` imports `../admin/admin-access.utils`.
- `server/src/app-settings/profession-atlas-settings.service.ts` imports `../admin/admin-access.utils`.

Impact:

Backend modules are coupled to the admin module utility instead of a shared authorization boundary.

Fix direction:

Move admin access checks to a shared/authz module or service and use that from admin, app-settings, tests, and OpenRouter.

### P2.13 - Public Session Start Has Race Conditions Around Attempts

Evidence:

- Public session creation reads previous attempts, computes next attempt number, then creates the attempt.
- Unique constraint exists on `[publicLinkId, studentKeyHash, attemptNumber]`.

Impact:

Concurrent starts can race into duplicate attempt numbers or inconsistent resume behavior.

Fix direction:

Use a transaction with retry on unique violation or a stronger per-student attempt allocation strategy.

### P2.14 - Archived Prompts Can Still Affect Runtime Analysis

Evidence:

- Topic versions can keep `analysisPromptVersionId`.
- Prompt/archive lifecycle does not clearly sever all runtime references.

Impact:

Archived prompt content can remain active through published test versions or existing analysis flows, confusing admin expectations.

Fix direction:

Define archive semantics: archive only hides prompt editing/library entries, or archive disables future runtime use. Enforce and test that rule.

### P2.15 - JSON Boundaries Are Too Broad

Evidence:

- Multiple DTOs accept `z.unknown()` / broad JSON for answers, settings, summaries, and schemas.
- Examples: `server/src/tests/dto/tests-public.dto.ts`, `server/src/tests/dto/tests.dto.ts`, `server/src/tests/dto/tests-analysis.dto.ts`.

Impact:

Invalid shapes can persist and later break scoring, rendering, or analysis.

Fix direction:

Use type-specific Zod schemas at write boundaries and narrow public response DTOs.

### P2.16 - Scoring Config Is Not Fully Enforced

Evidence:

- `TestTopicVersion.scoringConfig` exists and is cloned/published, but prior audit found behavior paths where runtime scoring did not fully honor it.
- Relevant files: `server/src/tests/tests-analysis.service.ts`, `server/src/tests/prof-orientation-v3-plus.scoring.ts`, `server/src/tests/tests-domain.utils.ts`.

Impact:

Admin-configured scoring can be stored but not applied consistently.

Fix direction:

Add scoring-config contract tests: create a topic/version with known config and assert deterministic scoring uses exactly that config.

### P2.17 - FSD Verifier Allows Same-Layer Imports Despite Rules

Evidence:

- `template/fsd.rules.json:8` says `widgets` may import only `features`, `entities`, and `shared`.
- `scripts/verify-architecture.mjs:401` effectively allows same-layer imports.
- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-attempt-detail-dialog.tsx:10` imports from another widget slice.

Impact:

The enforced architecture is weaker than the documented architecture, and widget-to-widget dependencies can accumulate.

Fix direction:

Make verifier match `template/fsd.rules.json` and move shared display pieces down to `features`, `entities`, or `shared`.

### P2.18 - OpenAPI / Manifest Inventory Misses Admin Routes

Evidence:

Fresh OpenAPI generation showed admin paths not declared in manifest verification, including:

- `/admin`
- `/admin/users`
- `/admin/users/{id}/role`
- `/admin/prompts`
- `/admin/prompts/{promptId}`
- `/admin/prompts/models`
- `/admin/prompts/generate`
- `/admin/prompts/simulate`
- `/admin/prompts/test-questions`
- `/admin/prompts/versions/{versionId}/publish`
- `/admin/settings/openrouter`
- `/admin/settings/openrouter/api-key`
- `/admin/settings/profession-atlas`
- `/admin/tests/topics/{topicId}/analytics/summary`
- `/admin/tests/topics/{topicId}/analytics/export.xlsx`
- `/admin/tests/topics/{topicId}/analytics/export.pdf`

Impact:

Admin API changes can drift from manifest and generated-client expectations.

Fix direction:

Add manifest ownership for admin features or a separate route inventory check derived from OpenAPI.

### P2.19 - `verify:smoke:server` Can Validate A Foreign/Stale Backend

Evidence:

- `scripts/smoke-server.mjs:101-107` first checks any existing `/api-json` on the target port.
- `scripts/smoke-server.mjs:14-17` validates a narrow route set.

Impact:

Smoke verification can pass against an older or unrelated process already running locally.

Fix direction:

Always start an isolated server for release smoke checks, or require a build/version marker and a comprehensive route contract.

### P2.20 - `format:check` Fails And Is Not Part Of The Main Gate

Evidence:

- `npm run format:check` failed with roughly 35 files.
- Warnings included local tool state, prototypes, docs, and real project files.
- `.prettierignore` and `.gitignore` do not fully cover `.omx`, `.playwright-cli`, `.playwright-mcp`, and untracked prototype assets.

Impact:

Formatting is both noisy and unenforced. Developers can get different results depending on local exclude state.

Fix direction:

Fix ignore rules, format intended tracked files, and add `format:check` to release CI.

### P2.21 - Tracked TypeScript Build Artifact

Evidence:

- `server/tsconfig.build.tsbuildinfo` is tracked.
- `server/tsconfig.json` enables `incremental`.

Impact:

Builds can create noisy diffs and environment-specific churn.

Fix direction:

Remove the tracked artifact and ignore/move `tsBuildInfoFile` under `dist` or another ignored path.

### P2.22 - Public Prototypes And Large Assets Are In Risky Locations

Evidence:

- `client/public/prototypes/` exists and is untracked/not ignored.
- Prior audit found a roughly 26.7 MB Polus GIF in build output.

Impact:

Prototype assets can accidentally ship. Large media inflates frontend builds and public page loading costs.

Fix direction:

Move prototypes outside `client/public`, ignore source prototypes, and optimize/replace large media.

### P2.23 - Maintainability Verification Is Narrower Than Actual Risk

Evidence:

- `scripts/verify-maintainability.mjs` scans only `client/src`.
- It ignores backend, CSS, docs, scripts, and generated edge cases.
- `npm run verify:local` passes while lint warns about oversized frontend files and slow regex.

Impact:

The maintainability gate can pass while real warning thresholds are already exceeded.

Fix direction:

Extend the check or decide that lint warnings are release-blocking. Include backend and CSS thresholds where useful.

### P2.24 - Slow Regex Warning In Public Analysis Sanitizer

Evidence:

- `npm run verify:local` lint output warned about a vulnerable regex in `client/src/widgets/public-test-workspace/ui/polus/polus-prof-orientation-llm-data.ts:63`.

Impact:

Potential super-linear runtime if user/LLM-controlled text hits pathological input.

Fix direction:

Replace the regex with a safer expression or bounded parser and add a regression test with long input.

### P2.25 - Deterministic Installs Are Not Used In Root Helper Script

Evidence:

- `package.json:5` uses `npm install --prefix client && npm install --prefix server`.
- README also recommends `npm install`.

Impact:

Dependency graph and lockfile can drift between machines.

Fix direction:

Use `npm ci` for reproducible setup and CI.

### P2.26 - Windows-Only `build:schematics`

Evidence:

- `server/package.json:10` uses `powershell -Command`.

Impact:

The schematic build is not portable to Linux/macOS CI runners.

Fix direction:

Move copy logic into a small Node script or cross-platform package.

### P2.27 - Frontend Rebuild Hook Does Not Prove Production Build

Evidence:

- Project instruction requires frontend container rebuild after `client/` changes.
- Prior audit found the hook enforces rebuild before frontend verification but does not itself guarantee `npm run build --prefix client` or production bundle checks for every relevant change.

Impact:

Container freshness and production build validity can be conflated.

Fix direction:

Keep the rebuild guard, but make production build a separate explicit gate.

## P3 - Moderate / Hygiene / Documentation

### P3.1 - Partial Public-Link Date Updates Can Store Invalid Windows

Evidence:

- `server/src/tests/dto/tests-links.dto.ts:56` validates `startsAt < endsAt` only when both are present in one update payload.
- `server/src/tests/tests-public-link.service.ts:187` does not load existing dates for effective validation.
- `server/src/tests/tests-public-link.service.ts:210` writes partial date fields.

Impact:

A link can end up with `startsAt > endsAt`.

Fix direction:

Validate the effective stored interval before update.

### P3.2 - Missing Index For Attempt/Stats Queries

Evidence:

- Admin attempts filter by `publicLinkId` and order by `startedAt`.
- Analytics filters by link/date and orders by `startedAt`.
- `server/prisma/schema.prisma:287` has attempt indexes for student key/status/topic, but not `[publicLinkId, startedAt]`.

Impact:

Stats pages can degrade as attempts grow.

Fix direction:

Add `@@index([publicLinkId, startedAt])` and verify with `EXPLAIN ANALYZE`.

### P3.3 - Email Identity Is Case-Sensitive

Evidence:

- `server/src/auth/dto/auth.dto.ts` accepts email without normalization.
- `server/src/auth/auth.service.ts:23` stores raw email.
- `server/src/auth/auth.service.ts:50` performs exact lookup.

Impact:

`User@example.com` and `user@example.com` can become separate identities.

Fix direction:

Normalize emails to lowercase and add DB-level protection (`citext` or lower-case unique index).

### P3.4 - Education Organization Uniqueness Is Case-Insensitive In Code But Not In DB

Evidence:

- `server/prisma/schema.prisma:239` has plain `name String @unique`.
- `server/src/tests/tests-education-organization.service.ts:210` and `:277` check duplicates with `mode: 'insensitive'`.

Impact:

Concurrent writes/imports can create case variants the service assumes impossible.

Fix direction:

Normalize names on write or use DB-level case-insensitive uniqueness.

### P3.5 - Login Ignores Intended Route

Evidence:

- `client/src/features/auth/ui/protected-route.tsx:16` stores `from`.
- `client/src/features/auth/ui/login-form.tsx:45` always navigates to `/admin`.
- Stored `from` also drops `search` and `hash`.

Impact:

Deep links and session-expiry recovery lose the exact admin page.

Fix direction:

Carry full path/search/hash through router state and redirect there after successful login.

### P3.6 - README Conflicts With Code For Polus Hybrid Initials

Evidence:

- `README.md:222` says the Polus hybrid entry does not require initials.
- `AI_GUIDE.md:330`, frontend Polus entry, and backend public session service require surname and patronymic initials in education-style flows.

Impact:

Agents and humans will implement/test the wrong entry contract.

Fix direction:

Update README or code, then add/adjust tests to lock the chosen behavior.

### P3.7 - Agent Instruction Files Are Duplicated And Potentially Conflicting

Evidence:

- `AGENTS.md` exists and is authoritative.
- `AGENT.md` is tracked.
- `CLAUDE.md` is tracked and duplicates guardrail-style instructions.

Impact:

Different agents/tools can read different behavior instructions.

Fix direction:

Keep one source of truth, or mark legacy files as pointers to `AGENTS.md` / `AI_GUIDE.md`.

### P3.8 - Legacy `VITE_PUBLIC_API_BASE_URL` Alias Still Exists

Evidence:

- `client/vite.config.ts:14` accepts `VITE_PUBLIC_API_BASE_URL`.
- `scripts/verify-runtime-config.mjs` forbids it in compose.

Impact:

The env key is half-deprecated: forbidden in one path but silently accepted in another.

Fix direction:

Remove the alias or document a time-boxed deprecation window and add a warning.

### P3.9 - Server Smoke / E2E Windows NPM Resolution Is Fragile

Evidence:

- `scripts/smoke-server.mjs:20-24` assumes a specific npm CLI path near `process.execPath`.
- `scripts/e2e-critical-flows.mjs` has a similar Windows branch.

Impact:

Corepack or packaged Node/npm distributions may break these scripts.

Fix direction:

Use a more robust npm resolution strategy or a small cross-platform runner script.

### P3.10 - Deployment Env Examples Are Not Fully Synchronized

Evidence:

- `AI_GUIDE.md`, `server/.env.example`, `.env.deploy.example`, `docs/server-admin-deploy.md`, and `docs/deployment-dockerhub.md` do not all carry the same OpenRouter/prof-orientation vars.

Impact:

Operators can deploy with incomplete settings despite following docs.

Fix direction:

Choose a canonical env contract and generate/verify examples from it.

### P3.11 - Error Contract Drift

Evidence:

- `AI_GUIDE.md` requires unified error format:
  `{ "success": false, "error": { "code": "...", "message": "..." } }`
- Prior audit observed places where frontend/backend assumptions do not consistently enforce that contract.

Impact:

UI error handling can become fragile and route-specific.

Fix direction:

Add e2e/contract tests for common error shapes and use a shared error adapter on the client.

### P3.12 - Stale Dashboard / Template Artifacts

Evidence:

- Prior audit found stale dashboard/template assets and references not aligned with the current feature set.
- Examples include stale frontend boilerplate artifacts such as old Vite files.

Impact:

Template cleanup is incomplete and can confuse agents or ship unused assets.

Fix direction:

Remove unused boilerplate only after confirming references. Keep cleanup isolated from functional fixes.

### P3.13 - `.gitignore` / `.prettierignore` Hygiene Is Incomplete

Evidence:

- Local tool state like `.omx`, `.playwright-cli`, `.playwright-mcp` is not consistently ignored by repo files.
- `client/public/prototypes/` is untracked and not cleanly governed.

Impact:

Different developers get different status/format noise.

Fix direction:

Move local-only ignores into repo `.gitignore` where appropriate and keep Prettier from scanning tool/cache directories.

### P3.14 - `README` Quality Gates Are Stale

Evidence:

- README quality gate section omits client Vitest, format, audit, and critical e2e despite those scripts existing and being relevant.

Impact:

Humans following README can believe a branch is ready while skipped checks fail.

Fix direction:

Update README after deciding the canonical fast and release gates.

### P3.15 - Admin Access Checks Are Duplicated

Evidence:

- `server/src/admin/admin-access.utils.ts` and `server/src/tests/tests-admin-access.utils.ts` implement similar role access checks.

Impact:

Authorization behavior can diverge across modules.

Fix direction:

Extract shared admin authorization utility/service.

### P3.16 - Lint Warnings Are Not Treated As A Release Risk

Evidence:

`npm run verify:local` passed with warnings:

- Oversized file: `client/src/widgets/admin-public-links-workspace/ui/public-links-list-card.tsx`.
- Slow regex warning in Polus LLM data sanitizer.
- Oversized functions in Polus public fields/select components.

Impact:

Warnings mark the next refactor candidates but do not block the default green gate.

Fix direction:

Decide whether release CI should fail on warnings or create explicit maintainability debt issues.

## Notes On Untracked / Pre-Existing Worktree State

Observed untracked paths before this document was created:

- `01_брендинг/`
- `client/public/prototypes/`

These were not modified by the audit document work. Treat them as separate cleanup decisions.

## Suggested Remediation Backlog

### Batch 1 - Protect Data And Public Links

1. Add tests for publish preserving or intentionally migrating public links.
2. Replace hard topic delete with safe archive/refusal.
3. Add server-side answer validation before save/finish.
4. Fix DEMOGRAPHIC attempt policy.

### Batch 2 - Auth And Runtime Safety

1. Validate runtime API discovery against required API routes.
2. Fix auth refresh latch.
3. Make refresh-token rotation atomic.
4. Decide refresh-token storage model.

### Batch 3 - Durable Async And Analytics

1. Add durable LLM job recovery.
2. Add attempt/statistics indexes.
3. Fix partial public-link date validation.

### Batch 4 - Verification And Architecture

1. Add CI.
2. Expand `verify:*` gates.
3. Fix FSD same-layer enforcement.
4. Expand manifest/OpenAPI coverage.
5. Make smoke server isolated.

### Batch 5 - Hygiene And Docs

1. Fix `format:check` and ignore rules.
2. Remove tracked build artifacts.
3. Synchronize env examples and README gates.
4. Resolve `AGENT.md` / `CLAUDE.md` duplication.
5. Clean up prototype and stale template assets.
