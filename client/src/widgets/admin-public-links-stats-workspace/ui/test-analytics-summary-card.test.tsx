import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatDateTime } from '@/shared/lib/date-format';

import { TestAnalyticsSummaryCard } from './test-analytics-summary-card';

import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';

const createSummary = (
  coverage: Partial<AdminTestAnalyticsSummaryDto['coverage']>,
  scoringKind: AdminTestAnalyticsSummaryDto['topic']['scoringKind'] = 'PROF_ORIENTATION_V3_PLUS',
): AdminTestAnalyticsSummaryDto => ({
  topic: {
    topicId: 1,
    slug: 'topic-1',
    title: 'Тест',
    questionCount: 10,
    scoringKind,
    generatedAt: '2026-09-11T00:00:00.000Z',
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
    attemptsTotal: 12,
    attemptsCompleted: 12,
    analysisReady: 0,
    analysisAiReady: 0,
    analysisWithoutAi: 0,
    analysisStub: 0,
    analysisPending: 0,
    analysisFailed: 0,
    analysisMissing: 0,
    v3Results: 0,
    ...coverage,
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

const renderCard = (summary: AdminTestAnalyticsSummaryDto) =>
  render(
    <TestAnalyticsSummaryCard
      summary={summary}
      isLoading={false}
      isFetching={false}
      isEnabled
      isError={false}
      actions={null}
    />,
  );

/**
 * Находка аудита UX-09: строка отчёта показывала «сформировано 9/11/2026, 11:00:56 PM» — формат
 * браузера — рядом с «06.09.2026, 18:36» на всех остальных экранах.
 */
describe('TestAnalyticsSummaryCard generated-at line', () => {
  afterEach(() => {
    cleanup();
  });

  it('prints the report time in the shared admin format, not the browser locale', () => {
    const summary = createSummary({});

    renderCard(summary);

    expect(
      screen.getByText(`Тест · сформировано ${formatDateTime(summary.topic.generatedAt)}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(new Date(summary.topic.generatedAt).toLocaleString('en-US'))),
    ).not.toBeInTheDocument();
  });
});

describe('TestAnalyticsSummaryCard analysis figures', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Находка аудита: 5 из 12 «готовых» анализов были заглушками, а показатель всё равно показывал
   * 100% готовности. Заглушки не должны попадать в «Готовый анализ».
   */
  it('keeps stubs out of the ready analysis figure and shows them separately', () => {
    renderCard(
      createSummary({
        attemptsTotal: 12,
        analysisReady: 7,
        analysisAiReady: 5,
        analysisWithoutAi: 2,
        analysisStub: 5,
      }),
    );

    expect(screen.getByText('Готовый анализ')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/5 с ИИ · 2 без ИИ/)).toBeInTheDocument();

    expect(screen.getByText('Заглушки без ИИ')).toBeInTheDocument();
    expect(screen.getByText(/от попыток — промпт анализа не подключен/)).toBeInTheDocument();
  });

  it('shows a zero stub figure rather than hiding the metric', () => {
    renderCard(
      createSummary({
        attemptsTotal: 4,
        analysisReady: 4,
        analysisAiReady: 4,
        analysisWithoutAi: 0,
        analysisStub: 0,
      }),
    );

    expect(screen.getByText('Заглушки без ИИ')).toBeInTheDocument();
    expect(screen.getByText('промпт анализа подключен везде')).toBeInTheDocument();
  });
});

/**
 * Находка аудита UX-08: у теста без методики V3+ отчёт показывал плитку «V3+ результаты» с
 * «0% от готового анализа» и карточки «Нет данных V3+», которые для такого теста пусты всегда.
 */
describe('TestAnalyticsSummaryCard V3+ figures', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides V3+ figures for a test that does not use the V3+ method and says why', () => {
    renderCard(createSummary({ analysisReady: 4, v3Results: 0 }, 'DEFAULT'));

    expect(screen.queryByText('V3+ результаты')).not.toBeInTheDocument();
    expect(screen.queryByText('Лидирующее направление')).not.toBeInTheDocument();
    expect(screen.queryByText('Нет данных V3+')).not.toBeInTheDocument();
    expect(screen.getByText(/не использует методику V3\+/)).toBeInTheDocument();
  });

  it('keeps V3+ figures when earlier versions of the test produced V3+ results', () => {
    renderCard(createSummary({ analysisReady: 4, v3Results: 3 }, 'DEFAULT'));

    expect(screen.getByText('V3+ результаты')).toBeInTheDocument();
    expect(screen.queryByText(/не использует методику V3\+/)).not.toBeInTheDocument();
  });

  /** Находка аудита UX-08: «Средний gap: 0%» — жаргон, и отрыв считается в баллах, а не в процентах. */
  it.each([
    [11.5, 'Лидер опережает второе направление в среднем на 11,5 балла'],
    [8, 'Лидер опережает второе направление в среднем на 8 баллов'],
  ])('explains the average lead of %s points without jargon', (gap, text) => {
    const summary = createSummary({ analysisReady: 2, v3Results: 2 });

    renderCard({
      ...summary,
      confidence: { ...summary.confidence, gap: { value: gap, total: 2 } },
    });

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText(/gap/i)).not.toBeInTheDocument();
  });

  it('says a V3+ test has no results yet instead of showing a zero share', () => {
    renderCard(createSummary({ analysisReady: 0, v3Results: 0 }));

    expect(screen.getByText('V3+ результаты')).toBeInTheDocument();
    expect(screen.getByText('результатов V3+ пока нет')).toBeInTheDocument();
    expect(screen.queryByText(/от готового анализа/)).not.toBeInTheDocument();
  });
});
