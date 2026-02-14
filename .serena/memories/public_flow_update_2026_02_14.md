# Public Flow + Admin Public Links Update (2026-02-14)

## Context
This branch currently carries active business modules (admin/tests/public flow) for feature delivery, while final template target remains auth-only baseline.

## Delivered capabilities
1. Admin public links split into dedicated pages:
   - `/admin/public-links`
   - `/admin/public-links/stats`
2. Public-link lifecycle uses non-destructive archive/restore:
   - archive disables student access
   - historical sessions/results remain intact
3. Stats UX upgraded to table-first layout with practical controls:
   - filter by test
   - filter by link
   - actions per student row for analysis + answers
   - business copy in selectors: `тестов пройдено`
4. Public student flow routes:
   - `/t/:code`
   - `/t/:code/session/:sessionToken`
   - `/t/:code/result/:sessionToken`
5. Product-ready public theme architecture:
   - shared wrapper: `client/src/widgets/public-test-workspace/ui/public-theme-layout.tsx`
   - scoped tokens: `client/src/widgets/public-test-workspace/ui/public-theme.css` (`.theme-public`)
   - rule: do not move this scoped theme back into global `client/src/app/index.css`
6. UX contract for student-facing pages:
   - entry page centered and mobile-safe
   - run header hides raw technical status (`IN_PROGRESS`)
   - result page maps analysis statuses to human labels: `готов`, `в обработке`, `ошибка`

## Important implementation notes
- Runtime API autodiscovery should validate required API routes before accepting discovered origin (prevents attaching to unrelated local Swagger API).
- Keep admin visuals untouched by public theme (scope strictly to `/t/*` composition layer).

## Recent commit reference
- `45276b9` `feat(client): finalize public test product-ready ui`
  - touched: public entry/run/result UI + `public-theme-layout.tsx` + `public-theme.css`

## Verification pattern used
- `npm run lint --prefix client`
- `npm run build --prefix client`
- `npm run verify:architecture`
- Manual visual/UX route check by user on public pages
