# 🏗️ Codebase Expert Analysis

## 1. 🦅 Executive Summary (Step-back)
This is a modern, full-stack application (NestJS/React) designed as a high-quality "template" for rapid AI-assisted development. It exhibits exceptional architectural discipline, enforcing strict Feature-Sliced Design (FSD) on the frontend and clean modular separation on the backend. The system integrates advanced patterns like database versioning for domain entities ("Tests") and runtime API discovery. While the codebase is robust, the "Admin" module is becoming a potential monolith, and the complexity of the "Tests" domain logic warrants careful maintenance to prevent regression.

## 2. 🗺️ Architecture Overview (Top-Down)
* **Tech Stack & Environment:** NestJS, Prisma (PostgreSQL), React 19, Vite, TanStack Query, Orval, Tailwind/shadcn. Infrastructure managed via Docker Compose (`postgres`, `adminer`).
* **System Design:**
    *   **Backend:** Modular Monolith with strict DTO/Validation layers (`nestjs-zod`) and Swagger documentation.
    *   **Frontend:** Strict Feature-Sliced Design (FSD) enforced by linting rules and custom scripts (`verify:architecture`).
    *   **Data Access:** Type-safe database access via Prisma with Zod schema generation.
* **Entry Points:**
    *   **Backend:** `server/src/main.ts` bootstraps the NestJS application.
    *   **Frontend:** `client/src/main.tsx` mounts `App.tsx`, which handles runtime configuration and routing.

## 3. 🔗 Dependency Map (Module Level)
*   `AppModule` (Root) -> depends on -> `AuthModule`, `AdminModule`, `TestsModule` (Reason: Core features).
*   `AdminModule` -> depends on -> `AdminService` (Reason: Aggregates User management, Prompts, and Dashboard logic).
*   `TestsModule` -> depends on -> `TestsService` (Reason: Core domain logic for Tests).
*   `TestsService` -> depends on -> `TestsQuestionService` (Reason: Granular operations on questions).
*   `Client App` -> depends on -> `Pages` (Reason: Route composition) -> `Widgets` (Reason: Complex UI blocks) -> `Features` (Reason: Business logic) -> `Entities` (Reason: Domain models) -> `Shared` (Reason: Reusable utilities/UI).
*   `Frontend API Layer` -> depends on -> `server/openapi.json` (Reason: Orval generation for type-safe API clients).

## 4. 🔬 Code Health & Technical Debt (Deep Dive)
* **Strengths:**
    *   **Strict Architecture:** The project uses `verify:architecture` and `features.manifest.json` to enforce structure, preventing "spaghetti code" effectively.
    *   **Type Safety:** End-to-end type safety from DB (Prisma) to API (Zod) to Frontend (Orval) minimizes runtime errors.
    *   **Operational Maturity:** Comprehensive scripts for verification, testing, and linting (`verify:template`) ensure high code quality.
* **Technical Debt & Vulnerabilities:**
    *   **God Controller Risk:** `AdminController` currently handles disparate concerns (User management, Analytics, AI Prompts). As features grow, this will violate Single Responsibility Principle.
    *   **Complex Domain Logic:** `TestsService` contains intricate transactional logic for publishing and versioning topics. This is a high-risk area for bugs if not covered by extensive integration tests.
    *   **Tight Coupling:** The `features.manifest.json` mechanism, while powerful for generation, creates a rigid coupling between frontend and backend file structures that may hinder refactoring.
* **Actionable Recommendations:**
    1.  **Refactor Admin Module:** Split `AdminModule` into sub-modules (e.g., `AdminUsersModule`, `AdminPromptsModule`) to improve maintainability and separation of concerns.
    2.  **Enhance Test Coverage:** Prioritize integration tests for `TestsService.publishTopic` and versioning logic to ensure data integrity during complex state transitions.
    3.  **Decouple Manifest:** Consider loosening the strict file-path validation in `features.manifest.json` for "custom" features to allow more flexibility in folder structure while keeping the core template strict.
