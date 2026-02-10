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
2. **Define DTOs:** Use `nestjs-zod`.
   - **CRITICAL:** Swagger UI cannot represent the `Date` type in JSON Schema. 
   - When using auto-generated Prisma schemas for **Response DTOs**, always override Date fields with strings:
     ```typescript
     export const MyResponseSchema = MySchema.extend({
       createdAt: z.string(),
       updatedAt: z.string(),
     });
     ```
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
4. **Data Fetching:** Always use the generated TanStack Query hooks. Never use `useEffect` or raw `axios`.
5. **UI Components:** Add via Shadcn to `client/src/shared/ui`.
6. **Routing:** Register the new page in `client/src/app/App.tsx`.

### Phase 4: Verification & Static Analysis
1. **Linting:** Run `npm run lint` from root.
2. **Commit:** `git commit` triggers `lint-staged`.
   - **Zero-Warning Policy:** Commits will fail if there are any linting errors.

---

## 🛡 Best Practices & Constraints
1. **No `any`**: Use inferred Zod types or generated API models.
2. **Strict FSD**: Don't cross-import between features. Use the `shared` layer.
3. **Response Format**: Always `{ "success": true, "data": { ... } }`.
4. **Imports**: Always use `@/` path aliases. Relative paths between layers are forbidden.
5. **Type Safety**: Use `import type` for all TypeScript types to ensure compatibility with Vite's build process (`verbatimModuleSyntax` is enabled).

## 🚦 How to Start Development
```powershell
npm install
npm run dev
```
This starts both frontend and backend concurrently.
