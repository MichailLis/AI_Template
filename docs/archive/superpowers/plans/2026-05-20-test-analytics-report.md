# Test Analytics Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a test-level "Сводный аналитический отчет" for prof-orientation v3+ with topic-wide aggregation, public-link scoped filtering, and Excel/PDF export.

**Architecture:** Add one backend analytics contract for a test topic and optional public-link scope. The admin stats page consumes that contract and renders compact report sections with existing UI components. Export services reuse the same report object so the screen, Excel, and PDF contain the same numbers.

**Tech Stack:** NestJS, Prisma, Zod DTOs with `createZodDto`, Swagger, React 19, Vite, TanStack Query, Orval, Tailwind, existing shared admin UI, ExcelJS for `.xlsx`, pdfmake for PDF.

---

## Scope Check

This is one feature with three connected parts: backend report model, admin UI, and export. Implement them in separate commits, but keep them in one plan because all outputs must share one report contract.

Before frontend implementation, use:

- `frontend-design:frontend-design` for layout and component composition;
- `build-web-apps:frontend-testing-debugging` for rendered UI verification.

## File Structure

Create:

- `server/src/tests/dto/tests-analytics.dto.ts` - query/response DTO schemas.
- `server/src/tests/dto/tests-analytics.dto.spec.ts` - DTO validation tests.
- `server/src/tests/tests-analytics.types.ts` - internal report records.
- `server/src/tests/tests-analytics-summary.ts` - pure v3+ aggregation helpers.
- `server/src/tests/tests-analytics-summary.spec.ts` - pure aggregation tests.
- `server/src/tests/tests-analytics.service.ts` - Prisma query and report assembly.
- `server/src/tests/tests-analytics.service.spec.ts` - service tests.
- `server/src/tests/tests-analytics-export.service.ts` - Excel/PDF serialization.
- `server/src/tests/tests-analytics-export.service.spec.ts` - export tests.
- `server/src/tests/tests-admin-analytics.controller.ts` - admin endpoints.
- `server/src/tests/tests-admin-analytics.controller.spec.ts` - controller tests.
- `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-summary-card.tsx` - KPI section.
- `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-breakdown-table.tsx` - reusable breakdown table.
- `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-export-actions.tsx` - export buttons.
- `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-download.ts` - binary download helper.

Modify:

- `server/src/tests/tests-attempts.module.ts` - register controller/providers.
- `server/package.json` and `server/package-lock.json` - add export dependencies.
- `server/src/openapi.json` and generated client files after `npm run gen:api`.
- `client/src/widgets/admin-public-links-stats-workspace/ui/use-admin-public-links-stats-workspace.ts` - report query state.
- `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-stats-filters-card.tsx` - report filters.
- `client/src/widgets/admin-public-links-stats-workspace/ui/admin-public-links-stats-workspace.tsx` - render report and exports.
- `template/features.manifest.json` only if architecture verification requires a generated API path update.

## Task 1: Add Export Dependencies

**Files:**

- Modify: `server/package.json`
- Modify: `server/package-lock.json`

- [ ] **Step 1: Install dependencies**

```powershell
npm install exceljs pdfmake --prefix server
npm install --save-dev @types/pdfmake --prefix server
```

Expected: `server/package.json` includes `exceljs`, `pdfmake`, and `@types/pdfmake`.

- [ ] **Step 2: Verify dependency tree**

```powershell
npm ls exceljs pdfmake --prefix server
```

Expected: both packages are listed.

- [ ] **Step 3: Commit dependency update**

```powershell
git add server/package.json server/package-lock.json
git commit -m "chore: add report export dependencies"
```

## Task 2: Define Analytics DTO Contract

**Files:**

- Create: `server/src/tests/dto/tests-analytics.dto.ts`
- Create: `server/src/tests/dto/tests-analytics.dto.spec.ts`

- [ ] **Step 1: Write DTO tests**

Create tests for defaults, public-link scope parsing, and a minimal valid response.

```ts
expect(AdminTestAnalyticsQuerySchema.parse({})).toEqual({
  scope: 'TOPIC',
  linkStatus: 'ALL',
});

expect(
  AdminTestAnalyticsQuerySchema.parse({ scope: 'PUBLIC_LINK', publicLinkId: '12' }),
).toMatchObject({ scope: 'PUBLIC_LINK', publicLinkId: 12 });
```

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test --prefix server -- tests-analytics.dto.spec.ts
```

Expected: FAIL because the DTO file does not exist.

- [ ] **Step 3: Implement DTO schemas**

Create:

```ts
export const AdminTestAnalyticsQuerySchema = z.object({
  scope: z.enum(['TOPIC', 'PUBLIC_LINK']).default('TOPIC'),
  publicLinkId: z.coerce.number().int().min(1).optional(),
  linkStatus: z.enum(['ALL', 'ACTIVE', 'ARCHIVED']).default('ALL'),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
});
```

Also define `AdminTestAnalyticsSummarySchema` with `topic`, `filters`, `coverage`, `directions`, `directionPairs`, `scoreAverages`, `profiles`, `confidence`, `flags`, `publicLinks`, `groups`, `demographics`, and `attempts`.

- [ ] **Step 4: Run DTO tests**

```powershell
npm run test --prefix server -- tests-analytics.dto.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit DTO contract**

```powershell
git add server/src/tests/dto/tests-analytics.dto.ts server/src/tests/dto/tests-analytics.dto.spec.ts
git commit -m "feat: define test analytics report contract"
```

## Task 3: Build Pure V3+ Aggregation Helpers

**Files:**

- Create: `server/src/tests/tests-analytics.types.ts`
- Create: `server/src/tests/tests-analytics-summary.ts`
- Create: `server/src/tests/tests-analytics-summary.spec.ts`

- [ ] **Step 1: Write helper tests**

Test these inputs:

- two attempts with different `primaryDirection.id`;
- one mixed profile and one single profile;
- one `readiness_conflict` flag;
- scores for all six directions.

Expected output: direction counts, profile counts, flag counts, and average scores.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test --prefix server -- tests-analytics-summary.spec.ts
```

Expected: FAIL because helper files do not exist.

- [ ] **Step 3: Implement helper functions**

Create pure helpers:

```ts
export const getV3Summary = (value: unknown) =>
  isProfOrientationV3PlusSummary(value) ? value : null;

export const toShare = (count: number, total: number) =>
  total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

export const buildCountShares = (
  counts: Map<string, { label: string; count: number }>,
  total: number,
) =>
  Array.from(counts.entries())
    .map(([id, value]) => ({
      id,
      label: value.label,
      count: value.count,
      share: toShare(value.count, total),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
```

Add `buildV3AnalyticsSections(attempts)` to produce `directions`, `directionPairs`, `scoreAverages`, `profiles`, `confidence`, and `flags`.

- [ ] **Step 4: Run helper tests**

```powershell
npm run test --prefix server -- tests-analytics-summary.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit helper aggregation**

```powershell
git add server/src/tests/tests-analytics.types.ts server/src/tests/tests-analytics-summary.ts server/src/tests/tests-analytics-summary.spec.ts
git commit -m "feat: aggregate prof orientation analytics"
```

## Task 4: Add Backend Analytics Service

**Files:**

- Create: `server/src/tests/tests-analytics.service.ts`
- Create: `server/src/tests/tests-analytics.service.spec.ts`

- [ ] **Step 1: Write service tests**

Cover:

- topic scope includes multiple public links;
- archived links are included by `linkStatus = ALL`;
- public-link scope returns one link;
- non-v3 or missing analysis affects coverage but not v3 aggregates;
- public link from another topic throws `NotFoundException`.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test --prefix server -- tests-analytics.service.spec.ts
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement Prisma query**

Use `ensureTestsAdminAccess`, validate the topic, then query attempts:

```ts
const attempts = await this.prisma.testStudentAttempt.findMany({
  where: {
    topicVersion: { topicId },
    ...(publicLinkId ? { publicLinkId } : {}),
    ...(linkStatus === 'ACTIVE'
      ? { publicLink: { archivedAt: null } }
      : linkStatus === 'ARCHIVED'
        ? { publicLink: { archivedAt: { not: null } } }
        : {}),
  },
  include: {
    publicLink: { select: { id: true, shortCode: true, archivedAt: true } },
    topicVersion: { select: { versionNumber: true } },
    analysis: { select: { status: true, summary: true } },
  },
  orderBy: { startedAt: 'desc' },
});
```

Add `startedAt` date filtering when `dateFrom` or `dateTo` exists.

- [ ] **Step 4: Assemble report sections**

Map each attempt to an internal `AnalyticsAttemptRecord`, call `buildV3AnalyticsSections`, and build coverage, public-link, group, demographic, and attempt-row sections.

- [ ] **Step 5: Run service tests**

```powershell
npm run test --prefix server -- tests-analytics.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit service**

```powershell
git add server/src/tests/tests-analytics.service.ts server/src/tests/tests-analytics.service.spec.ts
git commit -m "feat: build test analytics summary"
```

## Task 5: Add Export Service

**Files:**

- Create: `server/src/tests/tests-analytics-export.service.ts`
- Create: `server/src/tests/tests-analytics-export.service.spec.ts`

- [ ] **Step 1: Write export tests**

Verify:

- Excel buffer loads with ExcelJS;
- workbook has sheets `Сводка`, `Направления`, `Пары направлений`, `Публичные ссылки`, `Группы`, `Демография`, `Прохождения`;
- PDF buffer starts with `%PDF`;
- PDF generation accepts Cyrillic title text.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test --prefix server -- tests-analytics-export.service.spec.ts
```

Expected: FAIL because export service does not exist.

- [ ] **Step 3: Implement Excel export**

Use `ExcelJS.Workbook`, set workbook metadata, add one worksheet per section, set column widths, add rows, bold header rows, and return `Buffer.from(await workbook.xlsx.writeBuffer())`.

- [ ] **Step 4: Implement PDF export**

Use pdfmake with a Cyrillic-capable font configuration. The implementation is accepted only when the Cyrillic PDF test passes. Include title, filters, coverage, directions, profile/confidence, public links, groups, and methodology note.

- [ ] **Step 5: Run export tests**

```powershell
npm run test --prefix server -- tests-analytics-export.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit export service**

```powershell
git add server/src/tests/tests-analytics-export.service.ts server/src/tests/tests-analytics-export.service.spec.ts
git commit -m "feat: export test analytics reports"
```

## Task 6: Add Admin Analytics Controller

**Files:**

- Create: `server/src/tests/tests-admin-analytics.controller.ts`
- Create: `server/src/tests/tests-admin-analytics.controller.spec.ts`
- Modify: `server/src/tests/tests-attempts.module.ts`

- [ ] **Step 1: Write controller tests**

Cover summary delegation, Excel headers, and PDF headers.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test --prefix server -- tests-admin-analytics.controller.spec.ts
```

Expected: FAIL because controller does not exist.

- [ ] **Step 3: Implement routes**

Add:

```ts
GET admin/tests/topics/:topicId/analytics/summary
GET admin/tests/topics/:topicId/analytics/export.xlsx
GET admin/tests/topics/:topicId/analytics/export.pdf
```

Use `@ApiOperation`, `@ApiResponse` for JSON, and `StreamableFile` with `Content-Disposition` for exports.

- [ ] **Step 4: Register providers and controller**

Update the tests module with `TestsAdminAnalyticsController`, `TestsAnalyticsService`, and `TestsAnalyticsExportService`.

- [ ] **Step 5: Run controller tests**

```powershell
npm run test --prefix server -- tests-admin-analytics.controller.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit controller**

```powershell
git add server/src/tests/tests-admin-analytics.controller.ts server/src/tests/tests-admin-analytics.controller.spec.ts server/src/tests/tests-attempts.module.ts
git commit -m "feat: expose test analytics report endpoints"
```

## Task 7: Regenerate API Client

**Files:**

- Modify: `server/src/openapi.json`
- Modify: `client/src/shared/api/generated/tests/*`
- Modify: `client/src/shared/api/model/*`
- Modify: `template/features.manifest.json` if architecture verification reports a generated path gap.

- [ ] **Step 1: Regenerate API**

```powershell
npm run gen:api
```

Expected: summary endpoint appears in the generated tests client.

- [ ] **Step 2: Verify mutator contract**

```powershell
npm run verify:api-mutator
```

Expected: PASS.

- [ ] **Step 3: Commit generated API**

```powershell
git add server/src/openapi.json client/src/shared/api/generated client/src/shared/api/model template/features.manifest.json
git commit -m "chore: regenerate API for analytics report"
```

## Task 8: Add Frontend Report Filters

**Files:**

- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/use-admin-public-links-stats-workspace.ts`
- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/public-links-stats-filters-card.tsx`

- [ ] **Step 1: Write filter tests**

Assert default topic scope, public-link scope selection, and link-status selection.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: FAIL before filter implementation.

- [ ] **Step 3: Add state to workspace hook**

Add `reportScope`, `reportLinkStatus`, and `reportPublicLinkId`. Use generated query options for the summary endpoint when `effectiveTopicId` exists.

- [ ] **Step 4: Extend filters card**

Use existing `Label`, native `select`, and `adminClassNames.form.select`. Add controls for report scope, link status, and optional public link.

- [ ] **Step 5: Run filter tests**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: PASS.

- [ ] **Step 6: Commit filters**

```powershell
git add client/src/widgets/admin-public-links-stats-workspace/ui/use-admin-public-links-stats-workspace.ts client/src/widgets/admin-public-links-stats-workspace/ui/public-links-stats-filters-card.tsx client/src/widgets/admin-public-links-stats-workspace/ui/*.test.tsx
git commit -m "feat: add analytics report filters"
```

## Task 9: Render Report UI

**Files:**

- Create: `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-summary-card.tsx`
- Create: `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-breakdown-table.tsx`
- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/admin-public-links-stats-workspace.tsx`

- [ ] **Step 1: Invoke design skill**

Use `frontend-design:frontend-design` before changing UI files.

- [ ] **Step 2: Write rendering tests**

Mock a summary response and assert coverage cards, direction rows, public-link rows, and empty state.

- [ ] **Step 3: Confirm tests fail**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: FAIL before components exist.

- [ ] **Step 4: Implement summary and breakdown components**

Reuse `Card`, `Badge`, `AdminDataTable`, `TableCell`, `AdminStateBlock`, `adminClassNames`, and `adminBadgeClassNames`. Use compact CSS bars inside table cells for share values.

- [ ] **Step 5: Wire report into workspace**

Render report sections below filters and above the existing attempts table. Preserve current attempt table and detail dialog.

- [ ] **Step 6: Run rendering tests**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: PASS.

- [ ] **Step 7: Commit report UI**

```powershell
git add client/src/widgets/admin-public-links-stats-workspace/ui
git commit -m "feat: render test analytics summary"
```

## Task 10: Add Export Actions

**Files:**

- Create: `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-export-actions.tsx`
- Create: `client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-download.ts`
- Modify: `client/src/widgets/admin-public-links-stats-workspace/ui/admin-public-links-stats-workspace.tsx`

- [ ] **Step 1: Write export tests**

Mock the download helper and assert Excel/PDF buttons call endpoints with current filters.

- [ ] **Step 2: Confirm tests fail**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: FAIL before export actions exist.

- [ ] **Step 3: Implement download helper**

Use existing Axios instance from `@/shared/api/api` in widget code with `responseType: 'blob'`. Create an object URL, click an `<a download>`, and revoke the URL.

- [ ] **Step 4: Implement buttons**

Use existing `Button` and lucide `Download`. Button labels: `Excel` and `PDF`.

- [ ] **Step 5: Run export tests**

```powershell
npm run test:run --prefix client -- admin-public-links-stats-workspace
```

Expected: PASS.

- [ ] **Step 6: Commit export UI**

```powershell
git add client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-export-actions.tsx client/src/widgets/admin-public-links-stats-workspace/ui/test-analytics-download.ts client/src/widgets/admin-public-links-stats-workspace/ui/admin-public-links-stats-workspace.tsx client/src/widgets/admin-public-links-stats-workspace/ui/*.test.tsx
git commit -m "feat: add analytics report export actions"
```

## Task 11: Frontend Docker And Browser Verification

**Files:**

- No planned edits unless verification exposes a defect.

- [ ] **Step 1: Rebuild frontend container**

```powershell
docker compose up -d --build --force-recreate frontend
```

Expected: `ai_template_frontend` is recreated.

- [ ] **Step 2: Run frontend checks**

```powershell
npm run lint --prefix client
npm run build --prefix client
```

Expected: PASS.

- [ ] **Step 3: Invoke frontend debugging skill**

Use `build-web-apps:frontend-testing-debugging`, open `http://localhost:5173/admin/public-links/stats`, and verify desktop/mobile layout, no overlap, export buttons, attempts table, and detail dialog.

- [ ] **Step 4: Commit layout fixes if needed**

```powershell
git add client/src/widgets/admin-public-links-stats-workspace/ui
git commit -m "fix: polish analytics report layout"
```

## Task 12: Full Verification

**Files:**

- No planned edits unless verification exposes a defect.

- [ ] **Step 1: Run targeted backend tests**

```powershell
npm run test --prefix server -- tests-analytics
npm run test --prefix server -- tests-admin-analytics
```

Expected: PASS.

- [ ] **Step 2: Run server build**

```powershell
npm run build --prefix server
```

Expected: PASS.

- [ ] **Step 3: Run local verification**

```powershell
npm run verify:local
```

Expected: PASS.

- [ ] **Step 4: Run template verification**

```powershell
npm run verify:template
```

Expected: PASS.

## Self-Review

Spec coverage:

- Topic-wide report across all links: Tasks 4, 8, 9.
- Public-link scoped report: Tasks 4, 8.
- Deterministic v3+ aggregates: Tasks 3, 4.
- Existing UI elements and design skills: Tasks 8, 9, 11.
- Excel/PDF export: Tasks 1, 5, 6, 10.
- Frontend container rebuild: Task 11.

Placeholder scan:

- The plan uses concrete files, commands, endpoints, and expected outcomes.

Type consistency:

- `scope`, `publicLinkId`, `linkStatus`, `dateFrom`, and `dateTo` are consistent across DTO, service, UI, and exports.
