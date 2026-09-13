### Task 2: Resolve and snapshot the operator in backend services

**Classification:** `existing-feature-change`, owner `tests`, no manifest impact, no Nest generator.

**Files:**

- Create: `server/src/tests/tests-personal-data-operator.ts`
- Create: `server/src/tests/tests-personal-data-operator.spec.ts`
- Modify: `server/src/tests/tests-education-organization.service.ts`
- Modify: `server/src/tests/tests-education-organization.service.spec.ts`
- Modify: `server/src/tests/tests-public-link.query.ts`
- Modify: `server/src/tests/tests-public-link.mapper.ts`
- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`
- Modify only if required for typed fixtures: `server/src/tests/tests.spec-fixtures.ts`

**Exact behavior:**

- Add one local, simple resolver/helper boundary for `PersonalDataProcessingMode`; do not add a registry, module, JSON snapshot, dependency, role, or new organization entity.
- PUBLIC resolves to:
  - full name: `АНО «Центр развития компьютерного спорта и цифровых технологий»`
  - short name: null
  - privacy URL: `/privacy`
  - consent URL: null
  - operator organization ID: null
  - logo URL: null
- ON_BEHALF requires a linked existing active EducationOrganization with nonblank `fullName`, `shortName`, and `privacyPolicyUrl`. Reject inactive/missing/incomplete organizations with clear Russian BadRequest/NotFound errors. `consentDocumentUrl` and `logoUrl` remain optional.
- Education organization create/update/list must trim, persist, and map all ten nullable legal/contact/document fields. Preserve omitted update fields and existing group validation behavior.
- `personalDataReady` is computed server-side from active + nonblank fullName + nonblank shortName + nonblank privacyPolicyUrl.
- Public-link create defaults to PUBLIC and writes mode plus all four operator snapshot columns atomically. PUBLIC may retain educationOrganizationId for entry-profile locking, but it is not the operator.
- Public-link update must load existing mode, organization ID, and snapshots. Refresh operator snapshots only when `personalDataProcessingMode` or `educationOrganizationId` changes. Unrelated updates preserve stored snapshots. Switching to PUBLIC writes platform snapshots; switching/changing to on-behalf resolves the selected/effective organization.
- Admin link mapping returns mode and the four nullable snapshots already required by the DTO.
- Add needed organization selects to query includes, without exposing unsafe fields publicly.
- Do not implement public `personalData` response or attempt snapshot copying here; Task 3 owns those. The temporary build gap is accepted.

**TDD:**

1. Add failing resolver, organization service, mapper/link service tests.
2. Run RED and record expected contract failures.
3. Implement the minimal behavior above.
4. Run GREEN:
   `npm test --prefix server -- --runInBand src/tests/tests-personal-data-operator.spec.ts src/tests/tests-education-organization.service.spec.ts src/tests/tests-public-link.service.spec.ts`
5. Run Prettier check and `git diff --check` for owned files.

**Global constraints:** work on `main`; no commit/stage; preserve unrelated dirty-worktree changes; no global privacy-policy legal text rewrite; no generated client edits; use exact requested platform operator constant.

**Report:** write `.superpowers/sdd/task-2-report.md` with RED/GREEN evidence, changed files, and concerns.
