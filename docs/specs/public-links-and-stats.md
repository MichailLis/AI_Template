# Public links and statistics contract

Routes and ownership:

- `"/admin/public-links"` -> link lifecycle workspace
- `"/admin/analytics"` -> analytics workspace with two tabs over one link selection: the summary
  report (default) and the attempts table (`?tab=attempts`)
- `"/admin/public-links/stats"` -> legacy entry point; redirects to `/admin/analytics?tab=attempts`
- Admin shell navigation must keep link management and analytics as separate menu entries, and
  must not split the analytics tabs into separate menu entries.

Behavior baseline:

1. Public link lifecycle is `create/regenerate/archive/restore`.
   A link is bound to one test version and does not follow later publications by itself. The links
   list shows that version, and `POST /admin/tests/public-links/:linkId/move-to-active-version` moves
   the link to the currently published version of its test (`400` when the test has no published
   version, `404` for an archived link). Attempts already started keep finishing on their own version.
   The move is written to the audit journal as `PUBLIC_LINK_MOVED_TO_ACTIVE_VERSION`.
2. Archive must disable student access without deleting historical attempts/results.
3. The attempts tab is table-first (avoid oversized decorative summary blocks above core
   filters/table). Above the table sit a search box (student name, education organization,
   group or class, residence) and a status filter. Its table stays narrow enough to read without
   horizontal scrolling at 1440px: attempt number with id, attempt status, analysis status,
   student, result (leading direction and profile), start time with the duration under it
   (`за 7 мин 06 с`, `идёт` while the attempt is open), and row actions. Exact completion and
   expiry timestamps belong to the attempt card, not to the table.
   Search, status filter and sorting (attempt number, student name, start time) run on the server
   (`GET /admin/tests/public-links/:linkId/attempts?search=&status=&sortBy=&sortOrder=`) and apply
   to the whole list, not to the visible page. The status filter follows the derived status shown
   in the table: an attempt with `finishedAt` is completed, an open attempt past `expiresAt` is
   expired. The list header counts all attempts, unfinished ones included.
   The toolbar also has an `Выгрузить XLSX` button: it downloads the list with the same search,
   status and sorting as the table, without paging, from
   `GET /admin/tests/public-links/:linkId/attempts/export.xlsx` (admin only, at most 5000 rows).
   The file has one row per attempt: student profile, status, start, finish, duration, leading
   direction, profile, analysis and AI status. Student-entered text that starts with `=`, `+`,
   `-` or `@` is written with a leading apostrophe so a spreadsheet does not run it as a formula.
4. Filters must support both test and public link selection, and one selection must serve both
   analytics tabs.
5. Link labels in selectors should use business copy (`тестов пройдено`).
6. Student row actions must provide direct access to analysis and answers.
7. Public links have a public template:
   - `STANDARD` -> current public template; default for existing rows and new links unless explicitly changed.
   - `POLUS` -> branded Polus public template; selected during public-link creation only.
8. Public link DTOs and responses must expose `publicTemplate` through admin link lists, public link access, session state, and result fetches without changing `/t/*` routes.
9. Public links have an entry profile mode:
   - `DEMOGRAPHIC` -> collect gender, age, residence, and education level before the test; force `maxAttemptsPerStudent = 1`.
   - `EDUCATION` -> collect the current education-based profile before the test.
   - `EDUCATION_DEMOGRAPHIC` -> collect education fields plus the demographic questionnaire before the test; use education attempt/resume behavior.
10. Stats tables and attempt details must display the correct profile type without assuming education fields are always present.
11. Admin attempt lists, analytics attempt rows, and the analytics CSV export must carry
    `llmStatus` next to `analysisStatus`. `analysisStatus` reports the algorithmic analysis
    record and reads `READY` for prof-orientation attempts whose LLM phase is still pending,
    has failed, or was never requested, so any filter, badge, or monitoring that means "the
    AI finished" must read `llmStatus` (`not_requested` / `pending` / `ready` / `failed`,
    or `null` when the analysis has no separate LLM phase).

---

Extracted from `AI_GUIDE.md`. The template-wide rules stay there; this file covers only the
product contract. Read it when working on `/admin/public-links` or its statistics workspace.
