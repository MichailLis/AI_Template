### Task 4: Extend education-organization admin UI

**Prerequisite complete:** OpenAPI and Orval client have been regenerated from the backend contract.

**Files:**

- Modify the existing files under `client/src/widgets/admin-education-organizations-workspace/ui/` only as needed.
- Prefer one focused shared component `education-organization-operator-fields.tsx` reused by create and edit forms.
- Add/modify colocated Vitest tests for helpers/forms/list.
- Generated files are inputs, not hand-edited.

**Exact behavior:**

- Admin can create and edit all ten nullable fields: fullName, shortName, inn, ogrn, legalAddress, email, phone, privacyPolicyUrl, consentDocumentUrl, logoUrl.
- Keep existing `name`, group/class validation, active state, pagination, and two-column workspace behavior intact.
- Empty optional inputs serialize to `null` (or are omitted only where the existing update semantics intentionally preserve a value); editor initialization faithfully maps server values.
- Group the new fields clearly: operator identity, contacts/requisites, public documents/branding. Use existing UI primitives and visual language; no new dependency or page.
- List/editor surfaces use server `personalDataReady`; show a concise ready/incomplete status. Do not duplicate the readiness formula in frontend business logic.
- Add a visible explanation that an incomplete/inactive organization cannot be used for processing on its behalf.
- URLs should use appropriate URL inputs; email/phone remain plain optional inputs consistent with backend contract.
- Preserve accessibility: associated labels, no placeholder-only labels, sensible field grouping.

**TDD:**

1. Add failing mapping/payload/readiness/render tests and run the narrow suite (RED).
2. Implement the smallest reusable component/helper changes.
3. Run GREEN for all tests under the education-organization workspace.
4. Do not run frontend tests until the required root command has completed after client changes:
   `docker compose up -d --build --force-recreate frontend`
5. Then run the targeted Vitest suite, client TypeScript/build as appropriate, Prettier/diff check.

**Global constraints:** `main`; no commit/stage; preserve unrelated dirty changes; no new dependency/route/module; do not hand-edit generated client; no redesign beyond the requested grouped fields/readiness.

**Report:** `.superpowers/sdd/task-4-report.md` with RED/GREEN/container rebuild evidence and concerns.
