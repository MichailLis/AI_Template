# Task Completion Checklist

1. Schema/data sync
- Update `server/prisma/schema.prisma` when needed.
- Run `npm run prisma:generate` and `npm run prisma:push`.

2. Backend completeness
- Replace scaffold placeholders.
- DTOs use `createZodDto`.
- Controllers include `@ApiOperation` and `@ApiResponse`.

3. Frontend/API integration
- Keep API mutator contract valid (`npm run verify:api-mutator`).
- Run `npm run gen:api` and use generated hooks.
- Wire routes in `client/src/app/App.tsx`.
- Update navigation only if such navigation exists in current template structure.

4. Manifest alignment
- Update `template/features.manifest.json` for feature metadata/routes.
- In auth-only baseline: keep `features: []` and keep `auth.requiredRoutes` aligned with UI (currently `/login`).

5. Required tests
- Run `npm run test --prefix server`.
- Run `npm run test:e2e --prefix server`.

6. Full validation
- Run `npm run verify:template` and ensure green output.

7. Cleanup sanity
- No bypasses or disabled checks.
- Remove temporary feature artifacts when returning to auth-only baseline.
- Keep auth flow operational.