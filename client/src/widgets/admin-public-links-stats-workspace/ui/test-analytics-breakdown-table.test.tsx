import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';

import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';

const createSummary = (
  attempts: AdminTestAnalyticsSummaryDto['attempts'],
): AdminTestAnalyticsSummaryDto => ({
  topic: {
    topicId: 1,
    slug: 'topic-1',
    title: 'Тест',
    questionCount: 10,
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
    attemptsTotal: attempts.length,
    attemptsCompleted: attempts.length,
    analysisReady: attempts.length,
    analysisPending: 0,
    analysisFailed: 0,
    analysisMissing: 0,
    v3Results: attempts.length,
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
  attempts,
});

describe('TestAnalyticsBreakdownTables', () => {
  it('renders LLM status badges for failed, pending, and ready attempts in analytics attempts table', () => {
    const summary = createSummary([
      {
        attemptId: 201,
        publicLinkId: 1,
        shortCode: 'LINK1',
        startedAt: '2026-05-18T08:30:00.000Z',
        finishedAt: '2026-05-18T08:45:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        llmStatus: 'failed',
      },
      {
        attemptId: 202,
        publicLinkId: 1,
        shortCode: 'LINK2',
        startedAt: '2026-05-18T09:30:00.000Z',
        finishedAt: '2026-05-18T09:45:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        llmStatus: 'pending',
      },
      {
        attemptId: 203,
        publicLinkId: 1,
        shortCode: 'LINK3',
        startedAt: '2026-05-18T10:30:00.000Z',
        finishedAt: '2026-05-18T10:45:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        llmStatus: 'ready',
      },
      {
        attemptId: 204,
        publicLinkId: 1,
        shortCode: 'LINK4',
        startedAt: '2026-05-18T11:30:00.000Z',
        finishedAt: '2026-05-18T11:45:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        llmStatus: 'not_requested',
      },
    ]);

    render(<TestAnalyticsBreakdownTables summary={summary} formatDateTime={(v) => v ?? '—'} />);

    expect(screen.getByText('ИИ ошибка')).toBeInTheDocument();
    expect(screen.getByText('ИИ в обработке')).toBeInTheDocument();
    expect(screen.getByText('ИИ готов')).toBeInTheDocument();
    expect(screen.getByText('ИИ не запрашивался')).toBeInTheDocument();
  });
});
