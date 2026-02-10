# Auth-Only Release Checklist

Use this checklist before merging template changes to the final auth-only branch.

## 1) Remove temporary business features
- Delete temporary feature modules from `server/src/<feature>/`.
- Delete related frontend feature/page files from `client/src/features/` and `client/src/pages/`.
- Remove related routes from `client/src/app/App.tsx`.
- Remove related links/buttons from `client/src/pages/dashboard.tsx`.

## 2) Clean Prisma schema to auth baseline
- Remove temporary models from `server/prisma/schema.prisma`.
- Remove temporary relation fields from `User` model.
- Keep only auth-required data structures.

Run:
```powershell
npm run prisma:generate
npm run prisma:push
```

## 3) Regenerate API artifacts
Run:
```powershell
npm run gen:api
```

## 4) Sync architecture manifest
- Update `template/features.manifest.json`.
- For final auth-only template, keep:
  - auth section
  - empty `features` array

## 5) Verify hard quality gates
Run:
```powershell
npm run verify:template
```

Expected result:
- `verify:architecture` passes
- lint passes (client/server)
- build passes (client/server)
- smoke checks pass (server/client)

## 6) Final git sanity
- `git status` is clean.
- No accidental local files included (`.claude/`, temporary logs, local scripts).
