# AI Template Client

React/Vite frontend for the AI Template product workspace.

## Stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- TanStack Query
- Orval-generated API client
- Zustand session store
- Tailwind + shadcn/ui-style primitives
- Vitest + Testing Library

## Runtime

Normal local startup is managed from the repository root with the root `docker-compose.yml`:

```powershell
docker compose up -d
```

The frontend container serves Vite on `http://localhost:5173`.

For host-only development inside `client/`:

```powershell
npm ci
npm run dev
```

Useful client commands:

```powershell
npm run gen:api
npm run lint
npm run test:run
npm run build
```

`npm run gen:api` clears `src/shared/api/generated` and `src/shared/api/model`, then regenerates Orval output from `../server/openapi.json`. Run root `npm run gen:api` after backend DTO/controller changes so the server OpenAPI file is regenerated first.

## API Client Contract

- Axios instance lives in `src/shared/api/api.ts`.
- Browser-only auth/refresh interceptors live in `src/shared/api/interceptors.ts`.
- `src/shared/api/api.ts` must stay Node-safe because Orval imports it during generation.
- Access tokens are returned in auth response bodies.
- Refresh tokens are delivered by the backend as an `HttpOnly` cookie and are not available to frontend code.

## Structure

The client follows the repository FSD contract:

```text
app -> pages -> widgets -> features -> entities -> shared
```

Important surfaces:

- `/login` — auth UI.
- `/admin/tests` — tests authoring workspace.
- `/admin/prompts` — Prompt Studio.
- `/admin/public-links` — public link lifecycle and STANDARD branding builder.
- `/admin/public-links/stats` — student attempts table.
- `/admin/analytics` — test analytics report and XLSX/PDF export.
- `/admin/settings` — OpenRouter status and profession atlas URL settings.
- `/t/:code`, `/t/:code/session/:sessionToken`, `/t/:code/result/:sessionToken` — public student flow.

Public student pages are wrapped in `PublicThemeLayout`. `STANDARD` pages may receive per-link `publicBranding`; `POLUS` keeps its dedicated scoped assets/styles and ignores the branding builder. Run pages use debounce autosave before manual save or finish actions.

## Verification Notes

For changes under `client/`, recreate the frontend container before frontend-related verification from the repository root:

```powershell
docker compose up -d --build --force-recreate frontend
```

Then run the targeted client checks, or the root gates (`npm run verify:local`, `npm run verify:template`) when appropriate.
