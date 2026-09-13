### Task 3: Return operator metadata publicly and snapshot it on attempts

**Files:**

- Modify: `server/src/tests/tests-public-link.service.ts`
- Modify: `server/src/tests/tests-public-link.service.spec.ts`
- Modify: `server/src/tests/tests-public-session.service.ts`
- Modify: `server/src/tests/tests-public-session.service.spec.ts`
- Modify: `server/src/tests/tests.spec-fixtures.ts`
- Modify only if needed for safe typed access: `server/src/tests/tests-public-link.query.ts`

**Exact behavior:**

- `getPublicLinkAccessByCode` must always return required `personalData`:
  - `processingMode` from the stored link mode;
  - full/short operator names and privacy/consent document URLs from the stored link snapshots, never recomputed from mutable organization legal fields;
  - PUBLIC legacy fallback must be the exact platform operator plus `/privacy` if a legacy/incomplete row somehow lacks snapshots;
  - `logoUrl` is null for PUBLIC; for on-behalf mode it may be read live from the linked EducationOrganization because the requested schema does not snapshot logo.
- Public access must not expose INN, OGRN, legal address, email, or phone.
- Starting a new attempt copies `operatorEducationOrganizationId` only for on-behalf mode plus all four stored operator snapshots from the link. For PUBLIC, operator FK is null and platform snapshots are copied.
- Resuming an existing attempt must not rewrite any operator snapshots.
- Preserve existing `consentAccepted: true` enforcement, link consent snapshots, and active global policy version/date snapshots.
- Update typed fixtures minimally.
- This task must close the temporary server build gap introduced by required `personalData`.

**TDD:**

1. Add failing public-access/new-attempt/resume tests first and run RED.
2. Implement minimal mapping/copy logic.
3. Run GREEN:
   `npm test --prefix server -- --runInBand src/tests/tests-public-link.service.spec.ts src/tests/tests-public-session.service.spec.ts`
4. Run `npm run build --prefix server`, Prettier check for owned files, and `git diff --check`.

**Global constraints:** work on `main`; no commit/stage; no schema/DTO/frontend/generated-client edits; preserve unrelated worktree changes; no global privacy-policy text rewrite.

**Report:** write `.superpowers/sdd/task-3-report.md` with RED/GREEN/build evidence and concerns.
