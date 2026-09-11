# Public links and statistics contract

Routes and ownership:

- `"/admin/public-links"` -> link lifecycle workspace
- `"/admin/public-links/stats"` -> dedicated statistics workspace
- Admin shell navigation must keep links/stats as separate menu entries.

Behavior baseline:

1. Public link lifecycle is `create/regenerate/archive/restore`.
2. Archive must disable student access without deleting historical attempts/results.
3. Stats page is table-first (avoid oversized decorative summary blocks above core filters/table).
4. Filters must support both test and public link selection.
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
