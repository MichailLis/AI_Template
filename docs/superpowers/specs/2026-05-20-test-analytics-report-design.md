# Test Analytics Summary Report Design

## Context

The admin area already has `/admin/public-links/stats`, but it is centered on one public link. The required "Сводный аналитический отчет" must work at the test topic level and combine attempts from all public links for that test.

Prof-orientation v3+ already stores deterministic methodology output in `TestStudentAnalysis.summary` with `resultKind = "prof_orientation_v3_plus"`. `finishSession` stores this algorithmic result as `READY` before LLM enrichment starts. LLM enrichment only writes under `summary.llm`, so aggregate analytics must use deterministic fields.

## Goals

1. Build a topic-level analytics report across all public links of a selected test.
2. Support the same report by one selected public link.
3. Reuse the same report model for screen, Excel export, and PDF export.
4. Reuse existing admin UI elements and keep the page table-first.
5. Avoid changing the v3+ scoring algorithm or using LLM prose as numeric data.

## Scope And Filters

The report is addressed by `topicId` and supports:

- `scope`: `TOPIC` or `PUBLIC_LINK`, default `TOPIC`;
- `publicLinkId`: required only for `PUBLIC_LINK`;
- `linkStatus`: `ALL`, `ACTIVE`, or `ARCHIVED`, default `ALL`;
- `dateFrom` and `dateTo`: optional attempt start date bounds.

`TOPIC` includes all public links whose topic version belongs to the selected test topic. Archived links are included by default because archive disables future access without removing history.

## Report Sections

Coverage counts:

- public links count;
- total attempts;
- completed attempts;
- analysis ready/pending/failed/missing;
- completed v3+ results included in numeric aggregates.

V3+ aggregate sections:

- primary direction distribution;
- primary + secondary direction pairs;
- average score by each of the six directions;
- profile type distribution;
- confidence level distribution and averages for `gap`, `consistencyIndex`, `readinessTop`;
- warning flag counts;
- breakdown by public link;
- breakdown by organization and group/class;
- demographics by gender, age range, residence, and education level when available;
- attempt rows for drill-down and export.

## Backend Design

Add a dedicated analytics surface under the tests module:

- `TestsAnalyticsService`: fetches attempts and builds the summary.
- `TestsAnalyticsExportService`: serializes the same summary to Excel/PDF.
- `TestsAdminAnalyticsController`: exposes summary and export endpoints.

Endpoints:

```text
GET /admin/tests/topics/:topicId/analytics/summary
GET /admin/tests/topics/:topicId/analytics/export.xlsx
GET /admin/tests/topics/:topicId/analytics/export.pdf
```

The export endpoints accept the same query filters as the JSON summary endpoint.

## Frontend Design

Extend `/admin/public-links/stats` instead of adding a parallel first-screen page.

The page structure:

1. Filters card: test, report scope, optional public link, link status, date bounds.
2. Compact summary cards for coverage and report quality.
3. Tables for directions, profile/confidence, public links, groups, demographics.
4. Existing attempts table and individual attempt dialog remain available for drill-down.
5. Export actions sit near the report header.

Use existing project UI first:

- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`;
- `Button`, `Badge`, `Label`;
- `AdminDataTable`, `AdminPagination`, `AdminStateBlock`;
- `adminClassNames`, `adminBadgeClassNames`, `adminToneClassNames`;
- `lucide-react` icons.

Do not add a chart library in the first implementation. Use compact CSS bars inside tables/cards for shares.

## Exports

Excel workbook sheets:

- `Сводка`;
- `Направления`;
- `Пары направлений`;
- `Публичные ссылки`;
- `Группы`;
- `Демография`;
- `Прохождения`.

PDF:

- title and filter metadata;
- key coverage numbers;
- leading direction distribution;
- profile and confidence distributions;
- public-link and group breakdowns;
- methodology note that the report is based on deterministic v3+ scoring.

PDF generation must prove Cyrillic support before being exposed in the UI.

## Errors

- Missing or inaccessible topic returns `404`.
- `scope = PUBLIC_LINK` without `publicLinkId` returns validation error.
- `publicLinkId` outside the selected topic returns `404`.
- Empty report scope returns coverage counts and empty aggregate arrays.

## Verification

Backend tests cover topic scope, public-link scope, archived-link inclusion, v3+ aggregation, coverage counts, and exports.

Frontend tests cover filters, report rendering, empty state, and export buttons.

Because files under `client/` will change, rebuild the frontend container before frontend-related verification:

```powershell
docker compose up -d --build --force-recreate frontend
```
