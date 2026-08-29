# Global Privacy Policy Publication Design

Date: 2026-07-09
Status: Approved for implementation planning

## Context

The public test flow collects personal data before a student starts a test. The application already has a per-public-link consent model: public links store `consentVersion` and `consentTextSnapshot`, and student attempts store `consentAcceptedAt`, `consentVersion`, and `consentTextSnapshot`.

That does not fully solve the compliance issue because the site does not expose a globally available privacy policy page, and the current public entry UI does not visibly present the consent checkbox even though the frontend submit logic expects `consentAccepted`. The provided `Politika.docx` should seed the policy content, but it also contains an internal order appointing a responsible person; the public page should publish the policy text itself, not necessarily every internal administrative attachment.

## Goals

- Publish one global privacy policy for the whole site at a stable public URL.
- Make the policy text editable by admins without rebuilding the frontend.
- Show a persistent footer link to the policy on public-facing pages.
- Require an explicit checkbox before starting a public test.
- Store enough consent evidence on each attempt to identify which policy version was active.
- Keep the first implementation small and compatible with the existing `AppSetting` table and admin settings area.

## Non-Goals

- Full legal document generation or legal review.
- Per-organization or per-public-link privacy policies.
- Rich document version history, diffing, approvals, or scheduled publication.
- Cookie consent management. The current issue is personal-data policy publication and consent around test start.

## Recommended Approach

Use a single global privacy-policy setting backed by `AppSetting`, exposed through public and admin API endpoints.

The policy has these fields:

- `version`: short public version string, for example `2026-07-09`.
- `publishedAt`: ISO date-time used on the public page.
- `content`: the policy body as normalized plain text with headings preserved.
- `updatedAt`: server-managed timestamp from the backing setting row.

The public page renders the current published policy at `/privacy`. Admins edit the same content in `/admin/settings`.

## Backend Design

Add a privacy-policy settings service near the existing app-settings services.

Storage:

- Use the existing `AppSetting` table to avoid creating a dedicated privacy-policy table in the first release.
- Store one JSON payload under a key such as `privacy.policy`.
- Validate the payload with Zod before saving and before returning it.
- Seed a default from the extracted policy content so `/privacy` is never empty after deployment.

Public API:

- `GET /privacy-policy`
- Returns the current policy payload without authentication.
- This endpoint is intentionally separate from `/tests/public/*` because the policy must be globally accessible.

Admin API:

- `GET /admin/settings/privacy-policy`
- `PATCH /admin/settings/privacy-policy`
- Both require admin auth through the existing `AtGuard` plus `ensureAdminAccess` pattern.
- Patch validates non-empty `version`, valid `publishedAt`, and non-empty `content`.

Consent snapshot:

- Add nullable `policyVersionSnapshot` and `policyPublishedAtSnapshot` columns to `TestStudentAttempt`.
- Extend public session start to save the active global policy version and publication date on every new attempt.
- Keep the existing per-link `consentVersion` and `consentTextSnapshot` fields unchanged for backwards compatibility.

## Frontend Design

Public route:

- Add `/privacy` to `App.tsx`.
- Create a simple readable page that fetches `GET /privacy-policy`.
- Store the content as normalized plain text. Render it with a small local formatter that preserves line breaks, promotes numbered all-caps section headings, and escapes all user-provided text. Do not add a Markdown dependency in the first release.
- Include a fallback error state that tells the user the policy is temporarily unavailable and provides a retry action.

Public footer:

- Extend `PublicThemeLayout` with a footer slot or built-in footer.
- Show `Политика обработки персональных данных` linking to `/privacy`.
- Use the same footer for standard and Polus public pages, with styling scoped to each theme.
- Do not include `/login` in the first-release acceptance criteria; all `/t/*` pages must be covered.

Consent UI:

- Add a shared `PublicPrivacyConsent` component used by education, demographic, and combined entry forms.
- It contains a checkbox and text:
  `Я ознакомлен(а) с Политикой обработки персональных данных и даю согласие на обработку персональных данных.`
- The policy text is a normal link to `/privacy`, opening in a new tab.
- The checkbox updates the existing `consentAccepted` field in the relevant form state.
- Submit stays blocked by existing frontend validation and backend `consentAccepted: true` validation.
- The existing per-link `consentText` can still be shown as additional explanation if needed, but it should not replace the global policy link.

Admin UI:

- Add a card to `/admin/settings` named `Политика персональных данных`.
- Show current version, publication date, and last update.
- Provide fields for `version`, `publishedAt`, and `content`.
- Use a large textarea for the first release. A Markdown preview can be added later, but it is not required.
- On save, invalidate the privacy-policy query and show a success toast.

## Content Migration

Initial content comes from `C:\Users\lisitsyn\Downloads\Politika.docx`.

Implementation must extract and normalize the policy section into text suitable for the public page. The internal order appointing the responsible person must not be published in the default seed. If the operator later wants it public, it should be added by an admin as a separate section clearly labeled as an administrative attachment.

Because the DOCX text is long and contains numbering artifacts after extraction, the implementation must normalize headings and list spacing before seeding it.

## Data Flow

1. Admin opens `/admin/settings`.
2. Frontend requests `GET /admin/settings/privacy-policy`.
3. Admin edits and saves.
4. Backend validates and stores the JSON payload in `AppSetting`.
5. Visitor opens `/privacy`.
6. Frontend requests `GET /privacy-policy` and renders the current policy.
7. Student opens `/t/:code`, sees footer link and consent checkbox.
8. Student checks the box and starts the test.
9. Backend validates `consentAccepted: true` and saves attempt consent snapshots, including the active global policy version.

## Error Handling

- If no policy exists, public API returns the bundled seeded default and logs the missing setting; it must not crash.
- Admin save errors show the server validation message.
- Public entry pages should still load if policy fetch for display text fails, but the checkbox label must keep the `/privacy` link.
- Starting a session without `consentAccepted: true` remains a backend validation error.

## Testing

Backend:

- Unit tests for privacy-policy service validation and default loading.
- Controller tests for public read and admin update.
- Public session start test proving the active policy version is snapped onto the attempt.

Frontend:

- `/privacy` renders policy content and error state.
- Public entry forms render the consent checkbox with a `/privacy` link.
- Submit without consent shows the existing personal-data consent error.
- Submit with consent sends `consentAccepted: true`.
- Admin settings card loads, edits, saves, and invalidates query data.

Verification:

- Generate API client after backend DTO changes.
- Run targeted server tests, targeted client tests, typecheck/lint where available, and a Docker smoke check for `/privacy`, `/t/:code`, and `/api/privacy-policy`.

## Rollout Notes

- Deploy backend first with the default policy seed, then frontend with `/privacy` and consent UI.
- The existing deployed public links continue working because the global policy is independent from per-link consent text.
- Existing attempts keep their old consent snapshots; new attempts get the global policy version snapshot.
- After deploy, verify that the production URL in the complaint can access `/privacy` without login and that every public test entry page links to it.

## Follow-Ups

- Optional policy version history table if audit requirements become stricter.
- Optional Markdown preview in admin settings.
- Optional footer link on admin/login pages if the operator wants policy access outside public test pages.
