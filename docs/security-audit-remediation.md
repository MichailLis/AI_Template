# Security Audit Remediation

Date: 2026-05-12

This document records the original remediation pass and the follow-up revalidation
expectations. Treat the command outputs from the current branch as authoritative;
do not treat this note as a permanent audit certificate.

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

## Original Residual Vulnerabilities

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
- After dependency or lockfile changes, rerun:
  - `npm run audit:all`
  - `npm run audit:prod`

## Revalidation Notes

- 2026-05-23: server lockfile was updated by `Fix server qs audit advisory (#19)`.
- 2026-05-27: revalidation was rerun on the current worktree:
  - `npm run audit:prod` failed in the server scope.
  - `npm run audit:all` failed in the server scope.
  - root and client audit scopes reported `0 vulnerabilities`.
  - server audit reported `tmp <0.2.6` high severity path traversal
    (`GHSA-ph9p-34f9-6g65`).

Treat the 2026-05-27 `tmp` advisory as the current open audit item until the
server dependency tree or override strategy is remediated and both audit commands
pass again.
