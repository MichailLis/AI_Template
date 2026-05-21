# Polus Public Template Integration

Date: 2026-05-19

This note records the current production contract for the Polus public test template. The prototype remains reference material only; runtime code must not depend on `client/public/prototypes`. Local prototype references belong outside the Vite public runtime, under ignored design scratch space such as `Design/prototypes/`.

## Public Link Template Choice

- Public links store `publicTemplate` on `TestPublicLink`.
- `STANDARD` is the default for existing links and newly created links.
- `POLUS` is selected explicitly during public-link creation.
- Admin UI does not edit a link template after creation.
- Public routes stay unchanged:
  - `/t/:code`
  - `/t/:code/session/:sessionToken`
  - `/t/:code/result/:sessionToken`

## Entry Profile Modes

- `DEMOGRAPHIC`: collects gender, age, residence, and education level; attempts are limited to one student submission.
- `EDUCATION`: collects the existing education-based student profile.
- `EDUCATION_DEMOGRAPHIC`: collects student name, surname initial, patronymic initial, age, education organization, group/class, gender, residence, and education level.
- Polus hybrid entry requires surname and patronymic initials while using the education attempt/resume behavior.
- `EDUCATION` and `EDUCATION_DEMOGRAPHIC` use the education attempt/resume behavior.

## Public UI Contract

- `STANDARD` keeps the existing public components.
- `POLUS` uses branded components under `client/src/widgets/public-test-workspace/ui/polus`.
- Polus styles are scoped through the Polus variant of `PublicThemeLayout`.
- Polus assets and fonts belong in the production-owned Polus public-test asset folder, not in `client/public/prototypes`.
- Single-choice answers keep the existing auto-advance behavior.
- Multi-choice, slider, and open-text answers keep explicit action/navigation behavior.

## Data/API Surface

- `publicTemplate` is exposed in admin/public link DTOs, public link access responses, session state responses, and result responses.
- API clients are generated from the backend OpenAPI contract with Orval; regenerate after DTO changes.
- Result rendering reuses the universal analysis schema rather than introducing a Polus-only result schema.

## Verification Snapshot

The Polus template integration was verified with:

```powershell
npm run verify:local
npm run verify:template
```

Browser smoke covered `POLUS43972297`: the hybrid entry fields were visible, submit opened a session, and the database stored education, demographic, surname-initial, and patronymic-initial fields for the Polus hybrid flow.
