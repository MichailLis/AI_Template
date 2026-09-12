import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';

import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';

const createSummary = (
  attempts: AdminTestAnalyticsSummaryDto['attempts'],
  scoringKind: AdminTestAnalyticsSummaryDto['topic']['scoringKind'] = 'PROF_ORIENTATION_V3_PLUS',
): AdminTestAnalyticsSummaryDto => ({
  topic: {
    topicId: 1,
    slug: 'topic-1',
    title: 'Тест',
    questionCount: 10,
    scoringKind,
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
    analysisAiReady: attempts.length,
    analysisWithoutAi: 0,
    analysisStub: 0,
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
  afterEach(() => {
    cleanup();
  });

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
        analysisResultKind: 'AI',
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
        analysisResultKind: 'AI',
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
        analysisResultKind: 'AI',
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
        analysisResultKind: 'AI',
        llmStatus: 'not_requested',
      },
    ]);

    render(<TestAnalyticsBreakdownTables summary={summary} formatDateTime={(v) => v ?? '—'} />);

    expect(screen.getByText('ИИ ошибка')).toBeInTheDocument();
    expect(screen.getByText('ИИ в обработке')).toBeInTheDocument();
    expect(screen.getByText('ИИ готов')).toBeInTheDocument();
    expect(screen.getByText('ИИ не запрашивался')).toBeInTheDocument();
  });

  /**
   * Найдено визуальной проверкой: колонка «Анализ» этой таблицы показывала сырой `READY`, поэтому
   * заглушка выглядела здесь так же, как настоящий ИИ-анализ, хотя KPI её уже не засчитывал.
   */
  it('names the analysis source instead of printing the raw record status', () => {
    const summary = createSummary([
      {
        attemptId: 191,
        publicLinkId: 1,
        shortCode: 'MC5CKWDB',
        startedAt: '2026-09-06T18:30:00.000Z',
        finishedAt: '2026-09-06T18:36:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        analysisResultKind: 'STUB',
        llmStatus: null,
      },
    ]);

    render(<TestAnalyticsBreakdownTables summary={summary} formatDateTime={(v) => v ?? '—'} />);

    expect(screen.getByText('Заглушка, промпт не подключен')).toBeInTheDocument();
    expect(screen.queryByText('READY')).not.toBeInTheDocument();
  });

  /** Находка аудита UX-08: колонка статуса показывала сырой `COMPLETED` среди русских подписей. */
  it('names the attempt status in Russian', () => {
    const summary = createSummary([
      {
        attemptId: 301,
        publicLinkId: 1,
        shortCode: 'LINK1',
        startedAt: '2026-09-06T18:30:00.000Z',
        finishedAt: '2026-09-06T18:36:00.000Z',
        status: 'COMPLETED',
        analysisStatus: 'READY',
        analysisResultKind: 'AI',
        llmStatus: 'ready',
      },
    ]);

    render(<TestAnalyticsBreakdownTables summary={summary} formatDateTime={(v) => v ?? '—'} />);

    expect(screen.getByText('Пройдено')).toBeInTheDocument();
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
  });

  /** Находка аудита UX-08: таблицы направлений и профилей пусты всегда, если тест не на V3+. */
  it('leaves out V3+ tables for a test that does not use the V3+ method', () => {
    render(
      <TestAnalyticsBreakdownTables
        summary={createSummary([], 'DEFAULT')}
        formatDateTime={(v) => v ?? '—'}
      />,
    );

    expect(screen.queryByText('Направления V3+')).not.toBeInTheDocument();
    expect(screen.queryByText('Баллы и пары')).not.toBeInTheDocument();
    expect(screen.queryByText('Профили и флаги')).not.toBeInTheDocument();
    expect(screen.getByText('Демография и группы')).toBeInTheDocument();
    expect(screen.getByText('Публичные ссылки')).toBeInTheDocument();
  });

  it('keeps V3+ tables for a V3+ test before its first result', () => {
    render(
      <TestAnalyticsBreakdownTables summary={createSummary([])} formatDateTime={(v) => v ?? '—'} />,
    );

    expect(screen.getByText('Направления V3+')).toBeInTheDocument();
    expect(screen.getByText('Профили и флаги')).toBeInTheDocument();
  });
});
