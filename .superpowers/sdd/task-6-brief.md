### Task 6: Render the operator and operator-specific consent on `/t/:code`

**Files:**

- Create `client/src/widgets/public-test-workspace/ui/public-personal-data-operator.tsx` and test.
- Modify `public-privacy-consent.tsx` and its test.
- Modify STANDARD registration/demographic entry cards and workspace wiring as needed.
- Modify POLUS entry wiring as needed.
- Extend existing public entry tests/fixtures minimally.
- Generated models are read-only inputs.

**Exact behavior:**

- The entry page always renders a persistent (not modal-only) operator block for both STANDARD and POLUS before test start.
- PUBLIC copy identifies the platform as operator using `personalData.operatorFullName` and links to `personalData.privacyPolicyUrl` (`/privacy`).
- ON_BEHALF copy explicitly says testing/data processing is performed on behalf of the education organization and shows the snapshotted full name; show short name when useful without replacing the full legal name.
- If `logoUrl` is present, render it with meaningful alt text and non-dominant sizing; omit cleanly when null.
- `PublicPrivacyConsent` receives generated `personalData` and uses its privacy-policy URL. Render a separate consent-document link only when `consentDocumentUrl` is non-null.
- External HTTP(S) organization document links open safely (`target="_blank"` with `rel="noreferrer"` or existing safe-link convention); local `/privacy` remains a normal same-tab route.
- Consent remains an explicit required checkbox. Preserve the existing unchecked-submit block and `consentAccepted: true` submit contract.
- Do not fall back to platform documents in on-behalf mode; the API contract already supplies the snapshotted organization URLs.
- Do not expose INN/OGRN/address/contact fields and do not add a popup, route, global CSS token, or dependency.
- Keep existing public theming and layout; the operator block should be calm, readable, and visibly present.

**TDD:**

1. Add failing operator/consent/entry tests for PUBLIC, on-behalf, optional consent document, logo/null logo, STANDARD and POLUS wiring, and unchecked consent.
2. Mandatory root frontend rebuild before RED verification after test changes.
3. Implement minimal shared component/wiring.
4. Mandatory root frontend rebuild after production changes.
5. Run narrow public-test workspace tests, client build/typecheck, targeted ESLint, Prettier, and diff check.

**Required rebuild:** `docker compose up -d --build --force-recreate frontend` before each frontend verification after client changes.

**Global constraints:** `main`; no commit/stage; no generated hand edits; preserve unrelated dirty changes; no global privacy-policy legal text rewrite.

**Report:** `.superpowers/sdd/task-6-report.md` with RED/GREEN/rebuild/build evidence and concerns.
