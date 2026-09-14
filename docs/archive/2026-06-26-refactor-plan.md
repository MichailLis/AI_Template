# Refactor Plan — 2026-06-26

Agent-executable backlog derived from an architecture audit of `server/` and `client/`. It includes
code-debt refactors, product hardening, product-enablement tooling, and explicitly requested feature
work (for example FE-1 admin dark theme). Each task is self-contained, scoped to one small reversible
commit, and ends with explicit verification gates.

## How to use this file (for the executing agent)

1. Read `AI_GUIDE.md` first. It is the repository source of truth. This plan never overrides it.
2. Execute tasks **one at a time, top to bottom**, each as its own commit. Do not batch tasks.
3. Before each task, fill the `Change classification` block (per `AI_GUIDE.md` Phase 0).
4. Follow the required pipeline order: data model -> backend -> `gen:api` -> frontend -> verify.
5. Do not bypass architecture/lint/test gates. Keep `npm run verify:architecture` green.
6. Default verification loop is `npm run verify:local`. Run `npm run verify:template` before
   finalizing a batch or when the task touches data model / API client.
7. If a task reveals hidden coupling that requires broad edits, stop and split into a dedicated
   prep commit first (per `AI_GUIDE.md` Refactor Debt Prevention).
8. Do not remove current business modules. Treat P0/P1/P2 as refactor-only; FE-_ and PH-_ tasks may
   introduce behavior only where their own scope explicitly says so.

Priority legend: **P0** = architectural defect, **P1** = high (god-object / duplication),
**P2** = medium (hygiene / coverage / hardening).

---

## P0-1 — Extract `AppSettingsModule`, stop duplicate provider registration

**Problem.** `server/src/app-settings/` has no `*.module.ts`. `ProfessionAtlasClientService`,
`ProfessionAtlasSettingsService`, and `ProfOrientationAtlasService` are registered as providers in
**both** `admin.module.ts:15-17` and `tests-attempts.module.ts:28-30`, creating separate DI
instances per module (no singleton sharing) and duplicated wiring.

**Goal.** One owning module that provides and exports these services; consumers import the module.

**Change classification (fill before work).**

- Owning feature/module: `app-settings` (infrastructure/system config)
- Prisma owner/model: none (no schema change)
- Route root: none
- Manifest impact: none expected (integration/infra module, not a feature route context)
- Generator decision: skip `gen:nest` (manual module extraction)
- Verification gates: `verify:local`

**Steps.**

1. Create `server/src/app-settings/app-settings.module.ts` (or `prof-orientation.module.ts` if a
   cleaner split exists) that declares `ProfessionAtlasClientService`,
   `ProfessionAtlasSettingsService`, `ProfOrientationAtlasService` as `providers` and `exports`.
2. Import the new module in `admin.module.ts` and `tests-attempts.module.ts`; remove the duplicated
   entries from each module's `providers` array.
3. Confirm DI still resolves (no missing-provider errors at bootstrap).

**Verification.** `npm run test --prefix server`, `npm run test:e2e --prefix server`,
`npm run build --prefix server`, `npm run verify:architecture`, `npm run verify:local`.

**Rollback.** Single commit; revert if DI graph breaks.

---

## P0-2 — Remove cross-module deep imports into `tests/`

**Problem.** Layer/boundary violations:

- `admin-settings.controller.ts:7` and `admin.module.ts:5` deep-import
  `../tests/prof-orientation-v3-plus.atlas`.
- `analysis-prompts.module.ts:4` / `analysis-prompts.service.ts:9` deep-import
  `TestsPromptSimulationReadService`.

**Goal.** Consumers depend on an exported module surface, not concrete internal files of another
domain.

**Change classification (fill before work).**

- Owning feature/module: boundary cleanup across `admin`, `analysis-prompts`, `tests`,
  `app-settings`
- Prisma owner/model: none
- Manifest impact: none expected
- Generator decision: skip
- Verification gates: `verify:local`

**Steps.**

1. Depends on **P0-1**: once `ProfOrientationAtlasService` is exported from its own module, change
   `admin` to import that module instead of the deep file path.
2. For `analysis-prompts` -> `tests`: confirm `TestsPromptSimulationReadService` is exported from
   `tests-prompt-simulation-read.module.ts` and import the module, not the file.
3. Re-check for any other `../tests/...` deep imports outside the `tests` module and route them
   through module exports.

**Verification.** Same as P0-1 plus a grep that no module outside `tests/` imports
`../tests/<internal-file>` directly.

---

## P0-3 — Split the `tests/` macro-module (prep for scaling)

**Problem.** `tests/` holds ~50% of backend (~70 files): topics, versions, public-links, attempts,
analytics, export, prof-orientation, scoring, enrichment. High coupling hub.

**Goal.** Carve out clearly separable sub-domains behind module boundaries **without** moving them
out of the `tests` bounded context ownership defined in `AI_GUIDE.md`.

> Note: This is structural. Do this **only** as a dedicated prep batch after P0-1/P0-2, and only if
> P1 god-object tasks below need it. If unsure about ownership, stop and ask (per `AI_GUIDE.md`
> Phase 0 guardrail #3).

**Suggested seams.**

- `tests-analytics` (service + export + pdf-renderer + summary) as an internal sub-module.
- `prof-orientation` (atlas/scoring/enrichment/fixture/types) as an internal sub-module exported to
  `tests-attempts` and `admin`.

**Verification.** `npm run verify:architecture`, `npm run verify:template`.

---

## P1-1 — Replace 39× `ensureAdminAccess` with an `AdminGuard`

**Problem.** `ensureAdminAccess(this.prisma, userId)` is called 39 times (14× in
`tests.service.ts`, 9× in `analysis-prompts.service.ts`, 7× in `tests-public-link.service.ts`).
Each call issues its own `user.findUnique`. See `common/authz/admin-access.utils.ts:20`.

**Goal.** Centralize admin authorization in a guard/decorator at the controller boundary; remove
per-method DB lookups in services.

**Change classification (fill before work).**

- Owning feature/module: `common` (authz) + `auth`
- Prisma owner/model: none
- Manifest impact: none
- Generator decision: skip
- Verification gates: `verify:local` (auth flow must stay green)

**Steps.**

1. Implement an `AdminGuard` (extend existing JWT guard pattern in `auth/guards`) that verifies the
   admin role once per request.
2. Apply it on admin controllers/endpoints currently relying on `ensureAdminAccess`.
3. Remove the now-redundant `ensureAdminAccess` calls from service methods, leaving the utility
   only where a service genuinely needs a non-request-scoped check.
4. Add/adjust a guard unit test and keep auth e2e green.

**Verification.** `npm run test --prefix server`, `npm run test:e2e --prefix server`,
`npm run verify:local`. Auth flow (`/auth/*`, `/login`) must keep working (`AI_GUIDE.md` Stability
rule #4).

---

## P1-2 — Decompose `TestsAnalysisService`

**Problem.** `tests-analysis.service.ts` (~605 lines) mixes: hard-coded Russian prompt builders
(L111-172), timeout/retry env parsing (L182-238), a bootstrap recovery job (`OnApplicationBootstrap`,
L373-405), persistence, and response mapping.

**Goal.** Single-responsibility units; same runtime behavior.

**Steps.**

1. Move prompt text/builders into a templates/config module (no behavior change).
2. Extract timeout/retry policy parsing into a small provider/util (dedupe `getProfOrientation*`
   L182-217).
3. Extract the stale-analysis recovery loop into its own service/scheduler.
4. Keep `upsert*` persistence; consider a shared helper for the duplicated create/update column
   lists (L272-362) — optional within this task.
5. Preserve the `AI_GUIDE.md` prof-orientation contract: deterministic analysis stored `READY`
   before LLM; LLM writes only `summary.llm`; retry cap stays at 2.

**Verification.** `npm run test --prefix server` (this service is well-covered — keep specs green),
`npm run verify:local`.

---

## P1-3 — Move prompt-seeding out of `TestsService`

**Problem.** `tests.service.ts:135-185` `ensureProfOrientationPromptVersion` performs
prompt-versioning, which belongs to the `analysis-prompts` domain, not topic lifecycle.

**Goal.** Relocate the seeding concern to `analysis-prompts`, expose it via that module's surface,
and call it from `tests` through the module boundary (not a deep import).

**Steps.**

1. Add a seeding method to the `analysis-prompts` service/module and export it.
2. Replace the inline logic in `TestsService` with a call through the exported surface.
3. Preserve `AI_GUIDE.md` rule: seed built-in prompt with `deepseek/deepseek-v4-flash` only when no
   published built-in prompt version exists.

**Verification.** `npm run test --prefix server`, `npm run verify:local`.

---

## P1-4 — Decompose `TestsAnalyticsService.getSummary`

**Problem.** `tests-analytics.service.ts` has a single ~256-line method `getSummary` (L170-426)
computing coverage, per-link rows, group aggregation, demographic histograms, and V3 sections
inline.

**Goal.** Extract pure aggregator helpers; keep output identical.

**Verification.** Existing analytics specs must pass unchanged; `npm run verify:local`.

---

## P1-5 — Deduplicate STANDARD vs POLUS public components

**Problem.** Two parallel component trees branch on `publicTemplate`. Critical divergence:
`maxChoices` enforcement is implemented twice (`PublicQuestionChoiceGroup` vs inline
`PolusChoiceAnswers` in `polus-public-question-card.tsx:114-202`); next/finish dispatch duplicated
(`QuestionNavigation` vs `PolusQuestionActions`).

**Goal.** Extract template-agnostic primitives so shared behavior lives once; visual differences via
variant props / CSS.

**Change classification (fill before work).**

- Owning feature/module: `tests` (public student rendering)
- Prisma owner/model: none
- Manifest impact: none (no route change — `AI_GUIDE.md` Public UX contract: branch by template
  without changing `/t/*` routes)
- Generator decision: skip
- Verification gates: client tests + maintainability

**Steps (incremental, one primitive per commit).**

1. Extract a shared choice-list primitive consolidating both `maxChoices` implementations; wire
   STANDARD and POLUS cards to it.
2. Extract a shared next/finish nav-action controller; keep STANDARD/POLUS visual shells.
3. Extract a shared slider primitive.
4. Keep POLUS styles scoped via the Polus `PublicThemeLayout` variant (`AI_GUIDE.md` Public UX rule
   #8); do not move tokens into global `app/index.css`.

**Verification.** Rebuild frontend container before tests (`AI_GUIDE.md`): `docker compose up -d
--build --force-recreate frontend`. Then `npm run test:run --prefix client`,
`npm run verify:architecture`, `npm run verify:maintainability`, `npm run verify:local`.

---

## P1-6 — Convert `use-admin-public-links-form-state.ts` to `useReducer`

**Problem.** `widgets/admin-public-links-workspace/ui/use-admin-public-links-form-state.ts:19-42`
has 20 `useState` (guide flags >14); 18 setters are passed straight through (L66-105). Complexity
was relocated, not reduced.

**Goal.** Replace with `useReducer` (or react-hook-form) without changing the consumer contract more
than necessary.

**Verification.** Rebuild frontend container, then `npm run test:run --prefix client`,
`npm run verify:maintainability` (must report <=14), `npm run verify:local`.

**Follow-ups (separate commits):** `use-admin-prompts-editor-state.ts` (16),
`use-admin-tests-dialog-state.ts` (14).

---

## P1-7 — Split the `features/tests` god-slice public API

**Problem.** `features/tests/index.ts` exports ~25 symbols mixing admin authoring (`TestEditor`,
`QuestionModal`, `TestsSidebar`, AI generator) and public student rendering (`PublicThemeLayout`,
`PublicTestStudentAnalysisView`, `ProfOrientationResult`, polus result).

**Goal.** Narrow the public surface by separating the two lifecycles, while staying within the
`tests` feature ownership (`AI_GUIDE.md` ownership map). Keep FSD strict mode green (no deep
imports).

> Structural FSD change. Coordinate with P1-5. If it forces broad edits, do it as a dedicated
> refactor commit per `AI_GUIDE.md` Refactor Debt Prevention #5.

**Verification.** `npm run verify:architecture` (strict mode, empty `allowLayerBypass`/
`allowDeepImports`), `npm run verify:local`.

---

## P2-1 — Extract `StudentProfile` value object from `TestStudentAttempt`

**Problem.** `prisma/schema.prisma:255-293` flattens 9 denormalized `student*` profile columns plus
consent snapshot onto the attempt row.

**Goal.** Cohesive student-profile snapshot (embedded type or related table) reducing per-attempt
column sprawl.

> Data-model change — follow full pipeline: schema -> `prisma:generate` -> `prisma:push` ->
> backend -> `gen:api` -> frontend -> `verify:template`. If table ownership is unclear, stop and ask
> (`AI_GUIDE.md` Phase 0 #3). Consider deferring if churn is too high; document the decision.

**Verification.** `npm run verify:template`.

---

## P2-2 — Resolve dual `educationOrganization` storage

**Problem.** Attempt stores both an FK (`educationOrganizationId` -> `EducationOrganization`) and a
free-text `educationOrganization String?` snapshot — two sources of truth that can drift.

**Goal.** Define the snapshot vs reference contract explicitly (snapshot for history, FK for
current) and document it; remove ambiguity in read paths.

**Verification.** `npm run verify:template`.

---

## P2-3 — Validate business-meaningful `Json` columns; remove `as unknown as InputJsonValue`

**Problem.** `scoringConfig`, `settings`, `answerPayload`, `summary`, `publicBranding`,
`outputSchema` are untyped `Json`. Code uses `as unknown as Prisma.InputJsonValue` 7× (4× in
`tests-analysis.service.ts` L348/357/532/554; 2× in `tests-public-session.service.ts` L201/555; 1×
in `prof-orientation-v3-plus.atlas.ts`).

**Goal.** Add Zod validation/serialization helpers at the persistence boundary so the double-casts
can be removed safely.

**Verification.** `npm run test --prefix server`, `npm run verify:local`.

---

## P2-4 — Harden the global exception filter

**Problem.** `common/filters/all-exceptions.filter.ts:44` only maps Prisma `P2002`; `P2003` (FK),
`P2025` (not found) fall through to generic 500. Error `code` is a loosely-typed string
(`res.error || 'HTTP_ERROR'`, L30).

**Goal.** Map common Prisma codes to stable error codes; introduce an error-code enum. Keep the
unified envelope shape (`AI_GUIDE.md` Stability rule #8).

**Verification.** Add filter unit tests for P2003/P2025; `npm run test --prefix server`,
`npm run verify:local`.

---

## P2-5 — Add HTTP-boundary (controller) tests

**Problem.** Public-facing controllers are the least-tested layer: `tests.controller.ts` (182
lines), `tests-public.controller.ts`, `admin.controller.ts`, `admin-settings.controller.ts`. Also
`app-settings/profession-atlas-client.service.ts` (external HTTP client) has no spec.

**Goal.** Cover the HTTP boundary (request validation, guard wiring, response DTO shape) and the
external client.

**Verification.** `npm run test --prefix server`, `npm run test:e2e --prefix server`,
`npm run verify:local`.

---

## P2-6 — Consolidate agent docs and fix drift

**Problem.** Four entrypoints (`AGENT.md` [legacy], `AGENTS.md`, `CLAUDE.md`, `RTK.md`) plus
`AI_GUIDE.md`. Drift example: `AI_GUIDE.md:438,446` says `PublicThemeLayout` lives at the
widget path, but the real implementation is `features/tests/ui/public-theme-layout.tsx` and the
widget path is a 1-line re-export shim.

**Goal.** Reduce fragmentation and fix the `PublicThemeLayout` drift (either move the implementation
to the widget path AI_GUIDE claims, or update AI_GUIDE lines 438/446 and remove/justify the shim).

**Verification.** `npm run verify:ai-guide`, `npm run verify:local`. Keep `AI_GUIDE.md` as the
single source of truth.

---

## P2-7 — Repository hygiene: relocate runtime logs/artifacts

**Problem.** ~20 log/artifact files clutter the repo root (`.runtime-dev.log` ~1.1MB,
`project_start*.log`, `e2e-*.log`, `vectors.db*`, `nul`). All are git-ignored (tree is clean), but
they add navigation noise for agents.

**Goal.** Redirect dev/e2e/runtime logs into a `logs/` (or `tmp/`) directory and update any scripts
that write them. Do not commit logs. Keep `.gitignore` coverage intact.

**Verification.** `git status` stays clean of new tracked artifacts; `npm run verify:local`.

---

## FE-1 — Admin dark theme (admin-only, token-driven)

**Type.** Feature enhancement (not debt). Added to this plan per request. Frontend-only.

**Current state (audited 2026-06-26).**

- `client/tailwind.config.js:3` already sets `darkMode: ['class']` — class-based dark mode infra
  exists at the Tailwind level.
- All design tokens live **light-only** in `:root` of `client/src/app/index.css`: both shadcn base
  tokens (`--background`, `--foreground`, `--card`, ...) and the full `--admin-*` set
  (`--admin-canvas`, `--admin-panel`, `--admin-foreground`, `--admin-info*`, `--admin-success*`,
  etc., L27-54). **No `.dark` block exists anywhere.**
- The admin UI is almost entirely **semantic-token driven** via `adminClassNames` /
  `adminToneClassNames` / `adminBadgeClassNames` in `client/src/shared/ui/admin-design-tokens.ts`
  (292 lines). This is the key lever: theming the tokens themes the whole admin with near-zero
  component churn.
- Public student flow (`/t/*`) is scoped via `.theme-public` (`features/tests/ui/public-theme.css`)
  and POLUS via `polus-public-theme.css`. `AI_GUIDE.md` Public UX rule #3 forbids putting
  public-theme tokens in global `app/index.css`.
- Persistence must use `safeStorage` from `@/shared/lib/storage` (`AI_GUIDE.md` Stability rule #6).
  Only one Zustand store exists (`entities/session`), kept minimal.

**Goal.** A light/dark toggle that applies **only to the admin workspace** (`/admin/*`), persists
the choice, optionally honors `prefers-color-scheme` on first visit, and does **not** leak into
`/login` or the public `/t/*` flow.

**Scoping decision (important architectural choice).**
Recommended approach **A — lifecycle-bound class on `document.documentElement`**:

- Toggle the `dark` class on `<html>` while the admin layout is mounted; remove it on unmount /
  logout. This themes shadcn portals (dialog/popover/dropdown render to `body`, outside the admin
  shell root), which a shell-root-scoped class would miss.
- Because `/login` and `/t/*` are separate route trees and the class is removed when leaving admin,
  they stay unaffected; public pages additionally override tokens via `.theme-public`.
  Alternative B (scope `.dark` to the admin shell root only) is rejected: it would not theme portaled
  overlays. Document whichever is chosen.

**Change classification (fill before work).**

- Owning feature/module: `admin` (existing-feature-change; admin shell + shared UI tokens)
- Prisma owner/model: none (no schema change)
- Route root: none (no new route; `/admin/*` unchanged)
- Manifest impact: none (no new feature/route/module in `template/features.manifest.json`)
- Generator decision: skip `gen:nest` and `gen:api` (no backend/API change)
- Verification gates: client tests, architecture, maintainability, `verify:local`

**Steps (small commits).**

1. **Dark token set.** Add a `.dark { ... }` block in `client/src/app/index.css` that overrides
   **every** token currently in `:root` — both shadcn base tokens and the full `--admin-*` set —
   with dark HSL values. Keep `:root` as the light default. Do not touch `.theme-public` /
   `polus-public-theme.css`.
2. **Hardcoded-color audit.** Grep `admin-design-tokens.ts` and admin widgets for non-token colors
   that won't adapt (e.g. `text-white` on `sidebar.brandMark` L122 / `code.block` L213, the canvas
   gradient in `shell.root` L103, any `bg-white`/literal hex). Replace with tokens or add dark-safe
   variants. This is where the real work is — the token swap is mechanical, contrast is not.
3. **Theme controller.** Add a small `useAdminTheme` hook (and/or a tiny store mirroring the
   `entities/session` pattern) under the admin feature/shared lib that:
   - reads persisted theme from `safeStorage` (key e.g. `admin-theme`); never touch `localStorage`
     directly,
   - defaults to `system` (read `window.matchMedia('(prefers-color-scheme: dark)')`) or `light`,
   - applies/removes the `dark` class on `<html>` bound to admin-layout lifecycle
     (`widgets/admin-page-layout/ui/admin-page-layout.tsx`),
   - exposes `theme` + `setTheme`/`toggle`.
4. **Toggle UI.** Add a theme toggle button in the admin header (next to the existing header
   actions; styles via `adminClassNames.header.button`). Use the lucide icon set already configured
   in `components.json` (`Sun`/`Moon`/`Monitor`). Keep it accessible (aria-label, keyboard).
5. **No-flash guard.** Apply the persisted/system theme before first admin paint (e.g. set the class
   in the layout effect synchronously on mount) to avoid a light->dark flash. Do not add global
   blocking scripts that would affect `/login` or `/t/*`.
6. **Verify isolation.** Confirm `/login` and `/t/*` (STANDARD and POLUS) render unchanged in both
   modes; confirm portaled dialogs/popovers/toasts (`sonner` `Toaster`) are themed.

**Verification.** Rebuild the frontend container first (`AI_GUIDE.md` requires it after `client/`
changes): `docker compose up -d --build --force-recreate frontend`. Then:
`npm run test:run --prefix client`, `npm run verify:architecture` (strict FSD; no deep imports —
keep the theme hook within proper layers and export via slice `index.ts`),
`npm run verify:maintainability`, `npm run verify:local`. Manually check contrast in dark mode
across admin screens (tests editor, prompts, public-links, stats, analytics, users, settings).

**Out of scope.** Dark theme for the public `/t/*` flow and `/login` (separate task if needed);
per-user server-persisted preference (this task is client-local via `safeStorage`).

**Rollback.** Self-contained; revert the `.dark` block, hook, and toggle. No data/API impact.

---

# Product Hardening & Identity

> **Context correction (2026-06-26).** Auth-only was only the _starting seed_ of this repo. The
> actual product is the prof-orientation / Polus testing platform built on top of it. The "template"
> framing (`auth-only` cleanup target, "reference example", template-finalization) is now largely
> **vestigial narrative**, not a product goal. The engineering guardrails (strict FSD, maintainability
> thresholds, verify gates, error envelope, type hygiene, CI) stay — they are good product discipline,
> not template ceremony. The tasks below treat this repo as a single real product.
>
> **Retraction:** an earlier audit note flagged hardcoded Russian strings / missing i18n as debt.
> **This is withdrawn.** The product is single-locale (RU) for Russian-speaking students; RU copy is
> correct. The only residual is UX error copy living in the service layer, already covered indirectly
> by PH-IDENT below and P2-4 (error-code enum). Do **not** introduce an i18n layer as part of this plan.

## PH-IDENT — Resolve template-vs-product identity in docs/config

**Problem.** 16 references to `auth-only` / `template-finalization` across repo docs instruct agents
to preserve a return-to-auth-only capability and treat the domain as a removable "example". For a
single product this is dead weight: it adds false constraints and cognitive load, and contradicts the
fact that prof-orientation is the core, not a sample.

**Goal.** Make the repo self-describe as a product while keeping the valuable engineering guardrails.

**Change classification (fill before work).**

- Owning feature/module: docs + meta config (no runtime code)
- Prisma owner/model: none
- Route root: none
- Manifest impact: terminology only (no structural manifest change)
- Generator decision: skip
- Verification gates: `verify:ai-guide`, `verify:local`

**Steps.**

1. In `AI_GUIDE.md`: remove/neutralize the `auth-only cleanup target` and `template-finalization`
   narrative (lines ~11 and related); keep the guardrail sections (FSD, pipeline, stability, gates).
2. Reframe the "Reference Example For AI Agents" (`news`) section as an explicit _how-to-add-a-feature
   tutorial_, not as "the domain is an example".
3. Reframe `features.manifest.json` purpose wording from "template inventory" to "product module
   registry" (no schema change to the manifest itself).
4. Optionally rename the `verify:template` script alias to a product-release name (e.g.
   `verify:release`) **only if** `scripts/verify-package-scripts.mjs` and CI (`/.github/workflows/
ci.yml`) are updated in the same commit; otherwise keep the name and just re-document its meaning.
5. Collapse the doc entrypoints addressed in P2-6 (`AGENT.md` legacy etc.) in the same pass.

**Verification.** `npm run verify:ai-guide`, `npm run verify:package-scripts`, `npm run verify:local`.
Do not change any architecture/verify _behavior_ — wording/identity only.

**Rollback.** Docs/config only; trivially revertible.

## PH-DATA — Student data lifecycle (GDPR / retention)

**Problem.** The product collects sensitive student profile data (gender, age, residence, education
level — likely minors) plus a consent snapshot on `TestStudentAttempt`. The schema has an
`anonymizedAt` field (`prisma/schema.prisma:278`) but there are **zero** references to anonymization
anywhere in `server/src` — the data-lifecycle obligation is unfinished. Consent snapshot fields are
untyped `Json`.

**Goal.** Implement a real retention/anonymization path and type the consent snapshot.

> Data-model + backend change — follow the full pipeline (schema -> `prisma:generate` ->
> `prisma:push` + migration -> backend -> tests -> `verify:template`). Coordinate with P2-1
> (StudentProfile value object) and P2-3 (Json typing) — do those structural tasks first if possible.

**Change classification (fill before work).**

- Owning feature/module: `tests` (attempts/sessions own student data)
- Prisma owner/model: `TestStudentAttempt` (+ related answer/analysis rows)
- Route root: admin-only operational endpoint (no public route change)
- Manifest impact: none (extends existing `tests` feature)
- Generator decision: skip `gen:nest`; extend the owning module
- Verification gates: `verify:template`

**Steps.**

1. Define the retention policy explicitly (what is anonymized, after how long, what is purged vs
   kept for aggregate stats). Document it in `docs/`.
2. Implement an anonymization routine that populates `anonymizedAt` and scrubs/nulls the `student*`
   PII columns while preserving non-identifying analytics aggregates. Decide trigger: scheduled job
   vs admin action vs both.
3. Type the consent snapshot (`consentVersion`, `consentTextSnapshot`) and ensure it is retained
   even after anonymization (proof-of-consent must survive PII scrub).
4. Ensure analytics (`tests-analytics.service`) and stats tables tolerate anonymized rows (no PII
   assumptions) — ties into `AI_GUIDE.md` Admin stats rule #10 (profile type may be absent).
5. Add unit tests for the anonymization routine and an analytics-with-anonymized-rows case.

**Verification.** `npm run test --prefix server`, `npm run test:e2e --prefix server`,
`npm run verify:template`.

## PH-PUBLIC — Throttling + LLM-cost guard on public flow

**Problem.** Public bearer endpoints `/t/*` have **no rate limiting** (no `@nestjs/throttler`,
no `helmet`, 0 occurrences in `server/src`). These same endpoints can enqueue **paid** OpenRouter
LLM enrichment. A leaked/shared public link enables abuse: cost inflation and junk attempt data.
Existing controls are only per-request timeouts/retries (`OPENROUTER_PROF_ORIENTATION_TIMEOUT_*`),
not entry throttling or a spend budget.

**Goal.** Add input throttling and a cost/abuse guard on the public student flow without breaking the
bearer-link UX defined in `AI_GUIDE.md` Public Student UX contract.

**Change classification (fill before work).**

- Owning feature/module: `tests` (public session) + `common` (guard/throttler infra)
- Prisma owner/model: none for throttling; optional counter for budget guard (decide explicitly)
- Route root: `/t/*` (behavior hardening only; no route shape change)
- Manifest impact: none
- Generator decision: skip
- Verification gates: `verify:template` (public e2e flows must stay green)

**Steps.**

1. Add `@nestjs/throttler` with sane per-IP / per-link limits on public session-start, answer-save,
   and result endpoints. Keep authenticated admin endpoints unaffected or on a separate policy.
2. Add `helmet` (or equivalent) security headers at the app bootstrap (`setup-app.ts`).
3. Add an LLM enrichment guard: cap enrichment per public link / per time window, and a global
   daily budget circuit-breaker that degrades to deterministic-only analysis (`summary.llm` stays
   empty) instead of failing — consistent with `AI_GUIDE.md` prof-orientation rule #6/#7
   (deterministic analysis stored `READY` before LLM).
4. Ensure throttled/over-budget responses use the unified error envelope and do not leak internal
   details (`AI_GUIDE.md` public DTO safety rules).
5. Update/extend public e2e (`scripts/e2e-critical-flows.mjs`) to cover a throttled response path.

**Verification.** `npm run test:e2e --prefix server`, `npm run verify:e2e:critical`,
`npm run verify:template`.

## PH-GEN — Fullstack feature generator (`gen:feature`)

**Problem.** Only `gen:nest <name>` (backend scaffold) exists; `AI_GUIDE.md` Generator Status admits
the fullstack generator is "not implemented yet". Agents must manually chain backend -> `gen:api` ->
frontend slice/page -> route wiring in `App.tsx` -> `features.manifest.json` entry. This multi-step
manual wiring is the single most error-prone agent workflow in the repo.

**Goal.** A generator that scaffolds the full vertical for a `new-feature` and registers it in the
manifest, so `verify:architecture` passes immediately.

> Tooling task (build it incrementally, well-tested via `scripts/lib/*.test.mjs`). This is highest
> leverage for _future_ agent velocity but is net-new tooling — schedule after the P0/P1 code-debt
> batch so it generates onto a clean architecture.

**Change classification (fill before work).**

- Owning feature/module: `scripts` tooling (+ generator templates)
- Prisma owner/model: none (generator may emit a model stub, but does not own data)
- Manifest impact: the generator _writes_ manifest entries; the tool itself adds none
- Generator decision: this task _builds_ the generator
- Verification gates: `test:scripts`, then a real end-to-end dry run + `verify:template`

**Steps.**

1. Design the generator contract: inputs (feature name, route root, model name) and outputs
   (backend module/controller/service/DTOs, `gen:api` invocation, frontend page + feature slice +
   route wiring in `App.tsx`, manifest entry).
2. Reuse the existing `gen:nest` backend scaffold; add frontend slice + page + `App.tsx` route
   insertion + manifest write.
3. Cover the generator with `node --test scripts/lib/*.test.mjs` (the repo already runs
   `test:scripts`).
4. Validate by generating a throwaway feature, running `verify:template`, then removing it (mirror
   the `AI_GUIDE.md` temporary-feature cleanup procedure).
5. Update `AI_GUIDE.md` Generator Status + Feature Pipeline once it lands.

**Verification.** `npm run test:scripts`, generate+verify+remove dry run, `npm run verify:template`.

## PH-MIGRATE — Make the migration workflow consistent

**Problem.** `AI_GUIDE.md` Phase 1 prescribes `prisma db push` (no migration file generated), yet a
real migration history exists (`server/prisma/migrations/`, 8 migrations) and `verify-prisma-
migrations.mjs` gates it. Agents following the documented `push` workflow can drift the schema from
the migration history.

**Goal.** One canonical, documented schema-evolution workflow that prevents drift.

**Change classification (fill before work).**

- Owning feature/module: docs + `scripts/verify-prisma-migrations.mjs` (process/tooling)
- Prisma owner/model: none (process change)
- Manifest impact: none
- Generator decision: skip
- Verification gates: `verify:prisma-migrations`, `verify:local`

**Steps.**

1. Decide and document the rule: `prisma db push` allowed for _local prototyping only_; a migration
   (`prisma migrate dev`) is **required** before merge whenever `schema.prisma` changes.
2. Strengthen `verify-prisma-migrations.mjs` to fail when `schema.prisma` has changes not represented
   by a migration (drift check), so the gate enforces step 1.
3. Update `AI_GUIDE.md` Phase 1 to describe the two-stage workflow.

**Verification.** `npm run verify:prisma-migrations`, `npm run verify:local`.

---

## Suggested execution order

1. P0-1 -> P0-2 (unblocks boundaries) -> (P0-3 only if needed)
2. P1-1 -> P1-2 -> P1-3 -> P1-4
3. P1-5 -> P1-6 -> P1-7
4. P2-3 -> P2-4 -> P2-5
5. P2-1 -> P2-2 (data-model batch, `verify:template`)
6. P2-6 -> P2-7 (docs/hygiene)
7. FE-1 (admin dark theme) — independent; can run anytime after P1-6/P1-7 settle admin UI churn,
   or standalone if prioritized by the user.

### Product Hardening & Identity ordering

These are product-grade, mostly independent of the code-debt batches above:

- **PH-IDENT** (docs/identity) — do early and cheap; run together with P2-6. Removes false agent
  constraints before deeper work.
- **PH-PUBLIC** (throttle + LLM-cost guard) — highest production risk; schedule soon, independent of
  code-debt refactors.
- **PH-DATA** (GDPR/retention) — high risk; do after P2-1/P2-3 (StudentProfile value object + Json
  typing) so it builds on the cleaned-up data model.
- **PH-MIGRATE** (migration workflow) — do before/with the first schema-changing task (P2-1 / PH-DATA)
  so they follow the corrected workflow.
- **PH-GEN** (fullstack generator) — highest _future-velocity_ leverage; schedule after the P0/P1
  batch so it scaffolds onto a clean architecture.

## Invariants to preserve (do not regress)

- Zero `TODO/FIXME`, zero `any`, zero `@ts-ignore`, zero `eslint-disable` (except the 2 shadcn
  Fast-Refresh exceptions in `shared/ui/button.tsx:49`, `shared/ui/badge.tsx:32`).
- Strict FSD: no deep imports, no upward layer imports, empty `allowLayerBypass`/`allowDeepImports`.
- Unified error envelope, auth flow always working, single Zustand store kept minimal.
- All maintainability thresholds (client 420 / server 700 / specs 900 effective lines,
  <=14 `useState`/file).
