# Prof Orientation v3+ Built-In Methodology

This note records the production contract for the built-in Polus prof-orientation
methodology. Runtime code must not read the external source package from
`Методика теста + вопросы`; the committed fixture is the source used by the app.

## Runtime Ownership

- Built-in fixture:
  `server/src/tests/prof-orientation-v3-plus/site-config.json`
- Import endpoint:
  `POST /admin/tests/methodologies/prof-orientation-v3-plus/import`
- Admin UI action: import prof-orientation v3+ from the tests workspace.
- Public UI: the specialized result is rendered only for the Polus public
  template when the analysis summary has `resultKind = "prof_orientation_v3_plus"`.

Each import creates a new draft topic with a unique slug/title. It does not
overwrite user-created tests.

## Imported Test Shape

The importer creates the methodology as a normal tests-module draft:

- 10 `MULTI_CHOICE` methodology questions.
- 11 `SLIDER` questions.
- `MULTI_CHOICE` questions store `settings.maxChoices = 2` and answer-to-direction
  mappings in question settings.
- Slider questions store methodology ids, interest/readiness category metadata,
  direction metadata, and readiness weights in question settings.
- The version stores:
  - `scoringKind = PROF_ORIENTATION_V3_PLUS`
  - full `scoringConfig`
  - a built-in prompt version for methodology-bound LLM enrichment.

The public Polus runner enforces `maxChoices` for multi-choice questions and uses
a dedicated slider field for the methodology sliders.

## Scoring Contract

`finishSession` handles this methodology in two stages:

1. Deterministic scoring runs first and stores a `READY` analysis immediately.
2. LLM enrichment runs after the algorithmic result and writes only under
   `summary.llm`.

The LLM is not allowed to change deterministic fields such as:

- `primaryDirection`
- `secondaryDirection`
- scores
- confidence
- classification/profile type
- professions selected by the methodology

If no prompt is attached, provider mode is `ALGORITHM`. If LLM enrichment is
requested, provider mode is `ALGORITHM_LLM`; the deterministic result still
remains readable if the enrichment fails.

## LLM Enrichment

The built-in prompt is methodology-specific. It asks the model to explain the
already computed result in plain language, especially the "Professor Polus says"
summary, and to avoid exposing internal formulas, JSON keys, raw confidence
metrics, or method diagnostics to the student.

The structured enrichment schema includes:

- `professorSummary`
- `summary`
- `confidenceComment`
- `methodSignals`
- `firstSteps`
- `learningPlan`
- `professionNotes`
- `nextMiniProject`
- `cautions`

The Polus result UI merges these fields into existing result blocks instead of
rendering a separate oversized LLM block. When the LLM result is missing or
failed, the UI falls back to deterministic methodology text.

## OpenRouter Timeout And Retry

The default OpenRouter timeout remains global for ordinary requests, but the
prof-orientation enrichment has a longer default because the prompt is larger:

```env
OPENROUTER_TIMEOUT_MS=120000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS=180000
OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES=1
```

Rules:

- `OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS` overrides the methodology timeout.
- If the methodology-specific timeout is not set, the service uses the larger of
  `OPENROUTER_TIMEOUT_MS` and `180000`.
- `OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES` defaults to `1`.
- Retry count is clamped to `0..2`.
- Retries happen only for the exact timeout error
  `OpenRouter request timeout`.
- Non-timeout OpenRouter errors are not retried.

## Verification

Core verification for this feature:

```powershell
npm run prisma:generate
npm run gen:api
npm run verify:local
npm run verify:template
```

Targeted backend tests cover:

- importer creates the real methodology draft shape
- strong/mixed/broad/low/contradiction scoring scenarios
- algorithm-first `READY` analysis before LLM
- LLM enrichment cannot mutate deterministic algorithm fields
- timeout-only retry behavior for prof-orientation OpenRouter calls
