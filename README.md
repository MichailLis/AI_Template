# Fullstack Base Project (NestJS + React 19 + Prisma 7 + FSD)

A modern, industrial-grade boilerplate designed for high scalability, developer efficiency, and **AI-driven development**.

## 🚀 Key Features
- **Backend:** NestJS with Prisma 7, PostgreSQL, and official PG adapters.
- **Frontend:** React 19, Vite 7, Tailwind CSS, and Shadcn UI.
- **Architecture:** **Feature-Sliced Design (FSD)** on the frontend for maintainable code.
- **Authentication:** Secure JWT-based auth (Access + Refresh tokens) with **Argon2** hashing.
- **Automation:** 
  - Custom NestJS Schematics for "one-click" resource generation.
  - **Orval + TanStack Query** for automatic API client generation from Swagger.
  - Auto-generated Zod schemas from Prisma models.
- **Documentation:** Integrated Swagger UI and a specialized `AI_GUIDE.md` for AI agents.

## 🛠 Prerequisites
- **Node.js** (v20 or higher recommended)
- **Docker Desktop** (to run PostgreSQL)

## 🚦 Getting Started

### 1. Clone and Install
```powershell
npm install
npm run install:all
```

### 2. Launch Infrastructure
Make sure Docker is running, then start the database:
```powershell
docker-compose up -d
```

### 3. Run Development Servers
```powershell
npm run dev
```
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:3000`
- **API Docs (Swagger):** `http://localhost:3000/api`
- **DB Admin (Adminer):** `http://localhost:8080` (Server: `postgres`, User: `user`, Pass: `password`)

---

## ⚡ Essential Commands

### Automated Code Generation
- `npm run gen:nest` — Create a new backend module (with Prisma & Auth injected).
- `npm run gen:api` — Sync frontend API hooks with backend (requires backend to be running).

### Database Management
- `npm run prisma:generate` — Update Prisma Client and Zod types.
- `npm run prisma:studio` — Open Prisma's visual database editor.

---

## 📂 Project Structure
- `/server` — NestJS application.
  - `src/schematics/` — Custom code generation blueprints.
  - `src/generated/` — Auto-generated Prisma/Zod types.
- `/client` — React application following FSD.
  - `src/app/` — Global providers and config.
  - `src/pages/` — Application screens.
  - `src/features/` — User interactions (logic).
  - `src/entities/` — Business domain objects.
  - `src/shared/` — Reusable components and API.
- `AI_GUIDE.md` — **Must-read** for AI Agents and automated development.

## 🛡 License
UNLICENSED
