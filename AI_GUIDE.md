# AI Agent Programming Guide - Fullstack Base Project

Welcome! This project is a production-ready boilerplate built with **NestJS**, **React 19**, **Prisma 7**, and **PostgreSQL**. It is designed for maximum scalability, type safety, and developer efficiency.

## 🚀 Tech Stack
- **Backend:** NestJS, Prisma 7, PostgreSQL, JWT (Passport), Zod, Swagger.
- **Frontend:** React 19, Vite, TanStack Query, Orval (Auto-API), Zustand, Tailwind CSS, Shadcn UI.
- **Infrastructure:** Docker Compose (Postgres + Adminer).
- **Architecture:** Feature-Sliced Design (FSD) on Frontend.
- **Static Analysis:** ESLint (Strict), Prettier, Husky, lint-staged.

---

## 🛠 Feature Implementation Pipeline (Full Workflow)

Follow these steps exactly to maintain architectural integrity:

### Phase 1: Data Modeling (Source of Truth)
1. **Modify Schema:** Add new models to `server/prisma/schema.prisma`.
2. **Sync & Generate:** 
   ```powershell
   npm run prisma:generate # From root
   cd server; npx prisma db push
   ```
   *Result: Prisma Client is updated and Zod schemas are auto-generated in `server/src/generated/zod`.*

### Phase 2: Backend API (Business Logic)
1. **Scaffold Resource:** Use the custom command from the root directory:
   ```powershell
   npm run gen:nest <name>
   ```
   *Note: This automatically creates the module, service, controller, and registers them in AppModule with Prisma & Auth injected.*
2. **Define DTOs:** Create/Update DTOs in `src/<name>/dto` using `nestjs-zod`.
3. **Logic:** Implement business logic in `src/<name>/service.ts`.
4. **Verify:** Use Swagger at `http://localhost:3000/api` to test.

### Phase 3: Frontend Integration (FSD Implementation)
1. **Sync API Hooks:** Ensure backend is running, then run in root:
   ```powershell
   npm run gen:api
   ```
   *Result: Typed React Query hooks are generated in `client/src/shared/api/generated`.*
2. **Define Entities:** If adding a new business object, create `client/src/entities/<name>`.
3. **Implement Features:** For user actions (forms, buttons), create `client/src/features/<name>`.
4. **Public API Rule:** Every FSD slice (`entities/*`, `features/*`) **must** have an `index.ts` file that exports only what's needed externally.
5. **Data Fetching:** Always use the generated TanStack Query hooks. Never use `useEffect` or raw `axios`.
6. **UI Components:** Add via Shadcn to `client/src/shared/ui`.
7. **Assemble Pages:** Create pages in `client/src/pages` by composing features and entities.
8. **Routing:** Register the new page in `client/src/app/App.tsx`.

### Phase 4: Verification & Static Analysis (Quality Gate)
1. **Linting:** Run `npm run lint` from root to ensure code quality.
2. **Formatting:** Run `npm run format` from root to fix styling.
3. **Commit:** `git commit` will automatically trigger `lint-staged` via Husky. 
   - **Zero-Warning Policy:** Commits will fail if there are any linting errors or FSD architectural violations.

---

## 📂 Frontend FSD Structure
- `src/app`: Global initialization (providers, App.tsx, styles).
- `src/pages`: Composition of widgets/features into full screens.
- `src/widgets`: Large, independent self-contained blocks (e.g., Header).
- `src/features`: Interactive business actions (e.g., `LoginForm`, `CreateTask`).
- `src/entities`: Business domain logic, data models, and stores (e.g., `user`, `product`).
- `src/shared`: Reusable infrastructure (UI kit, API client, utility functions).

---

## 🤖 AI Workflow & Commands
- **Backend Generation:** `npm run gen:nest <name>` (From root).
- **API Sync:** `npm run gen:api` (Backend must be running).
- **UI Components:** `npx shadcn@latest add <component-name>` (From `client` dir).
- **Lint All:** `npm run lint` (From root).
- **Format All:** `npm run format` (From root).
- **Database Studio:** `npm run prisma:studio` (From root).

---

## 🛡 Best Practices & Constraints
1. **No `any`**: Use inferred Zod types or generated API models.
2. **Strict FSD**: Don't cross-import between features or entities. Use the `shared` layer for common code.
3. **Response Format**: All responses follow a unified structure:
   - **Success:** `{ "success": true, "data": { ... } }`
   - **Error:** `{ "success": false, "error": { "code": "...", "message": "...", "details": [] } }`
4. **API Client**: The custom axios instance automatically extracts `.data`, so `useQuery` returns the payload directly.
5. **Imports**: Always use `@/` path aliases (e.g., `@/shared/ui/button`). Relative paths between layers are forbidden.
6. **Clean Code**: One FSD slice per folder, always with a public `index.ts`.

## 🚦 How to Start Development
```powershell
npm install
npm run dev
```
This starts both frontend and backend concurrently.
