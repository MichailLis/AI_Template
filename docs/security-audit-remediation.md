# Security Audit Remediation

Date: 2026-05-12

## Scope

Dependency audit remediation was run for all package scopes:

- root package
- `client`
- `server`

## Remediation Summary

- Applied semver-safe dependency updates with `npm update`, `npm --prefix client update`, and `npm --prefix server update`.
- Updated the client direct dev dependency `eslint-plugin-sonarjs` to `^4.0.3` to remove its vulnerable `minimatch` transitive dependency.
- Added a targeted server npm override for `@prisma/dev -> @hono/node-server@1.19.13`.

The Prisma override was chosen because `prisma@7.8.0` depends on `@prisma/dev@0.24.3`, which pinned `@hono/node-server@1.19.11`. The advisory is fixed in `@hono/node-server@1.19.13`. `npm audit` suggested a Prisma 6.x path as the available fix, but this branch is on the Prisma 7 baseline and a Prisma major downgrade would be a higher-risk change than a targeted patch override.

## Residual Vulnerabilities

No residual npm audit vulnerabilities remain after remediation.

| Scope           | Result                             |
| --------------- | ---------------------------------- |
| root            | `npm audit` passes                 |
| client          | `npm --prefix client audit` passes |
| server          | `npm --prefix server audit` passes |
| production-only | `npm run audit:prod` passes        |
| all scopes      | `npm run audit:all` passes         |

## Verification Performed

The final verification run used clean installs from the committed lockfiles:

- `npm ci`
- `npm ci --prefix client`
- `npm ci --prefix server`
- `npm --prefix server ls @hono/node-server @prisma/dev prisma --depth=4`
- `npm run prisma:generate`
- `npm run audit:prod`
- `npm run audit:all`
- `npm run verify:local`
- `npm run test:run --prefix client`

The server dependency tree resolves `@prisma/dev@0.24.3 -> @hono/node-server@1.19.13 overridden`.

## Follow-Up

- Revisit the server override when Prisma publishes a release that no longer pins the affected `@hono/node-server` version.
- Keep Prisma major upgrades as an explicit migration slice with `prisma:generate`, `prisma:push`, server unit/e2e tests, and Docker smoke verification.
