# Suggested Commands (updated 2026-02-15)

## Setup
- `npm install`
- `npm run install:all`
- `docker-compose up -d`

## Dev run
- Backend: `npm run dev:server`
- Frontend: `npm run dev:client`
- Both: `npm run dev`

## DB + API generation
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run gen:api`

## Primary quality gates
- Daily local gate (default):
  - `npm run verify:local`
- Release gate (full pipeline):
  - `npm run verify:template`

## Focused guards
- `npm run verify:ai-guide`
- `npm run verify:api-mutator`
- `npm run verify:architecture`
- `npm run verify:maintainability`
- `npm run verify:smoke:server`
- `npm run verify:smoke:client`

## Server checks
- `npm run lint --prefix server`
- `npm run test --prefix server`
- `npm run test:e2e --prefix server`
- `npm run build --prefix server`

## Client checks
- `npm run lint --prefix client`
- `npm run build --prefix client`

## Public links / student flow manual checks
- `/admin/public-links`
- `/admin/public-links/stats`
- `/t/:code`
- `/t/:code/session/:sessionToken`
- `/t/:code/result/:sessionToken`

## Prompt Studio env (backend)
Add to `server/.env`:
```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
```
Then restart backend dev process.