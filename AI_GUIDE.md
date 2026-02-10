# AI Agent Programming Guide - Fullstack Base Project

Welcome! This project is a production-ready boilerplate built with **NestJS**, **React 19**, **Prisma 7**, and **PostgreSQL**.

## 🚀 Tech Stack
- **Backend:** NestJS, Prisma 7, PostgreSQL, JWT (Passport), Zod, Swagger.
- **Frontend:** React 19, Vite, TanStack Query, Orval (Auto-API), Zustand, Tailwind CSS, Shadcn UI.
- **Infrastructure:** Docker Compose (Postgres + Adminer).
- **Architecture:** Feature-Sliced Design (FSD) on Frontend.

---

## 🛠 Feature Implementation Pipeline (Full Workflow)

### Phase 1: Data Modeling
1. **Modify Schema:** Add models to `server/prisma/schema.prisma`.
2. **Sync & Generate:** 
   ```powershell
   npm run prisma:generate # From root
   cd server; npx prisma db push
   ```

### Phase 2: Backend API
1. **Scaffold Resource:** `npm run gen:nest <name>` (From root).
2. **Define DTOs:** Use `nestjs-zod`. 
   - **IMPORTANT:** Override Prisma `Date` fields with `z.string()` in Response DTOs for Swagger compatibility.
3. **Docs:** Always use `@ApiResponse({ type: MyDto })`.

### Phase 3: Frontend Integration (FSD)
1. **Sync API Hooks:** `npm run gen:api` (Root).
2. **Components:** Use generated TanStack Query hooks. 
   - Types are inferred automatically from the backend DTOs.
3. **State:** Use **Zustand** for client state (`entities/*/model/store.ts`).

---

## 🛡 Best Practices & Constraints
1. **Zero-Warning Policy:** Strict ESLint rules enforced via Husky.
2. **FSD Boundaries:** Never cross-import between features. Use the `shared` layer.
3. **Error Format:** Server always returns a unified error structure on failure:
   ```json
   { "success": false, "error": { "code": "...", "message": "..." } }
   ```
4. **Success Format:** Successful responses return the raw data/DTO directly (standard REST).
5. **Type Safety:** Use `import type` for all TypeScript types.

---
*Happy coding, Agent! Follow the patterns, stay typed.*
