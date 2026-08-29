# AI_Template — style and conventions

Last verified against the repository on 2026-08-29 (branch `MichailLis/sargassum`).

## Frontend layout

Strict FSD: `app → pages → widgets → features → entities → shared`. Imports flow downward only,
and cross-slice imports go through the slice public API (`index.ts`). `pages/*` are thin route
entrypoints; composition and domain logic live in `widgets/*` and `features/*`.

Real locations worth knowing:

- Admin workspaces: `client/src/widgets/admin-tests-workspace`, `admin-prompts-workspace`,
  `admin-public-links-workspace`, `admin-public-links-stats-workspace`,
  `admin-education-organizations-workspace`, `admin-users-workspace`, `admin-settings-workspace`,
  `admin-page-layout`.
- Public student flow: `client/src/widgets/public-test-workspace` (with a `ui/polus/*` variant for
  the branded template) and `client/src/pages/t`.
- Admin shell: `client/src/features/admin/ui/admin-shell.tsx`.
- Design tokens: `client/src/shared/ui/admin-design-tokens.ts`.
- Public theme: `client/src/features/tests/ui/public-theme.css` (scoped under `.theme-public`),
  with the Polus variant alongside it in `client/src/features/tests/ui/polus/`.
  These tokens must not move into the global `client/src/app/index.css`.
- Generated API client: `client/src/shared/api/generated/{admin,auth,tests,tests-public,privacy-policy}`.

## Hard rules

1. `client/src/shared/api/api.ts` contains only the Axios instance — no `window`, no
   `localStorage`, no `import.meta`, because Orval imports it in a Node process. Browser
   interceptors belong in `client/src/shared/api/interceptors.ts`. Enforced by
   `npm run verify:api-mutator`.
2. Storage access goes through `safeStorage` from `@/shared/lib/storage`, never through
   `localStorage` or `sessionStorage` directly.
3. Do not copy React Query data into form state with `setState` inside `useEffect`. Derive the
   effective value at the render or submit boundary.
4. Use `import type` for type-only imports.
5. Backend response DTOs convert Prisma `Date` fields to `z.string()`; every controller endpoint
   carries `@ApiOperation` and a typed `@ApiResponse`.
6. Server errors keep a single shape: `{ success: false, error: { code, message } }`.
7. Public `/t/*` DTOs expose student-safe fields only — raw provider output, prompts and scoring
   internals stay in admin DTOs behind admin guards.
8. When a UI library primitive exists (shadcn/ui, Radix), use it rather than hand-rolling a
   modal, dropdown or button.

## Maintainability thresholds

Client source files are capped at 420 effective lines, server sources at 700, specs at 900, and a
file should hold no more than fourteen `useState` calls. Prefer extraction before a file reaches
the limit rather than under pressure from a failing gate.

## Feature pipeline

Classify the change first (`existing-feature-change` or `new-feature`), then follow the order:
`schema.prisma` → `npm run prisma:generate` → backend → `npm run gen:api` → frontend →
verification. Regenerate the API client before any frontend lint, build or test step whenever
backend DTOs or controllers changed.
