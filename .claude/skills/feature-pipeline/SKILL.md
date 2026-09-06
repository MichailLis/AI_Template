---
name: feature-pipeline
description: Use when adding or changing a feature in this template — editing server/prisma/schema.prisma, adding or changing a DTO or controller, or regenerating the API client with npm run gen:api. Walks the required order (schema -> backend -> gen:api -> frontend -> verification) and the traps that most often break it.
---

# Feature pipeline

This skill sequences a fullstack change in this template. It does not restate the rules — read
`AI_GUIDE.md` ("Feature Pipeline (Required Order)", "Phase 0: Feature Ownership Classification",
"Verifying A Change (Always-On)") and `CLAUDE.md` ("Feature pipeline", "Non-obvious invariants")
for the full rationale. This is the sequence to actually run.

## 1. Classify the change first

Before touching `schema.prisma` or running a generator, state the classification out loud (see
`AI_GUIDE.md` Phase 0 for the exact criteria and examples):

- `existing-feature-change` — the route root, Prisma models, UI workspace, and workflow already
  belong to a feature declared in `template/features.manifest.json`. This is the default; do not
  run `npm run gen:nest <name>` for it.
- `new-feature` — a new durable bounded context: new Prisma model ownership, a new backend module
  and route root, a new frontend workspace, and a new `template/features.manifest.json` entry.

If the change crosses two existing features, define the owning feature and the cross-feature
contract before writing code — do not deep-import another feature's internals to avoid the
decision.

## 2. Follow the order, do not reorder or skip steps

1. `server/prisma/schema.prisma` — data model change.
2. `npm run prisma:generate` — regenerate Prisma client and Zod types from the schema.
3. Backend: DTOs (`createZodDto(...)`, dates as `z.string()`, never `z.date()`/`z.coerce.date()`),
   controllers (every handler needs `@ApiOperation` and a typed `@ApiResponse`), services.
4. `npm run gen:api` — regenerates `server/openapi.json` and the client hooks under
   `client/src/shared/api/generated/` and `client/src/shared/api/model/`. Run
   `npm run verify:api-mutator` first (or run the full `verify:local`/`verify:template`, which
   already call it) — it guards `client/src/shared/api/api.ts` staying Node-safe, which `gen:api`
   relies on.
5. Frontend: consume the regenerated hooks in `widgets/*`/`features/*`; keep `pages/*` thin.
6. Verification (step 4 below).

**If backend DTOs or controllers changed, step 4 must happen before any frontend lint, build, or
test step.** A frontend check run against a stale generated client passes for the wrong reason.

## 3. The traps that cost the most (from `CLAUDE.md`, "Verifying A Change")

- **After `npm run gen:api`, read `git diff --numstat`, not `git status`.** Orval rewrites every
  generated file with LF, so `git status` can list hundreds of modified files where only one or
  two actually changed content — `git status` cannot tell you which. `git diff --numstat` shows
  real insertions/deletions per file; a file with `0	0` changed only line endings.
- **`client/src/shared/api/generated/**`and`client/src/shared/api/model/**` are generated _and
  committed_.** Do not delete them to "start clean" before testing a gate — `verify:api-mutator`
  reads them before `gen:api` ever runs, and deleting them turns a clean-tree check into a fake
  failure. Ask `git check-ignore <path>` to find out what is actually gitignored in this tree;
  judging by the word "generated" gets this one backwards.
- **If you edit any file with a script, normalize line endings.** This tree is CRLF. Read as
  UTF-8, normalize `\r\n` to `\n` in memory, do the edit, convert back to `\r\n` once on write.
  Splitting on `\r\n` or relying on `$` under a multiline regex against raw CRLF content silently
  misses matches.

## 4. Close with verification

- `npm run verify:diff` — fast pre-flight scoped to the current git diff; also what
  `.husky/pre-push` runs. Not a gate, just a cheap early signal.
- `npm run verify:local` — the daily gate; run this before calling the change done.
- `npm run verify:template` — the release gate; mandatory before finalizing branch state.

A `PreToolUse` write-time guard (`scripts/claude-write-guard.mjs`) catches four of the most common
violations from this pipeline (editing generated API output, browser globals leaking into
`client/src/shared/api/api.ts`, direct `localStorage`/`sessionStorage` use, `z.date()` in DTOs) as
you write, but it is a hint, not a gate — see `AI_GUIDE.md` for why `npm run verify:invariants`
stays the source of truth.
