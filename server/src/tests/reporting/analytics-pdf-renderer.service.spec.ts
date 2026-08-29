import { TestsAnalyticsPdfRendererService } from '../reporting/analytics-pdf-renderer.service';
import type { AdminTestAnalyticsSummaryDto } from '../dto/tests-analytics.dto';

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
    publicLinks: 1,
    attemptsTotal: 2,
    attemptsCompleted: 1,
    analysisReady: 1,
    analysisPending: 0,
    analysisFailed: 0,
    analysisMissing: 1,
    v3Results: 1,
  },
  directions: [{ id: 'A1', label: 'Аналитика', count: 1, share: 50 }],
  directionPairs: [
    {
      primaryDirectionId: 'A1',
      secondaryDirectionId: 'B2',
      label: 'Аналитика + Кодирование',
      count: 1,
      share: 50,
    },
  ],
  scoreAverages: [],
  profiles: [{ profileType: 'single_profile', label: 'Ведущее направление', count: 1, share: 50 }],
  confidence: {
    levels: [],
    gap: { value: 11.5, total: 1 },
    consistencyIndex: { value: 8.2, total: 1 },
    readinessTop: { value: 9.1, total: 1 },
  },
  flags: [],
  publicLinks: [
    {
      publicLinkId: 10,
      shortCode: 'LINK-10',
      title: 'Основная ссылка',
      archivedAt: null,
      attemptsTotal: 2,
      attemptsCompleted: 1,
      analysisReady: 1,
      share: 100,
    },
  ],
  groups: [
    {
      educationOrganization: 'Школа №1',
      groupOrClass: '10А',
      attemptsTotal: 2,
      attemptsCompleted: 1,
      analysisReady: 1,
      share: 100,
    },
  ],
  demographics: {
    gender: [],
    ageRange: [],
    residence: [],
    educationLevel: [],
  },
  attempts: [],
});

describe('TestsAnalyticsPdfRendererService', () => {
  const service = new TestsAnalyticsPdfRendererService();

  it('renders summary to PDF buffer with expected header', async () => {
    const summary = createSummary('PDF отчёт');
    const buffer = await service.render(summary);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString('utf8')).toBe('%PDF');
  });

  it('renders PDF for title with Cyrillic characters', async () => {
    const summary = createSummary('Отчёт: профильный анализ');
    const buffer = await service.render(summary);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 4).toString('utf8')).toBe('%PDF');
  });
});
