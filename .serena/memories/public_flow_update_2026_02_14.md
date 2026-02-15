# Public Flow + Public Links Update (refreshed 2026-02-15)

## Routing and ownership
- Admin links lifecycle: `/admin/public-links`
- Admin stats: `/admin/public-links/stats`
- Student flow:
  - `/t/:code`
  - `/t/:code/session/:sessionToken`
  - `/t/:code/result/:sessionToken`

## Current behavior baseline
1. Public links lifecycle: create/regenerate/archive/restore.
2. Archive is non-destructive (historical attempts remain queryable in stats).
3. Stats view is table-first with practical filters/actions.
4. Student-facing public pages use scoped theme via `PublicThemeLayout` + `public-theme.css` (`.theme-public`).
5. Student UI avoids raw technical statuses.

## Educational organization binding (new)
1. Added managed educational organizations on admin side.
2. Public link can be bound to one organization (`educationOrganizationId`).
3. Link access payload includes linked organization name.
4. Student entry form locks/uses organization from link metadata when present.
5. Goal: remove manual org typing variance and improve downstream data quality.

## Reliability fix (critical)
- Root cause discovered: some completed attempts had zero answers because users could finish without explicit save.
- Mitigation implemented in public run flow:
  - Finish action now auto-saves merged draft/server answers before calling finish endpoint.
  - Manual save button removed from student action bar.

## Recent UX improvements
- In admin public links list, added direct action to open short link in new tab (`Перейти`) for faster testing.
- In student run action bar, primary `Завершить тест` action placed on the right side.

## Verification pattern
- Client checks for public-flow UX changes:
  - `npm run lint --prefix client`
  - `npm run build --prefix client`
  - `npm run verify:smoke:client`
- Full validation for contract-affecting changes:
  - `npm run verify:local` (or `verify:template` before release)