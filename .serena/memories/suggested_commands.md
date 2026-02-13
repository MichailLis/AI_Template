# Suggested Commands

## Setup
- `npm install`
- `npm run install:all`
- `docker-compose up -d`

## Run
- Backend first: `npm run dev:server`
- Frontend: `npm run dev:client`
- Both: `npm run dev`

## Prompt Studio env (backend)
Add to `server/.env`:
```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_HTTP_REFERER="http://localhost:5173"
OPENROUTER_APP_NAME="AI Template Admin"
```
Then restart backend/dev process.

## Health / diagnostics
- Backend reachable check:
  - `node -e "fetch('http://localhost:3000/api').then(r=>console.log(r.status)).catch(e=>console.error(e.message))"`
- Port 3000 process (Windows):
  - `netstat -ano | findstr :3000`

## Data / API generation
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run gen:api`

## Validation
- `npm run verify:api-mutator`
- `npm run verify:architecture`
- `npm run lint`
- `npm run test --prefix server`
- `npm run test:e2e --prefix server`
- `npm run verify:template`

## Build
- `npm run build --prefix server`
- `npm run build --prefix client`