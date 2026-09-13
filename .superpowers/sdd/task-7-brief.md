### Task 7: Integration hardening and acceptance fixtures

**Owned changes:**

- Refactor only the newly added personal-data tests out of `server/src/tests/tests-public-session.service.spec.ts` into a focused new spec so the original file returns below the 900-line maintainability limit. Do not weaken/remove assertions or change production behavior.
- Extend `server/test/tests-public-session.e2e-spec.ts` minimally to assert the default PUBLIC access response contains the exact platform `personalData`, and a started attempt persists null operator FK plus platform snapshots. Use existing lifecycle setup; do not build a large second harness unless necessary.
- Update `scripts/e2e-critical-flows.mjs` mock public-link response with required `personalData` and explicitly check the consent checkbox before clicking Start.
- Update fixtures only where directly required.

**Verification:**

- Targeted/new Jest specs.
- Full server unit suite and server E2E suite.
- `npm run verify:maintainability`: the session spec must no longer be a violation; pre-existing unrelated result-workspace test/CSS violations may remain and must be reported accurately.
- Script syntax/static verification if a dedicated critical-flow run is unavailable.
- Prettier and `git diff --check` on owned files.

**Do not change:**

- Existing unrelated architecture manifest/privacy-page violations.
- Unrelated failing client test `public-links-attempt-detail-dialog.test.tsx`.
- Production code unless a new focused test reveals an actual task regression.
- No generated hand edits, commit, or stage.

**Report:** `.superpowers/sdd/task-7-report.md` with exact results and remaining baseline failures.
