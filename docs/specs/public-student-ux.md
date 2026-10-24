# Public student flow contract

Target routes:

- `"/t/:code"` -> entry form
- `"/t/:code/session/:sessionToken"` -> run workspace
- `"/t/:code/result/:sessionToken"` -> result workspace

Security model:

- Public session/result URLs are bearer-style links: anyone with a valid `sessionToken`
  can open the active session or final result until normal session/link rules block access.
- Do not log, display, or send public session/result URLs outside the student-facing flow.
- Public result DTOs must expose only student-safe analysis fields: status, provider mode,
  generated timestamp, safe summary blocks, and user-facing error text.
- Raw provider output, prompts, scoring internals, and debug-only fields belong only in
  admin/internal DTOs protected by admin guards.
- The session state hands the student only the question `settings` keys the public client reads
  (`PUBLIC_QUESTION_SETTINGS_KEYS` in `attempt.mapper.ts`: `maxChoices`, `min`, `max`, `step`,
  `sliderKind`, `methodologySliderId`); `directionMap` and weights never leave the server. A new key
  the public client starts reading must be added to that list.

UI/theming rules:

1. All public pages must be wrapped by `PublicThemeLayout` (`client/src/widgets/public-test-workspace/ui/public-theme-layout.tsx`).
2. Scoped theme tokens are defined in `client/src/features/tests/ui/public-theme.css` under `.theme-public`.
3. Do not place public-theme tokens in global `client/src/app/index.css`.
4. Do not leak technical statuses to students (for example `IN_PROGRESS` badge in the run header).
5. Analysis status in result screen must be humanized (`готов`, `в обработке`, `ошибка`).
6. The result screen keeps polling while `summary.llm.status` is `pending`, not only while
   the top-level analysis status is `PENDING`: a prof-orientation attempt is already
   `READY` when its LLM enrichment has not run yet.
7. Entry page should remain center-composed with mobile-safe layout (no horizontal overflow).
8. Entry/run/result pages must branch by the link `publicTemplate` without changing public routes:
   - `STANDARD` preserves the existing public components.
   - `POLUS` uses public shell components under `client/src/widgets/public-test-workspace/ui/polus/*`; shared result rendering, styles, and assets live under `client/src/features/tests/ui/polus/*`.
9. Polus styles must stay scoped through the Polus variant of `PublicThemeLayout`; Polus assets/fonts belong in the production-owned Polus public-test asset folder, not `client/public/prototypes`.
10. Entry page must branch by the link `entryProfileMode` without changing public routes:
    - `DEMOGRAPHIC` shows the demographic profile form.
    - `EDUCATION` shows the education profile form.
    - `EDUCATION_DEMOGRAPHIC` shows education fields plus the demographic questionnaire; Polus hybrid entry includes name, surname initial, and patronymic initial.
11. The admin dark theme must never reach public pages: `useDocumentTheme` puts the `dark` class on
    `<html>` only while the admin shell is mounted and removes it on unmount, and public tokens stay
    under `.theme-public`.
12. A link with `timeLimitMinutes` gives its attempt an `expiresAt`. The run screen shows a countdown
    (`PublicTestRunTimer`, with a warning state near the end; the Polus variant has its own style).
    Once the time is over the server refuses answers (`Test session expired`) and the student sees the
    expired screen: the attempt is closed, no result is built, and the Polus variant offers a way back
    to the entry page. The result DTO for such an attempt reports a `FAILED` analysis with the
    message "Test session expired before completion" and no summary.
13. A student who comes back into a session (or presses "Назад") on a `SINGLE_CHOICE` question that
    already has a saved answer must still get an explicit "next" action: picking the same option again
    cannot advance, so the auto-advance on choice applies only to unanswered questions.
14. The server matches the link code case-insensitively and a code can be reissued under an open
    attempt, so the run screen redirects (replace) to `/t/<session.shortCode>/session/…` when the URL
    code differs, and finish opens the result under the session's code. An empty `shortCode` never
    redirects. A failed background poll keeps the loaded session on screen; the "session unavailable"
    screen shows only without data or on a 404.
15. The Polus waiting screen plays `professor-polus-thinking.mp4` (H.264, no audio) as a muted inline
    loop with `professor-polus.png` as poster; with `prefers-reduced-motion` it does not autoplay and
    stays on the poster. H.264 has no alpha, so the clip is encoded on white and the CSS uses
    `mix-blend-mode: multiply` to let the card background show.

---

Extracted from `AI_GUIDE.md`. The template-wide rules stay there; this file covers only the
product contract. Read it when working on the public `/t/*` routes, public theming, or the Polus template.
