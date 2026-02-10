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
   - **CRITICAL (Date Handling):** Swagger UI cannot represent the `Date` type in JSON Schema. 
   - When creating **Response DTOs**, always override Prisma's `Date` fields with `z.string()`:
     ```typescript
     export const MyResponseSchema = MySchema.extend({
       createdAt: z.string(),
       updatedAt: z.string(),
     });
     ```
3. **Controller Documentation:** 
   - **CRITICAL:** Always use `@ApiResponse({ type: MyResponseDto })` (or `[MyResponseDto]` for arrays) in your controllers. 
   - Without this, Orval will not generate the corresponding TypeScript models on the frontend.
4. **Logic:** Implement business logic in `src/<name>/service.ts`.
5. **Verify:** Open `http://localhost:3000/api` to ensure Swagger is correctly typed.

### Phase 3: Frontend Integration (FSD Implementation)
1. **Sync API Hooks:** 
   - **CRITICAL:** The backend **must be running** and updated with new DTOs.
   - Run in root: `npm run gen:api`.
   - *Result: Typed React Query hooks and Models are generated in `client/src/shared/api/generated`.*
2. **Implement Features:** Create interactive components in `client/src/features/<feature-name>`.
3. **Data Fetching:** Always use the generated TanStack Query hooks. 
   - Since our axios interceptor unwraps `{ success: true, data: ... }`, the hooks return the payload directly.
   - If TypeScript inference fails, use explicit casting: `const items = data as unknown as MyResponseDto[]`.
4. **Public API Rule:** Every FSD slice (`entities/*`, `features/*`) **must** have an `index.ts` file (Barrel) that exports only what's needed externally.
5. **Routing:** Register pages in `client/src/app/App.tsx`.

### Phase 4: Verification & Static Analysis
1. **Linting:** Run `npm run lint` from root.
2. **Commit:** `git commit` triggers `lint-staged`.
   - **Zero-Warning Policy:** Commits will fail if there are any linting errors or FSD violations.

---

## 📂 Frontend FSD Structure
- `src/app`: Global initialization (providers, App.tsx, styles).
- `src/pages`: Composition of widgets/features into full screens.
- `src/widgets`: Large, independent self-contained blocks (e.g., Header).
- `src/features`: Interactive business actions (e.g., `LoginForm`).
- `src/entities`: Business domain logic, data models, and stores.
- `src/shared`: Reusable infrastructure (UI kit, API client, utils).

---

## 🤖 AI Workflow & Commands
- **Backend Generation:** `npm run gen:nest <name>` (From root).
- **API Sync:** `npm run gen:api` (Backend must be running).
- **UI Components:** `npx shadcn@latest add <component-name>` (From `client` dir).
- **Format All:** `npm run format` (From root).

---

## 🛡 Best Practices & Constraints
1. **No `any`**: Use inferred Zod types or generated API models.
2. **Strict FSD**: No cross-imports between features.
3. **Response Format**: Always `{ "success": true, "data": { ... } }`.
4. **Type Safety**: Use `import type` for all TypeScript types to ensure compatibility with Vite's build process.

## 🚦 How to Start Development
```powershell
npm install
npm run dev
```