import ExcelJS from 'exceljs';

import { TestsAnalyticsExportService } from './tests-analytics-export.service';
import { TestsAnalyticsPdfRendererService } from './tests-analytics-pdf-renderer.service';
import type { AdminTestAnalyticsSummaryDto } from './dto/tests-analytics.dto';

const createSummary = (title: string): AdminTestAnalyticsSummaryDto => ({
  topic: {
    topicId: 1,
    slug: 'sample-topic',
    title,
    questionCount: 24,
    generatedAt: '2026-05-20T10:00:00.000Z',
  },
  filters: {
    scope: 'TOPIC',
    publicLinkId: null,
    linkStatus: 'ALL',
    dateFrom: '2026-05-01',
    dateTo: '2026-05-20',
  },
  coverage: {
    publicLinks: 2,
    attemptsTotal: 3,
    attemptsCompleted: 2,
    analysisReady: 2,
    analysisPending: 0,
    analysisFailed: 1,
    analysisMissing: 0,
    v3Results: 2,
  },
  directions: [
    { id: 'A1', label: 'Аналитика', count: 2, share: 66.7 },
    { id: 'B2', label: 'Кодирование', count: 1, share: 33.3 },
  ],
  directionPairs: [
    {
      primaryDirectionId: 'A1',
      secondaryDirectionId: 'B2',
      label: 'Аналитика + Кодирование',
      count: 1,
      share: 33.3,
    },
  ],
  scoreAverages: [
    { id: 'A1', label: 'Аналитика', average: 72.2 },
    { id: 'B2', label: 'Кодирование', average: 64.4 },
  ],
  profiles: [
    { profileType: 'single_profile', label: 'Ведущее направление', count: 1, share: 50 },
    { profileType: 'mixed_profile', label: 'Смешанный профиль', count: 1, share: 50 },
  ],
  confidence: {
    levels: [
      { label: 'high', count: 1, share: 50 },
      { label: 'low', count: 1, share: 50 },
    ],
    gap: { value: 11.5, total: 2 },
    consistencyIndex: { value: 8.2, total: 2 },
    readinessTop: { value: 9.1, total: 2 },
  },
  flags: [
    {
      flag: 'readiness_conflict',
      label: 'Готовность к ведущему направлению пока низкая',
      count: 1,
      share: 33.3,
    },
  ],
  publicLinks: [
    {
      publicLinkId: 10,
      shortCode: 'LINK-10',
      title: 'Основная ссылка',
      archivedAt: null,
      attemptsTotal: 2,
      attemptsCompleted: 2,
      analysisReady: 2,
      share: 66.7,
    },
  ],
  groups: [
    {
      educationOrganization: 'Школа №1',
      groupOrClass: '10А',
      attemptsTotal: 2,
      attemptsCompleted: 1,
      analysisReady: 1,
      share: 66.7,
    },
  ],
  demographics: {
    gender: [
      { label: 'FEMALE', count: 1, share: 33.3 },
      { label: 'MALE', count: 2, share: 66.7 },
    ],
    ageRange: [{ label: '18+', count: 3, share: 100 }],
    residence: [{ label: 'Москва', count: 2, share: 66.7 }],
    educationLevel: [{ label: 'SECONDARY_GENERAL', count: 3, share: 100 }],
  },
  attempts: [
    {
      attemptId: 101,
      publicLinkId: 10,
      shortCode: 'LINK-10',
      startedAt: '2026-05-10T10:00:00.000Z',
      finishedAt: '2026-05-10T10:05:00.000Z',
      status: 'COMPLETED',
      analysisStatus: 'READY',
    },
    {
      attemptId: 102,
      publicLinkId: 10,
      shortCode: 'LINK-10',
      startedAt: '2026-05-11T09:00:00.000Z',
      finishedAt: null,
      status: 'IN_PROGRESS',
      analysisStatus: null,
    },
  ],
});

describe('TestsAnalyticsExportService', () => {
  const service = new TestsAnalyticsExportService(new TestsAnalyticsPdfRendererService());
  const requiredSheetNames = [
    'Сводка',
    'Направления',
    'Пары направлений',
    'Публичные ссылки',
    'Группы',
    'Демография',
    'Прохождения',
  ];

  it('exports summary to XLSX buffer and creates required sheets', async () => {
    const summary = createSummary('Сводный отчет');
    const buffer = await service.toExcel(summary);
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const sheetNames = workbook.worksheets.map((sheet) => sheet.name);

    expect(workbook.worksheets.length).toBeGreaterThanOrEqual(requiredSheetNames.length);
    expect(sheetNames).toEqual(expect.arrayContaining(requiredSheetNames));
  });

  it('exports summary to PDF buffer with expected header', async () => {
    const summary = createSummary('PDF отчёт');
    const buffer = await service.toPdf(summary);
    const prefix = buffer.slice(0, 4).toString('utf8');

    expect(prefix).toBe('%PDF');
  });

  it('generates PDF for title with Cyrillic characters', async () => {
    const summary = createSummary('Отчёт: профильный анализ');

    const pdfBuffer = await service.toPdf(summary);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.slice(0, 4).toString('utf8')).toBe('%PDF');
  });
});
