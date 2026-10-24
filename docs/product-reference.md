# Product reference

Moved out of the README: how the admin panel, auth, Prompt Studio, tests and the public student flow behave.

## Access and UI notes

- The app exposes `/login`, the `/privacy` policy page, the public student flow under `/t/*`, and a protected admin workspace under `/admin`.
- `/admin` redirects to `/admin/tests`; there is no separate mock dashboard/overview page.
- There is no public signup. Admins create accounts on `/admin/users` (`POST /admin/users`); the
  first admin comes from the seed (`npm run prisma:seed`) locally, and from
  `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` in the deploy image, whose entrypoint runs
  the bootstrap script. The root compose stack does not pass those variables to the backend.
- Admin UI copy for active business screens is currently Russian-localized for manual QA convenience.
- The admin has a light, dark and system theme, switched in the header (the choice is kept in the
  browser through `safeStorage`; "system" follows `prefers-color-scheme`). The `dark` class is set on
  `<html>` only while the admin shell is mounted, so the public `/t/*` pages always stay light.

## Auth Session Contract

- `POST /auth/signin` returns `accessToken` and `user` (including `role`) in the JSON body. A
  deactivated account is rejected with `403 Account is deactivated`.
- The refresh token is set only as an `HttpOnly` cookie named `refreshToken`.
- `POST /auth/refresh` reads the refresh cookie and returns a new `accessToken`; it does not return a refresh token in the response body.
- Browser refresh handling lives in `client/src/shared/api/interceptors.ts`; generated API code and `client/src/shared/api/api.ts` must not read browser storage directly.

## Prompt Studio (AI Provider Foundation)

Prompt Studio is available at `"/admin/prompts"` and currently includes:

- model catalog loaded from the configured AI provider (`all/free/paid` filter + search)
- safe default to free models when available
- prompt editor with line numbers
- editable test variables (add/remove) with duplicate-key validation
- prompt simulation area with test source selector, selected question preview, run history, metrics, and JSON view
- response format switch (`text` / `json`)
- strict structured JSON support for generation (`response_format: json_schema`) when schema is provided
- OpenRouter only: provider parameter strictness (`provider.require_parameters`) and the response-healing plugin

Required backend environment variables:

- Local host development: copy `server/.env.example` to `server/.env`.
- Root Docker Compose: copy `.env.example` to `.env` or export the variables in the shell.

The backend calls any OpenAI-compatible API through the official `openai` SDK. Polza.ai is the
default; OpenRouter and any other service are selected in the admin panel (`/admin/settings`:
provider, base URL, API key, model; the key is stored encrypted) or, as the initial/fallback
configuration, by the env variables below (see `AI_GUIDE.md`, "AI Provider Configuration").

```env
AI_API_KEY=
# optional
AI_PROVIDER=polza            # polza | openrouter | openai-compatible
AI_BASE_URL=                 # required for openai-compatible, e.g. https://api.openai.com/v1
AI_DEFAULT_MODEL="openai/gpt-4o-mini"
AI_TIMEOUT_MS=120000
AI_PROF_ORIENTATION_TIMEOUT_MS=90000
AI_PROF_ORIENTATION_TIMEOUT_RETRIES=2
OPENROUTER_HTTP_REFERER="http://localhost:5173"   # OpenRouter only
OPENROUTER_APP_NAME="AI Template Admin"           # OpenRouter only
```

Security note:

- Never expose the AI provider API key in frontend code.
- If a real AI provider key is ever printed, committed, or shared through `docker compose config`, rotate it at the provider before reuse.
- All AI provider requests must go through backend (`/admin/prompts/*`).

## Tests Module (Draft/Publish Baseline)

Tests workspace is available at `"/admin/tests"` and currently includes:

- topic management with slug + description
- topic deletion with confirmation (removes topic versions/questions cascade)
- version model with one active draft and optional published snapshot
- draft editor with question CRUD
- question types: `OPEN_TEXT`, `SINGLE_CHOICE`, `MULTI_CHOICE`, `SLIDER`
- publish flow: current draft -> published, then auto-create next draft copy
- drag-and-drop reorder with backend validation and user-facing recovery messaging
- AI-assisted test creation modal (generate questions -> preview -> transactional create)
- built-in prof-orientation v3+ import for the Polus template
  (`POST /admin/tests/methodologies/prof-orientation-v3-plus/import`)
- analytics report page at `"/admin/analytics"` with filters and XLSX/PDF export

Current UX baseline for question editing:

- add/edit question via modal (avoids long inline page growth)
- choice options are edited with structured rows (text + integer weight), no manual service code input
- slider scale is edited with dedicated `min`, `max`, and `step` fields
- slider bands are edited with structured rows (`min`, `max`, `label`, `weight`) and must stay inside the scale
- slider range validation rejects invalid ranges such as `max <= min` or values outside the scale
- optional JSON settings stay separate from core slider scale fields and are hidden under "Advanced settings"
- test list cards in sidebar handle long titles/slugs with safe wrapping

AI generation safety rules in tests workspace:

- model picker shows only models that advertise structured output support (`response_format`; OpenRouter also `structured_outputs`)
- generation requests use strict JSON schema (`responseSchema.strict=true`) to constrain allowed question types
- requests do not use the web-search plugin (`web`) or `:online` model variants

Domain constraints currently applied:

- no branching configurator yet
- no parallel drafts
- weights are `Int`

Built-in prof-orientation v3+ contract:

- runtime uses the committed fixture under
  `server/src/tests/prof-orientation-v3-plus/site-config.json`, not the external
  source package
- each import creates a new draft topic with a unique slug/title and
  `scoringKind = PROF_ORIENTATION_V3_PLUS`
- the imported draft contains 10 multi-choice methodology questions and 11 slider
  questions
- LLM enrichment uses the analysis prompt version selected on the test topic; the built-in
  prompt is seeded with `deepseek/deepseek-v4-flash` only when no published built-in prompt
  version exists yet
- public multi-choice questions enforce `settings.maxChoices = 2`
- `finishSession` saves deterministic algorithm analysis first, then runs optional
  LLM enrichment under `summary.llm`
- LLM enrichment may explain and expand result blocks, but must not change the
  deterministic primary direction, scores, confidence, profile type, or
  professions
- prof-orientation AI provider calls use a longer timeout by default and retry only
  timeout failures; see `docs/2026-05-19-prof-orientation-v3-plus.md`
- every AI provider call additionally retries provider overload (HTTP 429/502/503/504) twice, after 2 s and 5 s;
  other errors, including timeouts, are not retried there. A failed background analysis is written to the server log

Analytics report contract:

- summary endpoint: `GET /admin/tests/topics/:topicId/analytics/summary`
- export endpoints: `GET /admin/tests/topics/:topicId/analytics/export.xlsx` and
  `GET /admin/tests/topics/:topicId/analytics/export.pdf`
- filters include scope, public link, link status, and date range
- time zone: the browser sends its IANA zone as `timeZone` (analytics summary, both exports and the
  attempts export). The server takes `dateFrom`/`dateTo` as whole local days in that zone, writes
  start/finish in XLSX as local wall-clock time, and prints the PDF "generated" line and the analytics
  attempts sheet in that zone. Missing or unknown zone means UTC. The resolved zone is returned as
  `filters.timeZone` and listed in the report parameters
- attempts list for one public link: `GET /admin/tests/public-links/:linkId/attempts` with
  `page`, `limit`, `search`, `status` (`IN_PROGRESS|COMPLETED|EXPIRED|ABANDONED`), `sortBy`
  (`startedAt|attemptNumber|studentName|finishedAt`) and `sortOrder`; each item carries
  `durationSeconds` (null until finished) and `resultSummary` (leading direction and profile, or null)
- attempts export for one public link: `GET /admin/tests/public-links/:linkId/attempts/export.xlsx`
  takes the same `search`, `status`, `sortBy`, `sortOrder` as the list, ignores paging and returns
  up to 5000 rows
- XLSX/PDF exports are binary responses generated by the backend; the frontend downloads them from the analytics workspace

## Public Links and Student Flow

Admin routes:

- `"/admin/public-links"`: create/manage public links for tests
- `"/admin/public-links/organizations"`: education organizations used by public links
- `"/admin/analytics"`: analytics workspace with the attempts table and the summary report
- `"/admin/public-links/stats"`: legacy entry point; redirects to `/admin/analytics?tab=attempts`

Admin capabilities baseline:

- archive/restore lifecycle for public links (archive disables access without losing historical data)
- public template selection for new public links:
  - `STANDARD`: current public template and the default for old and new links
  - `POLUS`: branded Polus public template
- `STANDARD` public links can be customized with the branding constructor:
  - background: default, solid color, or HTTPS image URL with overlay
  - up to two HTTPS header logos with alt text and size
  - primary button colors, card/surface colors, and accent color
  - "Reset to standard" clears `publicBranding`
  - the constructor is not shown for `POLUS` links
- entry profile mode selection for new public links:
  - `DEMOGRAPHIC`: demographic profile before the test, with attempt limit forced to `1`
  - `EDUCATION`: current education-based profile before the test
  - `EDUCATION_DEMOGRAPHIC`: education profile plus demographic questionnaire before the test
- filters by test + public link in the analytics workspace
- table actions for student-level details (analysis and submitted answers)
- link selector copy uses business language (`тестов пройдено`)

Admin settings:

- `/admin/settings` shows the AI provider, its address, key status and a live connection check from backend-only configuration.
- `/admin/settings` also manages the optional profession atlas URL. The page opens without waiting for the atlas: its coverage report (`GET /admin/settings/profession-atlas/coverage`, professions searched in batches of 4) loads as a separate request and fills in the header badge and the coverage panel.
- When configured, public and admin attempt result views can show the profession atlas link for prof-orientation results.

Public student routes:

- `"/t/:code"`: registration/entry screen, branched by public link template and entry profile mode
- `"/t/:code/session/:sessionToken"`: test run workspace, branched by public link template
- `"/t/:code/result/:sessionToken"`: result and analysis screen, branched by public link template

Public session/result URL security model:

- `sessionToken` works as a bearer-style link token: anyone with the URL can open the
  active session or final result while the session/link remains valid.
- Do not log or share these URLs outside the student-facing flow.
- Public result responses expose only student-safe analysis fields: status, provider mode,
  generated timestamp, safe summary, and user-facing error text.
- Raw provider output, prompts, scoring internals, and debug data remain admin/internal only.

Entry profile modes:

- `DEMOGRAPHIC`: collects gender, age, residence, and education level before starting the test
- `EDUCATION`: collects the current education-based profile before starting the test
- `EDUCATION_DEMOGRAPHIC`: collects student name, surname initial, patronymic initial, age, education organization, group/class, gender, residence, and education level in Polus hybrid entry

Education organizations (`/admin/public-links/organizations`):

- the group/class pattern (`groupValidationPattern`) is an admin-written RegExp that runs on the
  server and in the student's browser, so it is checked on save: it must compile, be at most
  300 characters and contain no nested unbounded repeats such as `(a+)+` (`isSafeGroupPattern`,
  server authoritative, paired with a client copy). A stored dangerous pattern is not executed:
  `matchesGroupPattern` treats it like a broken one and lets the value through. Known limit:
  overlapping alternations such as `(a|aa)+` are not detected.
- the example (`groupValidationExample`) must match the pattern. The server checks it only when an
  edit touches the pattern or the example, so a stored mismatch does not block unrelated edits.
- INN (10 or 12 digits) and OGRN (13 digits, 15 for individual entrepreneurs) are format-checked
  without checksums. The server checks only values an edit changes; the admin form checks what it
  shows, so a stored malformed value is flagged in the form until fixed or cleared.
- a link in `ON_BEHALF_OF_EDUCATION_ORGANIZATION` mode stores a snapshot of the operator
  (`operator*Snapshot`) and students see that snapshot. Editing the full or short name, the policy
  or the consent document URL (or reactivating the organization) recomputes the snapshot of all
  non-archived on-behalf links of the organization in the same transaction. If the edit would leave
  the operator incomplete (no name or policy URL) while such links exist, the server answers 409.
  Attempts keep their own snapshot: it records what the student agreed to. `PUBLIC` links follow the
  platform operator from the privacy-policy settings instead.

Current public run UX:

- the run screen uses a centered question card with compact progress (`current / total` + percent)
- single-choice questions auto-advance after selection
- multi-choice, slider, and open-text questions use in-card navigation controls
- answers autosave after a short debounce; manual save and finish wait for queued/in-flight autosave before continuing
- autosave shows human-readable student copy for saving, saved, retry, and error states, not raw API internals
- question transitions are animated to reduce abrupt content jumps
- open-text answers use a higher-contrast textarea for bright screens
- slider questions show the current value with the matching label and avoid duplicate range numbers in helper copy
- Polus prof-orientation processing uses the Professor Polus thinking animation
  while LLM enrichment is pending

UI/theming contract for public pages:

- public pages must be wrapped with `PublicThemeLayout`
- public theme tokens live in `client/src/features/tests/ui/public-theme.css` (`.theme-public` scope)
- do not move public-theme tokens into global `client/src/app/index.css`
- `STANDARD` must preserve the existing public components and remains the default unless a link explicitly stores `publicTemplate = POLUS`
- `STANDARD` may apply `publicBranding` from the public link through `PublicThemeLayout`; empty branding keeps the default look
- `POLUS` public shell components live under `client/src/widgets/public-test-workspace/ui/polus/*`; shared Polus result rendering, styles, and assets live under `client/src/features/tests/ui/polus/*`
- Polus styles must stay scoped through the Polus variant of `PublicThemeLayout`; Polus ignores the `STANDARD` branding config, and assets/fonts belong in the Polus public-test asset folder, not `client/public/prototypes`
- user-facing statuses must stay human-readable (`готов`, `в обработке`, `ошибка`) and avoid raw technical states in UI (for example `IN_PROGRESS` badge)
- Detailed public branding/autosave/analytics/settings update: `docs/2026-05-27-public-test-branding-and-autosave.md`

## Database Backups

Admins manage backups in `/admin/settings`, tab «Резервные копии»:

- **Create and download:** a full `pg_dump -Fc` copy runs in the background; the file downloads through a one-time link.
- **Schedule and retention:** a daily copy at 03:00 UTC by default; the hour, retention days and copy count are editable. The latest successful copy is never pruned.
- **Restore with undo:** restores into a temporary database, checks it (schema not newer than the app, an active admin exists), then swaps databases by rename. The API answers 503 during the swap and everyone signs in again afterwards. The replaced database is kept until the next restore, so the restore can be undone; the undo runs the same check first and brings the old database up to the current schema with migrations.
- **Upload:** an existing `.dump` from this or another server can be uploaded (500 MB by default) and restored the same way.
- **Disk space:** the tab shows free space and warns when it fits fewer than three copies; a scheduled copy skipped for lack of space shows up as a failed entry.

Copies, their metadata, schedule settings and restore state live in the `/backups` volume of the
backend container, not in the database, so a restore does not roll them back. The volume sits on
the same disk as the database: download copies to keep one off the server. Every action goes to
the audit log. Deployment details (image, volume, env vars, nginx limits, manual restore) are in
[`docs/deployment-dockerhub.md`](deployment-dockerhub.md), section 11; the design and its
risks are in [`docs/plans/2026-10-08-admin-db-backup-plan.md`](plans/2026-10-08-admin-db-backup-plan.md).
