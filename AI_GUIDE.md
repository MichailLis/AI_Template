# AI Agent Programming Guide - Fullstack Base Project

Welcome! This project is a production-ready boilerplate built with **NestJS**, **React 19**, **Prisma 7**, and **PostgreSQL**. It is designed for maximum scalability, type safety, and developer efficiency.

## 🚀 Tech Stack
- **Backend:** NestJS, Prisma 7, PostgreSQL, JWT (Passport), Zod, Swagger.
- **Frontend:** React 19, Vite, Tailwind CSS, Shadcn UI, Zustand, Axios, Zod.
- **Infrastructure:** Docker Compose (Postgres + Adminer).
- **Automation:** Custom NestJS Schematics for resource generation.

---

## 🛠 Feature Implementation Pipeline (Workflow)

Follow these steps exactly to maintain architectural integrity:

### Phase 1: Data Modeling
1. **Modify Schema:** Add new models to `server/prisma/schema.prisma`.
2. **Sync & Generate:** 
   ```powershell
   cd server; npx prisma generate; npx prisma db push
   ```
   *Result: Prisma Client is updated and Zod schemas are auto-generated in `src/generated/zod`.*

### Phase 2: Backend API
1. **Scaffold Resource:** Use the custom schematic:
   ```powershell
   npx nest g -c ./schematics/collection.json resource <name>
   ```
2. **Define DTOs:** Create/Update DTOs in `src/<name>/dto` using `nestjs-zod` and schemas from `src/generated/zod`.
3. **Logic:** Implement methods in `src/<name>/service.ts`.
4. **Docs:** Add `@ApiOperation` or `@ApiResponse` in `src/<name>/controller.ts`.
5. **Verify:** Check `http://localhost:3000/api` to test the new endpoints.

### Phase 3: Frontend Integration
1. **UI Components:** Add needed Shadcn components:
   ```powershell
   cd client; npx shadcn@latest add <component-name>
   ```
2. **Validation:** Use `zod` and `react-hook-form` in the new page.
3. **API Calls:** Import and use the pre-configured `api` instance from `@/lib/api`.
4. **State:** If global state is needed, update `client/src/lib/store.ts`.
5. **Routing:** Register the new page in `client/src/App.tsx`.

---

## 📂 Project Structure
- `/server`: The NestJS backend.
- `/client`: The Vite React frontend.
- `/server/schematics`: Custom NestJS Schematics for automated code generation.

---

## 🤖 AI Workflow & Commands

### 1. Database & Models
Always use **Prisma** for database interactions. 
- Schema: `server/prisma/schema.prisma`
- **Action:** After modifying the schema, run:
  ```powershell
  cd server
  npx prisma generate
  npx prisma db push
  ```
*Note: Prisma 7 uses Driver Adapters. Check `server/src/prisma.service.ts` for implementation details.*

### 2. Automated Feature Generation (Crucial)
Do **not** create NestJS modules manually. Use the custom schematic which handles Prisma injection, JWT protection, and Swagger documentation automatically.
- **Action:** From the root or `server` directory:
  ```powershell
  cd server
  npm run build:schematics # If templates were modified
  npx nest g -c ./schematics/collection.json resource <feature-name>
  ```
This command:
1. Creates `Module`, `Controller`, and `Service` in `src/<feature-name>`.
2. Automatically registers the module in `AppModule`.
3. Injects `PrismaService` into the new service.
4. Adds `@ApiTags`, `@ApiBearerAuth`, and `@UseGuards(AtGuard)` to the controller.

### 3. Validation (Zod)
We use **Zod** for end-to-end type safety.
- **Backend DTOs:** Use `nestjs-zod`. Example:
  ```typescript
  export class MyDto extends createZodDto(MyZodSchema) {}
  ```
- **Frontend Schemas:** Define in `client/src/lib/schemas.ts`.
- **Auto-generated Schemas:** Prisma models are auto-converted to Zod in `server/src/generated/zod`.

### 4. API & Authentication
- **Swagger:** API docs are available at `http://localhost:3000/api`.
- **Auth:** All private routes should be protected with `@UseGuards(AtGuard)`.
- **Frontend API:** Use the pre-configured axios instance in `client/src/lib/api.ts`. It handles token refresh automatically.

---

## 🛡 Best Practices for AI Agents
1. **Consistency:** Always follow the existing module/service/controller patterns.
2. **Type Safety:** Never use `any`. Use inferred Zod types or explicit interfaces.
3. **Environment Variables:** Use `ConfigService` on the backend and `import.meta.env` on the frontend.
4. **CORS:** Already enabled in `server/src/main.ts`.
5. **Formatting:** One module per line in `AppModule` imports.

## 🚦 How to Start Development
```powershell
# Root directory
npm install
npm run dev
```
This starts both frontend and backend concurrently.

---
*Happy coding, Agent! Follow the patterns, stay typed.*