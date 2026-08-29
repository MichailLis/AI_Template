# Tests module contract

Current tests implementation is wired as a dedicated backend module + admin workspace:

- Backend module: `server/src/tests/*`, organised by area:

  | Directory                   | Holds                                                                       |
  | --------------------------- | --------------------------------------------------------------------------- |
  | `topics/`                   | Authoring: topics, versions, questions, publishing                          |
  | `public-links/`             | Link lifecycle, link access, education organizations                        |
  | `session/`                  | The student runtime behind `/t/*`: start, answer, finish                    |
  | `analysis/`                 | Explaining **one** attempt — LLM and algorithm pipelines, prompt simulation |
  | `reporting/`                | Aggregating **many** attempts — analytics, XLSX and PDF export              |
  | `attempts/`                 | Operator-facing view of a single attempt                                    |
  | `prof-orientation-v3-plus/` | The built-in methodology and its committed fixture                          |
  | `shared/`                   | Helpers used across more than one of the above                              |

  `analysis` and `reporting` are named apart on purpose: one explains a single student's
  attempt, the other aggregates across attempts. The two Nest modules that wire these areas
  together, `tests.module.ts` and `tests-attempts.module.ts`, stay at the root.

- Frontend page wrapper: `client/src/pages/admin/admin-tests-page.tsx`
- Frontend workspace: `client/src/widgets/admin-tests-workspace/*`
- Admin route: `"/admin/tests"`
- Manifest feature entry: `tests` (`template/features.manifest.json`)

Domain/versioning baseline:

1. Single active draft per topic (`activeDraftVersionId`).
2. Optional active published version (`activePublishedVersionId`).
3. Publish action archives prior published version (if exists), promotes draft, then clones a new draft.
4. Question weights are `Int`.
5. Branching configurator is intentionally out of scope for this stage.

Frontend UX baseline for tests editor:

1. Question add/edit must happen in modal UI (avoid oversized inline editor blocks).
2. Choice-type options should use explicit row-based inputs, not manual delimiter syntax.
3. Service-side option code should be auto-generated when not explicitly required in UI.
4. Advanced JSON settings should be collapsible by default ("Advanced settings").
5. Keep labels and helper copy clear enough for non-technical content managers.
6. Topic list must support safe deletion with explicit confirmation.
7. Sidebar cards must gracefully handle long titles/slugs (no overflow beyond card bounds).

AI-assisted tests generation baseline:

1. Trigger from tests workspace via dedicated modal (`Создать тест с ИИ`).
2. Flow is two-phase: generate preview -> commit via transactional backend endpoint.
3. Transactional create endpoint: `POST /admin/tests/ai/create` (topic + draft + questions in one transaction).
4. Model selector must show only models with structured-output capability.

Built-in prof-orientation v3+ baseline:

1. Runtime methodology data must come from the committed fixture at
   `server/src/tests/prof-orientation-v3-plus/site-config.json`; do not read from
   the archived source package at `docs/archive/prof-orientation-v3-plus/` at runtime.
2. Admin import endpoint:
   `POST /admin/tests/methodologies/prof-orientation-v3-plus/import`.
3. Each import creates a new draft Polus-compatible topic with a unique slug/title,
   10 `MULTI_CHOICE` questions, 11 `SLIDER` questions,
   `scoringKind = PROF_ORIENTATION_V3_PLUS`, and full `scoringConfig`.
4. Built-in methodology LLM enrichment must use the analysis prompt version
   selected on the test topic. Seed the built-in prompt with
   `deepseek/deepseek-v4-flash` only when no published built-in prompt version
   exists yet.
5. Public multi-choice UI must enforce `settings.maxChoices`.
6. For this scoring kind, `finishSession` must store deterministic algorithm
   analysis as `READY` before LLM enrichment starts.
7. LLM enrichment writes only to `summary.llm`; it must not mutate deterministic
   direction, score, confidence, profile, or profession fields.
8. Prof-orientation OpenRouter calls may use
   `OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS` and
   `OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES`; retries are allowed only for
   `OpenRouter request timeout` and must stay capped at 2.
9. Polus result UI should merge LLM explanations into existing methodology blocks
   and avoid exposing raw method internals to students.
10. Detailed contract: `docs/2026-05-19-prof-orientation-v3-plus.md`.

---

Extracted from `AI_GUIDE.md`. The template-wide rules stay there; this file covers only the
product contract. Read it when working on test authoring, publishing, or the built-in prof-orientation methodology.
