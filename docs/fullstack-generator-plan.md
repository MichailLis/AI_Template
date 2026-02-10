# Fullstack Feature Generator - Planning Draft

Status: design-only document. No production command is enabled from this draft.

## Goal
Create a deterministic generator that builds a new feature end-to-end without manual wiring drift:
- Prisma model
- NestJS module/controller/service/DTO
- OpenAPI regeneration + Orval client
- Frontend page + create form + route wiring
- Manifest update (`template/features.manifest.json`)

The generator must fail-fast and prevent architecture deviations.

## Non-goals
- Arbitrary free-form scaffolding from natural language.
- Modifying existing feature semantics automatically.
- Auto-resolving naming conflicts silently.

## Proposed Command Contract
Hypothetical (not implemented):
```powershell
npm run feature:new -- --name <featureName> --kind <text|link>
```

### Inputs
- `name`: kebab-case singular (`snippet`, `bookmark`, `release-note`)
- `kind`:
  - `text`: fields `{ title: string, content: string }`
  - `link`: fields `{ title: string, url: string }`

### Deterministic Derived Values
- model: PascalCase from `name` (`ReleaseNote`)
- route: plural kebab (`/release-notes`)
- module: `ReleaseNoteModule`
- frontend page path: `client/src/pages/release-notes/release-notes-page.tsx`
- frontend form path: `client/src/features/create-release-note/ui/create-release-note-form.tsx`

## Fail-Closed Rules
Generator must abort if any condition fails:
1. `name` not kebab-case singular.
2. Feature already exists in manifest.
3. Target files already exist.
4. Generated code does not pass `npm run verify:architecture`.
5. `npm run gen:api` fails.
6. `npm run verify:template` fails.

No partial success state is allowed.

## Planned Generation Flow
1. Validate input and read manifest.
2. Scaffold backend base via `npm run gen:nest <name>`.
3. Apply backend templates:
   - service CRUD for `create` + `findAll(userId)`
   - controller with `AtGuard`, `@ApiOperation`, `@ApiResponse`
   - DTOs with `createZodDto`, Date->string in response DTO.
4. Patch Prisma schema:
   - add relation field on `User`
   - add model with `id`, business fields, `userId`, relation, timestamps.
5. Run:
   - `npm run prisma:generate`
   - `npm run prisma:push`
   - `npm run gen:api`
6. Apply frontend templates:
   - create form using generated mutation hook
   - page using generated query hook
   - add schema in `client/src/shared/api/schemas.ts`
   - route in `client/src/app/App.tsx`
   - dashboard link in `client/src/pages/dashboard.tsx`
7. Update `template/features.manifest.json`.
8. Run `npm run verify:template`.

## Rollback Strategy
- Before writing files, create an in-memory execution plan.
- If any step fails:
  - remove newly created files
  - revert touched files to pre-run snapshot
  - print exact failing step and diff summary

## Implementation Phases

### Phase A (MVP)
- Support only `text` and `link` kinds.
- Support only auth-protected, user-owned list features.
- No update/delete endpoints in first version (create + list only).

### Phase B
- Add optional update/delete generation.
- Add UI list item actions.
- Add generated smoke e2e test template per feature.

### Phase C
- Config-driven field system (string/boolean/date with validators).
- Safer AST-based file patching for routes and schema symbols.

## Required Quality Gate After Each Generator Run
```powershell
npm run verify:template
```

If this command fails, generator output is invalid by definition.
