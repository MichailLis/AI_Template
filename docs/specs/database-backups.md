# Database backups contract

Backups of the whole PostgreSQL database, managed from the admin panel.

- Backend: integration module `server/src/backups/*` (`BackupsModule`, imported by `AdminModule`)
- Routes: `admin/backups/*` in `server/src/admin/admin-backups.controller.ts`
- Frontend: tab «Резервные копии» in `client/src/widgets/admin-settings-workspace/*`
- Route: `"/admin/settings"`
- Design, decisions and risks: `docs/plans/2026-10-08-admin-db-backup-plan.md`
- Deployment and manual restore: `docs/deployment-dockerhub.md`, section 11

Required behavior:

1. Every backup operation checks admin access on the server: `AdminGuard` on the controller. Two routes
   stay outside it. `GET /admin/backups/operation` has only `AtGuard`, because it must answer during
   the database swap, when the role cannot be read; `getStatus` checks the role itself when the
   database is available. The download route has no `AtGuard`: it takes a one-time token valid for 60 seconds, issued by
   `POST /admin/backups/:id/download-link`, and checks admin access again for the token's owner.
2. `pg_dump`/`pg_restore` run without a shell through `PgToolsRunner`. Connection settings go through
   `PG*` env vars parsed from `DATABASE_URL` (libpq rejects Prisma's `?schema=public`); the password
   never appears in arguments. Dumps are `-Fc --no-owner --no-acl`.
3. Backup files, their metadata (`<id>.json`), schedule settings (`settings.json`) and restore state
   (`state.json`) live in the `/backups` volume, never in the database: a restore replaces the
   database and must not roll them back. The only schema change is
   `AuditEntityType.DATABASE_BACKUP`.
4. One operation at a time: a backup, an import and a restore exclude each other. Long work runs in
   the background; the client polls `GET /admin/backups` and `GET /admin/backups/operation`.
5. Retention (days, max count) prunes after each successful backup. The latest successful copy and
   uploaded (`IMPORTED`) copies are never pruned automatically.
6. The schedule checks every 10 minutes whether today's UTC slot has come. A slot is covered by a
   successful copy from the last 20 hours or by any scheduled attempt since the slot; a scheduled
   copy that cannot start (no space, no `pg_dump`) is recorded as a `FAILED` entry with the reason.
7. Restore: safety copy of the current database (`PRE_RESTORE`) → maintenance mode (every route
   except `/admin/backups/operation` and `/health` answers 503) → `pg_restore` into
   `<db>_restore` → checks there (schema not newer than the app, an older one is brought forward
   with `prisma migrate deploy`; at least one active admin; refresh tokens cleared) → swap by
   `ALTER DATABASE ... RENAME`. The replaced database stays as `<db>_before_<time>` until the next
   restore; undo swaps it back after running the same check on the saved database (older schema is brought up with migrations, a newer one refuses the undo). Any failure before the swap leaves the working database untouched.
8. After a swap, access tokens issued before it are rejected (`server/src/auth/session-epoch.ts`,
   boundary persisted in `state.json`), so every user signs in again.
9. Import accepts the raw body (`application/octet-stream`, no multipart), streams it to disk, and
   rejects files without the `PGDMP` signature, files `pg_restore --list` cannot read, and files over
   `BACKUP_MAX_UPLOAD_MB`. Restoring an uploaded copy goes through the same checks as item 7.
10. Disk space: a backup does not start when free space is below the database size; a restore does
    not start when free space is below the database size plus the dump. The tab warns when free
    space fits fewer than three copies.
11. Every action is written to the audit log under `DATABASE_BACKUP`.

Runtime requirements (backend image with `postgresql-client-16`, the volume, `BACKUP_*` env vars,
database rights) are in `AI_GUIDE.md`, "Docker Runtime Contract".
