# Style and Conventions

## General
- TypeScript across frontend and backend.
- Prettier from root `.prettierrc` (single quotes, semicolons, trailing commas, width 100).
- Avoid `any` (lint-enforced).

## Frontend
- Use alias imports (`@/...`) and keep import order lint-compliant (eslint `import/order`).
- Keep route wiring aligned with manifest (`/login` + declared feature routes in `App.tsx`).
- Forms/schemas should use Zod schemas from `client/src/shared/api/schemas.ts` where applicable.
- API hooks are generated under `client/src/shared/api/generated` and consumed directly.
- For larger admin UI pages, prefer splitting into focused page-local components (e.g., `client/src/pages/admin/prompt-studio/*`) while keeping `admin-prompts-page.tsx` as orchestration container.
- Admin QA screens are currently Russian-localized; keep UX copy consistent on touched screens.
- For `admin-tests-page`, question create/edit should stay modal-first (avoid always-visible full editor blocks).
- For choice/slider question builders, prefer explicit structured inputs over delimiter-based text parsing UI.
- Hide non-essential technical fields from content managers; keep advanced fields collapsed by default.

## Backend
- Feature modules under `server/src/<feature>`.
- DTOs use `createZodDto(...)`.
- Response DTO dates should be `z.string()` for OpenAPI compatibility.
- Controllers should include `@ApiOperation` + `@ApiResponse`.

## API mutator contract
- `client/src/shared/api/api.ts` must remain Node-safe for Orval.
- No browser-specific logic in `api.ts`.
- Must export `customInstance`, default `api`, and `configureApiBaseUrl`.
- Interceptors live in `client/src/shared/api/interceptors.ts`.
- `App.tsx` must call `configureApiBaseUrl(import.meta.env.VITE_API_URL)` and `setupInterceptors(api)`.

## Architecture strictness
- `verify:architecture` validates route/module/schema/model consistency against manifest.
- It fails on stale artifacts (extra backend feature modules, extra feature/page dirs, stale generated API dirs, unexpected routes).
- For non-empty manifest features, `client/src/pages/dashboard.tsx` must include links to declared feature routes.

## Prompt Studio safety rules
- OpenRouter API key is backend-only (`server/.env`).
- Frontend must use backend proxy endpoints only (`/admin/prompts/*`).
- Prefer free-model defaults to reduce accidental spend.
- Prompt variables must have unique keys before running simulation.
- For strict JSON automation flows, prefer `response_format: json_schema` with explicit schema + `strict=true`.
- Avoid OpenRouter web-search for tests generation flows (no `web` plugin and no `:online` model suffixes).

## Tests workspace UX rules
- Keep test-topic deletion explicit: icon action + destructive confirmation dialog.
- Sidebar cards must wrap long titles/slugs without overflow outside card bounds.
- AI test generation should use preview-first UX and transactional commit endpoint.

## Testing baseline
- Keep auth unit + e2e coverage passing.
- Admin e2e coverage includes users-management paths.
- `verify:template` is the required final gate.
