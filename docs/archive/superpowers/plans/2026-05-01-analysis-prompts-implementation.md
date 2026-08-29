# Analysis Prompts Implementation Plan

> **For AI agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** add versioned analysis prompts for test versions, let admins create/check prompts in Prompt Studio, attach one active prompt version to one test version, generate student analysis asynchronously through backend OpenRouter integration, render the formatted analysis for students, and persist it for admin review.

**Architecture Notes:** follow `AI_GUIDE.md`, `CLAUDE.md`, and the audited design in `docs/superpowers/specs/2026-05-01-analysis-prompts-design.md`. Reuse existing admin prompt OpenRouter proxy, tests module, public session flow, `TestStudentAnalysis`, generated API hooks, FSD widgets, and existing public analysis UI draft where it fits. Automated tests must mock OpenRouter and must not call paid or live models. Prompt-testing/synthetic-answer flows must default to free OpenRouter models.

**Branch:** `codex/analysis-prompts`

## File Map

- `server/prisma/schema.prisma`: prompt/version models, relation from `TestTopicVersion`, relation from `TestStudentAnalysis`.
- `server/src/admin/openrouter.client.ts`: keep existing OpenRouter request builder; extend only if needed for structured analysis reuse.
- `server/src/admin/openrouter.utils.ts`: keep free/structured model helpers; add filtering helpers only if tests demand them.
- `server/src/admin/dto/*`: prompt lifecycle DTOs and fixed analysis JSON schema.
- `server/src/admin/*analysis-prompts*`: admin prompt CRUD, version publishing, prompt simulation, synthetic answers.
- `server/src/tests/dto/tests.dto.ts`: draft update/detail contracts for `analysisPromptVersionId` and prompt version summary.
- `server/src/tests/tests.service.ts`: attach prompt version to draft/published test versions.
- `server/src/tests/tests-analysis.service.ts`: enqueue/run async analysis, fixed JSON parsing, status mapping.
- `server/src/tests/tests-public-session.service.ts`: create pending analysis and start async work after finish.
- `client/src/widgets/admin-prompts-workspace/*`: list/save/publish prompt versions, select questions, generate AI test answers, check prompt.
- `client/src/widgets/admin-tests-workspace/*`: attach one prompt version to a test draft/version.
- `client/src/widgets/public-test-workspace/*`: formatted student analysis and processing/failed statuses.
- `client/src/widgets/admin-public-links-stats-workspace/*`: formatted admin analysis result.

## Assumptions

- A test draft can select a published analysis prompt version or clear the selection.
- Publishing a test preserves the selected prompt version on the newly published version and carries it into the next draft for convenience.
- Student attempts without a configured prompt keep the existing stub analysis behavior.
- Student attempts with a configured prompt store `PENDING`, then update to `READY` or `FAILED` asynchronously.
- MVP does not store Prompt Studio simulation history.
- MVP uses in-process async execution; a persistent queue can be introduced later if operational needs require it.

## Tasks

### 1. Backend Contracts And Schema

1. Write failing DTO tests for prompt version references in test topic detail/update contracts.
   - Verify: `npm test --prefix server -- tests.dto.spec.ts --runInBand`
2. Write failing DTO tests for admin analysis prompt contracts and fixed analysis JSON schema.
   - Verify: targeted Jest spec fails because DTO/schema files do not exist yet.
3. Add Prisma prompt/version relations and DTO schemas with minimal code.
   - Verify: targeted DTO specs pass.
4. Run Prisma client generation.
   - Verify: `npm run prisma:generate --prefix server`

### 2. Admin Prompt Lifecycle

1. Write failing service/controller tests for creating prompts, publishing a new version, listing prompts/versions, and rejecting invalid prompt access.
   - Verify: targeted Jest spec fails for missing service endpoints.
2. Implement the lifecycle in the existing admin module using the existing admin access pattern.
   - Verify: targeted service/controller specs pass.
3. Keep routes under `/admin/prompts` so the existing Prompt Studio surface grows instead of creating a competing admin area.
   - Verify: route tests assert the expected paths.

### 3. Prompt Simulation

1. Write failing tests for question snapshot selection by question IDs, synthetic AI answers, and prompt simulation using free structured models.
   - Verify: targeted Jest spec fails for missing simulation behavior.
2. Implement simulation by reusing the existing backend OpenRouter helper and fixed JSON schema.
   - Verify: targeted simulation specs pass with mocked OpenRouter.
3. Ensure tests never call live OpenRouter.
   - Verify: specs assert mocked client calls only.

### 4. Attach Prompt To Test Version

1. Write failing tests for `updateTopicDraft` accepting `analysisPromptVersionId`, validating it, returning prompt summary, and preserving it on publish.
   - Verify: targeted `tests.service` spec fails.
2. Implement attachment in `TestsService` and DTO mapping.
   - Verify: targeted specs pass.
3. Regenerate API contracts if backend contract generation is available.
   - Verify: project API generation command succeeds or document the blocker.

### 5. Async Student Analysis

1. Write failing tests for finishing a public session with a configured prompt: creates `PENDING`, calls async analysis trigger after transaction, and maps status for student polling.
   - Verify: targeted public session/analysis specs fail.
2. Implement `enqueueAttemptAnalysis` and `runAttemptAnalysis` in `TestsAnalysisService`, with fixed JSON parsing and `FAILED` storage on errors.
   - Verify: targeted specs pass.
3. Preserve current stub path when no prompt version is configured.
   - Verify: existing public session specs stay green.

### 6. Frontend Admin Prompt Studio

1. Add/adjust frontend tests where local test setup already exists for prompt workspace helpers/adapters.
   - Verify: targeted frontend tests fail for missing prompt version/question selection behavior.
2. Wire generated API hooks or typed fetch helpers into Prompt Studio for list/create/publish/simulate.
   - Verify: targeted tests pass.
3. Add selection of all available questions by question IDs and "generate AI test answers" using free models by default.
   - Verify: tests cover selected question payload and free-model default.

### 7. Frontend Test Editor Attachment

1. Add failing tests for draft state and API payload including `analysisPromptVersionId`.
   - Verify: targeted frontend tests fail.
2. Add prompt version selector to the existing test settings/editor UI.
   - Verify: targeted tests pass and TypeScript accepts the generated/API types.

### 8. Student And Admin Formatted Analysis

1. Write/adjust adapter tests for the fixed analysis JSON schema:
   - current level of basic skills,
   - thinking type,
   - personality traits,
   - career/professional development recommendations.
   - Verify: targeted frontend tests fail before adapter update.
2. Reuse the existing public analysis report components where possible, adapting copy/data to the fixed schema.
   - Verify: adapter/component tests pass.
3. Update admin attempt detail to render the same formatted analysis instead of raw JSON.
   - Verify: targeted tests pass or TypeScript build catches regressions.

### 9. Full Verification And Finish

1. Run backend targeted suites touched by the work.
2. Run frontend targeted suites/typecheck touched by the work.
3. Run `npm run verify:local` from the repo root.
4. If `verify:local` is green, run `npm run verify:template`.
5. Commit only intentional files, leaving unrelated dirty/untracked user work untouched unless it was explicitly integrated.

## Stop Conditions

- Stop before using any real OpenRouter call in tests.
- Stop if generated API contracts require a running service that cannot be started with the root `docker-compose.yml`.
- Stop if untracked public analysis UI files conflict with this implementation and ask before overwriting user-authored work.
