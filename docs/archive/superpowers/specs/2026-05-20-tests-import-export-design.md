# Tests Import/Export Design

Status as of 2026-05-27: design/specification only. The built-in
prof-orientation v3+ import endpoint is implemented, but the generic JSON
test-topic import/export workflow described below is not yet implemented in the
current backend or admin UI.

## Summary

Add a JSON-based import/export workflow for admin test topics.

The export source is the active published version of a test topic. Import always creates a new
test topic with a new active draft version for review. Import never overwrites an existing topic and
never publishes the imported test automatically.

The exported file is a faithful snapshot of the published test version, including the attached
analysis prompt version snapshot. This is required for methodology-bound tests such as
`PROF_ORIENTATION_V3_PLUS`, where scoring depends on question settings, option values, slider
metadata, and the full scoring configuration.

## Goals

- Export a published test version to one `.json` file.
- Import that `.json` file as a new test draft.
- Include prompt data in the export when the published version has an analysis prompt.
- On import, create a new `AnalysisPrompt` and a new `PUBLISHED` `AnalysisPromptVersion` from the
  prompt snapshot, then attach it to the imported draft.
- Preserve `PROF_ORIENTATION_V3_PLUS` methodology semantics exactly enough for scoring and Polus UI
  behavior to keep working after import.
- Keep the implementation inside the existing tests bounded context.

## Non-Goals

- Do not export student attempts, answers, analysis records, public links, education
  organizations, users, or analytics reports.
- Do not import into an existing topic.
- Do not publish the imported test automatically.
- Do not reuse an existing prompt even if the imported prompt snapshot matches one already in the
  database.
- Do not support non-JSON archives or media bundles.

## Existing Context

- Test topics live in `server/src/tests`.
- The admin tests controller is `server/src/tests/tests.controller.ts`.
- Topic creation and version handling are in `server/src/tests/tests.service.ts` and
  `server/src/tests/tests-topic-version.utils.ts`.
- Question persistence normalizes payloads through `prepareQuestionPayload` in
  `server/src/tests/tests-domain.utils.ts`.
- Built-in prof-orientation v3+ import is implemented by
  `TestsService.importProfOrientationV3Plus`.
- v3+ methodology source data is committed at
  `server/src/tests/prof-orientation-v3-plus/site-config.json`.
- v3+ scoring depends on metadata read by
  `server/src/tests/prof-orientation-v3-plus.scoring.ts`.
- `scoreProfOrientationV3Plus` accepts a config override, so imported v3+ tests should use the
  stored topic version `scoringConfig` instead of silently falling back to the built-in fixture.
- The Polus public UI reads `settings.maxChoices`, `settings.sliderKind`, and
  `settings.methodologySliderId`.

## Export File Contract

The export file is a JSON object:

```json
{
  "schemaVersion": 1,
  "kind": "ai-template.test-topic-export",
  "exportedAt": "2026-05-20T12:00:00.000Z",
  "source": {
    "topicSlug": "prof-orientation-v3-plus",
    "publishedVersionNumber": 1
  },
  "topic": {
    "title": "Published title",
    "description": "Published description",
    "scoringKind": "PROF_ORIENTATION_V3_PLUS",
    "scoringConfig": {},
    "questions": []
  },
  "analysisPrompt": {
    "title": "Prompt title",
    "description": "Prompt description",
    "model": "openai/gpt-oss-120b",
    "temperature": 0.2,
    "prompt": "Prompt text",
    "outputSchema": {}
  }
}
```

`analysisPrompt` is `null` when the published version has no prompt.

Question objects include:

- `type`
- `title`
- `description`
- `required`
- `order`
- `settings`
- `options`
- `sliderBands`

Choice option objects include:

- `label`
- `value`
- `weight`
- `order`

Slider band objects include:

- `minValue`
- `maxValue`
- `label`
- `weight`
- `order`

The file must not include database ids, timestamps from exported rows, public link ids, attempt
ids, user ids, or generated analytics data.

## Prof-Orientation V3+ Requirements

For `scoringKind = "PROF_ORIENTATION_V3_PLUS"`, the export must preserve the full
`scoringConfig`. It is not enough to export only `scoringConfig.scoring`.

The full config must include these methodology sections:

- `version`
- `purpose`
- `implemented_improvements`, when present
- `directions`
- `mixed_profiles`
- `questions`
- `sliders`
- `scoring`
- `control_rules`
- `result_output`

The export should preserve any additional top-level methodology config keys instead of whitelisting
only the currently known keys. The listed keys are the minimum required v3+ contract.

The exported multiple-choice question settings must preserve:

- `methodologyQuestionId`
- `maxChoices`
- `pointsPerAnswer`
- `directionMap`

The exported multiple-choice option `value` must preserve methodology answer ids such as `Q1_A1`.
Scoring maps saved answers through these values.

The exported slider question settings must preserve:

- `methodologySliderId`
- `sliderKind`
- `direction`, when present
- `weights`, when present
- `min`
- `max`
- `step`

`sliderBands` must also be preserved for display and scale interpretation.

The prompt snapshot must preserve `outputSchema`. v3+ enrichment uses a methodology-specific schema,
not the default analysis schema.

The implementation should ensure deterministic v3+ scoring reads the imported version's
`scoringConfig`. Otherwise a successfully imported methodology snapshot could still be scored using
the application's bundled fixture, which would make the exported config misleading.

## Backend Design

Add a focused service in the tests module, for example:

- `server/src/tests/tests-import-export.service.ts`

Responsibilities:

- Build an export snapshot from `activePublishedVersion`.
- Validate import payload shape.
- Create the imported topic, imported draft questions, and imported prompt in one transaction.
- Keep import/export mapping logic out of controllers and out of the existing large
  `TestsService`.

Add DTO/schema definitions in the tests DTO area:

- `server/src/tests/dto/tests-import-export.dto.ts`

Controller routes:

- `GET /admin/tests/:topicId/export`
- `POST /admin/tests/import`

Export route behavior:

- Requires admin access through the same guard/access rules as other admin test endpoints.
- Fails with a clear `BadRequestException` when the topic has no active published version.
- Returns `application/json` with `Content-Disposition` attachment filename based on the topic slug
  and published version number.

Import route behavior:

- Requires admin access.
- Accepts JSON body only.
- Requires `schemaVersion = 1` and `kind = "ai-template.test-topic-export"`.
- Creates a unique slug from the imported title or source slug using existing slug normalization and
  uniqueness helpers.
- Creates a new topic and draft version.
- Creates imported questions using the same persistence path as existing transactional creation.
- Creates a new prompt and a published version when `analysisPrompt` is present.
- Attaches the new prompt version id to the imported draft.
- Returns `TestsTopicDetailResponseDto` for the new draft.
- Ensures v3+ deterministic scoring uses the topic version `scoringConfig` when present and valid.

## Frontend Design

Add UI in the existing admin tests workspace:

- Add an `Import JSON` action in the tests list toolbar.
- Add per-topic `Export` action for active list cards that have a published version.
- Disable or hide export for topics without a published version and show copy that the test must be
  published first.
- After successful import, refetch tests and navigate to the new draft detail page.
- Use the existing blob download pattern used by analytics export.

Import UX:

- Use a hidden file input or a compact modal to select a `.json` file.
- Parse the file in the browser only enough to send JSON to the backend.
- Let backend validation be authoritative.
- Show clear errors for invalid JSON, unsupported schema version, invalid file kind, and failed
  backend validation.

## Error Handling

Backend errors should use the repository unified error format through existing exception handling.

Expected user-facing cases:

- Topic not found.
- Topic has no published version.
- Uploaded JSON has unsupported `schemaVersion`.
- Uploaded JSON has unsupported `kind`.
- Uploaded JSON fails DTO validation.
- v3+ payload is incomplete, for example missing `scoringConfig`, `methodologyQuestionId`,
  `directionMap`, `methodologySliderId`, or required slider settings.
- v3+ payload has the wrong methodology shape, for example not 10 multiple-choice questions plus
  11 sliders, missing one of `A1`, `A2`, `A3`, `B1`, `B2`, `B3`, duplicate question order,
  fewer than two options for a choice question, or invalid slider/band ranges.

## Verification

Backend targeted tests:

- Export rejects a topic without `activePublishedVersion`.
- Export of a default published test includes questions, options, slider bands, scoring fields, and
  prompt snapshot.
- Export of a v3+ published test includes the full `scoringConfig`, methodology question settings,
  methodology answer values, slider settings, readiness weights, and prompt `outputSchema`.
- Import of a default export creates a new topic draft and does not publish it.
- Import of a v3+ export creates a new topic draft with `scoringKind =
"PROF_ORIENTATION_V3_PLUS"`, full scoring config, question settings, options, slider bands, and a
  new published prompt version.
- Import validation rejects v3+ payloads with the wrong `10 MULTI_CHOICE + 11 SLIDER` shape,
  missing methodology direction ids, duplicate question order, invalid choice option counts, or
  invalid slider settings/bands.
- v3+ scoring uses the stored imported `scoringConfig` instead of only the built-in fixture.
- Import does not reuse existing prompts.
- DTO tests reject unsupported schema versions and missing required v3+ fields.

Frontend targeted tests:

- The list toolbar can trigger JSON import.
- Export action is unavailable for topics with no published version.
- Export action calls the generated binary/json endpoint and downloads a `.json` file.
- Successful import refetches test data and navigates to the imported draft.

Repository verification:

```powershell
npm run gen:api
docker compose up -d --build --force-recreate frontend
npm run verify:local
```

Run `npm run verify:template` before final branch completion.

## Open Questions

- None. The agreed behavior is: published-version export, new-test import, new prompt creation,
  imported draft for review, JSON file format.
