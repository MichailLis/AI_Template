import {
  AdminTestAnalyticsQuerySchema,
  AdminTestAnalyticsSummarySchema,
} from './tests-analytics.dto';

describe('AdminTestAnalyticsQuerySchema', () => {
  it('applies query defaults', () => {
    const result = AdminTestAnalyticsQuerySchema.parse({});

    expect(result).toEqual({
      scope: 'TOPIC',
      linkStatus: 'ALL',
    });
  });

  it('parses publicLinkId from string for PUBLIC_LINK scope', () => {
    const result = AdminTestAnalyticsQuerySchema.parse({
      scope: 'PUBLIC_LINK',
      publicLinkId: '12',
      linkStatus: 'ACTIVE',
      dateFrom: '2026-05-01',
      dateTo: '2026-05-19',
    });

    expect(result.publicLinkId).toBe(12);
    expect(result.scope).toBe('PUBLIC_LINK');
    expect(result.linkStatus).toBe('ACTIVE');
    expect(result.dateFrom).toBe('2026-05-01');
  });

  it('requires publicLinkId when scope is PUBLIC_LINK', () => {
    const result = AdminTestAnalyticsQuerySchema.safeParse({
      scope: 'PUBLIC_LINK',
      linkStatus: 'ACTIVE',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'publicLinkId' && issue.code === 'custom',
      ),
    ).toBe(true);
  });

  it('rejects inverted date filters', () => {
    const result = AdminTestAnalyticsQuerySchema.safeParse({
      dateFrom: '2026-05-20',
      dateTo: '2026-05-19',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'dateTo' && issue.code === 'custom',
      ),
    ).toBe(true);
  });
});

describe('AdminTestAnalyticsSummarySchema', () => {
  it('accepts minimal valid response structure', () => {
    const result = AdminTestAnalyticsSummarySchema.parse({
      topic: {
        topicId: 1,
        slug: 'prof-orientation',
        title: 'Профориентационный тест',
        questionCount: 20,
        generatedAt: '2026-05-20T00:00:00.000Z',
      },
      filters: {
        scope: 'TOPIC',
        publicLinkId: null,
        linkStatus: 'ALL',
        dateFrom: null,
        dateTo: null,
      },
      coverage: {
        publicLinks: 1,
        attemptsTotal: 2,
        attemptsCompleted: 2,
        analysisReady: 2,
        analysisPending: 0,
        analysisFailed: 0,
        analysisMissing: 0,
        v3Results: 2,
      },
      directions: [],
      directionPairs: [],
      scoreAverages: [],
      profiles: [],
      confidence: {
        levels: [],
        gap: { value: 2, total: 2 },
        consistencyIndex: { value: 3, total: 2 },
        readinessTop: { value: 85, total: 2 },
      },
      flags: [],
      publicLinks: [],
      groups: [],
      demographics: {
        gender: [],
        ageRange: [],
        residence: [],
        educationLevel: [],
      },
      attempts: [
        {
          attemptId: 1,
          publicLinkId: 10,
          shortCode: 'ABC123',
          startedAt: '2026-05-18T08:30:00.000Z',
          finishedAt: '2026-05-18T08:45:00.000Z',
          status: 'COMPLETED',
          analysisStatus: 'READY',
        },
      ],
    });

    expect(result.attempts).toHaveLength(1);
    expect(result.filters.publicLinkId).toBeNull();
    expect(typeof result.topic.generatedAt).toBe('string');
  });

  it('uses only string types for date-like fields', () => {
    const result = AdminTestAnalyticsSummarySchema.parse({
      topic: {
        topicId: 1,
        slug: 'prof-orientation',
        title: 'Профориентационный тест',
        questionCount: 20,
        generatedAt: '2026-05-20',
      },
      filters: {
        scope: 'TOPIC',
        publicLinkId: null,
        linkStatus: 'ALL',
        dateFrom: null,
        dateTo: null,
      },
      coverage: {
        publicLinks: 0,
        attemptsTotal: 0,
        attemptsCompleted: 0,
        analysisReady: 0,
        analysisPending: 0,
        analysisFailed: 0,
        analysisMissing: 0,
        v3Results: 0,
      },
      directions: [],
      directionPairs: [],
      scoreAverages: [],
      profiles: [],
      confidence: {
        levels: [],
        gap: { value: 0, total: 0 },
        consistencyIndex: { value: 0, total: 0 },
        readinessTop: { value: 0, total: 0 },
      },
      flags: [],
      publicLinks: [],
      groups: [],
      demographics: {
        gender: [],
        ageRange: [],
        residence: [],
        educationLevel: [],
      },
      attempts: [],
    });

    expect(typeof result.topic.generatedAt).toBe('string');
    expect(result.attempts[0]).toBeUndefined();
  });
});
