### Task 5: Add personal-data mode to public-link admin creation

**Files:**

- Modify existing form state/types/helpers/actions/components under `client/src/widgets/admin-public-links-workspace/ui/` only as needed.
- Extend existing tests; do not introduce a new page or broad redesign.
- Generated API/model files are read-only inputs.

**Exact behavior:**

- New link form defaults `personalDataProcessingMode` to `PUBLIC`.
- Present two clear radio/select choices in Russian:
  - platform/public operator;
  - processing on behalf of an education organization.
- Explain the consequence: the selected operator and document links are snapshotted when the link is saved.
- PUBLIC keeps the existing education-organization selector optional for participant profile/group validation. Copy must make clear that this optional selection does not change the personal-data operator.
- ON_BEHALF requires a selected active organization with server `personalDataReady === true`. Client validation blocks submission with a clear Russian message otherwise.
- Organization options/list visually expose ready/incomplete status using the server flag. Do not recompute readiness client-side.
- Existing inline quick-create only creates a basic/incomplete organization; retain it, but clearly warn/direct the admin to complete legal fields in “Учебные заведения” before it can be selected as operator. Do not duplicate the full legal form inline.
- Submit payload includes `personalDataProcessingMode` and the selected `educationOrganizationId`; preserve all existing link fields, consent fields, branding, and profile validation behavior.
- Existing form reset restores PUBLIC mode.
- Use existing UI primitives and accessible labels/fieldset/legend; no dependency.

**TDD:**

1. Add failing helper/form-state/action/component tests for default/reset, validation, payload, and ready/incomplete display.
2. Rebuild frontend container before running RED after test changes.
3. Implement minimal changes.
4. Rebuild frontend container again after production changes.
5. Run the narrow admin-public-links Vitest suite plus client build/typecheck, targeted ESLint, Prettier, and diff check.

**Required rebuild:** `docker compose up -d --build --force-recreate frontend` before every frontend-related verification after client changes.

**Global constraints:** `main`; no commit/stage; no generated-client hand edits; no new route/page/role/entity/dependency; preserve unrelated worktree changes.

**Report:** `.superpowers/sdd/task-5-report.md` with RED/GREEN/rebuild/build evidence and concerns.
