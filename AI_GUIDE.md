# AI Agent Programming Guide - Fullstack Base Project

Welcome! This project is a production-ready boilerplate built with **NestJS**, **React 19**, **Prisma 7**, and **PostgreSQL**. It is designed for maximum scalability, type safety, and developer efficiency.

## 🚀 Tech Stack
- **Backend:** NestJS, Prisma 7, PostgreSQL, JWT (Passport), Zod, Swagger.
- **Frontend:** React 19, Vite, TanStack Query, Orval (Auto-API), Zustand, Tailwind CSS, Shadcn UI.
- **Infrastructure:** Docker Compose (Postgres + Adminer).
- **Architecture:** Feature-Sliced Design (FSD) on Frontend.

---

## 🛠 Feature Implementation Pipeline (Workflow)

Follow these steps exactly to maintain architectural integrity:

### Phase 1: Data Modeling
1. **Modify Schema:** Add new models to `server/prisma/schema.prisma`.
2. **Sync & Generate:** 
   ```powershell
   cd server; npx prisma generate; npx prisma db push
   ```

### Phase 2: Backend API
1. **Scaffold Resource:** Use the custom schematic:
   ```powershell
   npx nest g -c ./schematics/collection.json resource <name>
   ```
2. **Define DTOs:** In `src/<name>/dto` using `nestjs-zod`.
3. **Logic:** Implement in `src/<name>/service.ts`.

### Phase 3: Frontend Integration (FSD Style)
1. **Sync API Hooks:** Run `npm run gen:api` to update `src/shared/api/generated`.
2. **Create Feature:** If it's a user action, add logic to `src/features/<feature-name>`.
3. **Create Entity:** If it's a business object (data + store), add to `src/entities/<entity-name>`.
4. **Data Fetching:** Always use generated TanStack Query hooks.
5. **UI Components:** Add via Shadcn to `src/shared/ui`.
6. **Routing:** Add pages to `src/pages` and register in `src/app/App.tsx`.

---

## 📂 Frontend FSD Structure
- `src/app`: Initialization (providers, App.tsx, global styles).
- `src/pages`: Entire screens.
- `src/widgets`: Large independent UI blocks.
- `src/features`: User actions (e.g., `LoginForm`, `CreateTask`).
- `src/entities`: Business entities (e.g., `session`, `user`, `product`).
- `src/shared`: Reusable tools (UI kit, API client, utils).

---

## 🤖 AI Workflow & Commands
- **Backend Generation:** `npx nest g -c ./server/schematics/collection.json resource <name>`
- **API Sync:** `npm run gen:api` (Backend must be running).
- **UI Components:** `npx shadcn@latest add <component-name>` (From `client` dir).

---

## 🛡 Best Practices
1. **No `any`**: Use inferred Zod types.
2. **No `useEffect` for Fetching**: Use TanStack Query hooks.
3. **Standard Errors**: Server always returns `{ success: false, error: { message, code, details } }`.
4. **Imports**: Use `@/` aliases (e.g., `@/shared/ui/button`).

## 🚦 How to Start Development
```powershell
npm install
npm run dev
```
This starts both frontend and backend concurrently.
