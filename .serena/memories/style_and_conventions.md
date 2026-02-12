# Style and Conventions

## General
- TypeScript across frontend and backend.
- Prettier from root `.prettierrc` (single quotes, semicolons, trailing commas, width 100).
- Avoid `any` (lint-enforced).

## Frontend
- Keep baseline routing aligned with current template state (login-only unless feature work explicitly adds routes).
- Use alias imports (`@/...`) and keep import order lint-compliant.
- Forms use `react-hook-form` + Zod schemas from `client/src/shared/api/schemas.ts`.
- API hooks are generated under `client/src/shared/api/generated`.

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
- It also fails on stale artifacts (extra backend feature modules, extra feature/page dirs, stale generated API dirs, unexpected routes).

## Testing baseline
- Auth must have unit coverage for controller/service behavior.
- Auth must have e2e coverage for signup/signin happy paths.
- `verify:template` enforces both `npm run test --prefix server` and `npm run test:e2e --prefix server`.